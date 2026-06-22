import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getUserByEmail } from '@/features/users/queries'
import {
  createTaskForUser,
  deleteTaskForUser,
  getTaskForUser,
  listTasksForUser,
  setTaskStatusForUser,
  updateTaskForUser,
} from '@/features/tasks/service'
import { buildSlackHelpText, parseSlackCommand, stripSlackMention, type SlackCommand } from './commands'
import { getSlackEnv } from '@/lib/env'
import { postSlackMessage } from './client'
import { interpretSlackWithClaude } from './anthropic'

export type SlackUrlVerificationPayload = {
  type: 'url_verification'
  challenge: string
}

export type SlackAppMentionPayload = {
  type: 'event_callback'
  event_id: string
  team_id?: string
  event: {
    type: 'app_mention'
    channel: string
    user?: string
    text: string
    ts: string
    thread_ts?: string
    bot_id?: string
  }
}

export type SlackEventPayload = SlackUrlVerificationPayload | SlackAppMentionPayload | { type: string; [key: string]: unknown }

export type SlackHandlingResult =
  | { kind: 'challenge'; challenge: string }
  | { kind: 'ignored' }
  | { kind: 'processed' }

function formatDate(date: Date | null | undefined) {
  if (!date) return '마감일 없음'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatTaskLine(task: {
  id: string
  title: string
  status: string
  priority: string
  dueDate: Date | null
}) {
  const due = task.dueDate ? ' · ' + formatDate(task.dueDate) : ''
  return '- ' + task.title + ' [' + task.status + '/' + task.priority + '] (' + task.id + ')' + due
}

function formatTaskDetail(task: {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
}) {
  return [
    '제목: ' + task.title,
    '상태: ' + task.status,
    '우선순위: ' + task.priority,
    '마감일: ' + formatDate(task.dueDate),
    '메모: ' + (task.description || '없음'),
    'ID: ' + task.id,
  ].join('\n')
}

function resolveThreadTs(event: SlackAppMentionPayload['event']) {
  return event.thread_ts || event.ts
}

function parseDueDate(value?: string) {
  if (!value) return null
  return new Date(value.includes('T') ? value : value + 'T12:00:00.000Z')
}

async function resolveOwner() {
  const slackEnv = getSlackEnv()
  const owner = await getUserByEmail(slackEnv.SLACK_DEFAULT_USER_EMAIL)
  if (!owner) {
    throw new Error('SLACK_DEFAULT_USER_EMAIL에 해당하는 사용자를 찾을 수 없습니다')
  }
  return { slackEnv, owner }
}

async function recordSlackEvent(payload: SlackEventPayload) {
  if (payload.type !== 'event_callback' || !('event_id' in payload)) return null

  const eventPayload = payload as SlackAppMentionPayload

  try {
    return await prisma.slackEvent.create({
      data: {
        eventId: eventPayload.event_id,
        teamId: eventPayload.team_id || '',
        channelId: eventPayload.event.channel,
        userId: eventPayload.event.user || null,
        payload: eventPayload,
        status: 'received',
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null
    }
    throw error
  }
}

async function markSlackEventStatus(eventId: string, status: string) {
  await prisma.slackEvent.update({
    where: { eventId },
    data: {
      status,
      processedAt: status === 'processed' ? new Date() : undefined,
    },
  })
}

async function postResponse(slackToken: string, channel: string, threadTs: string, text: string) {
  await postSlackMessage({ token: slackToken, channel, threadTs, text })
}

async function executeParsedCommand(command: SlackCommand, ownerId: string) {
  switch (command.type) {
    case 'help':
      return buildSlackHelpText()
    case 'list': {
      const tasks = await listTasksForUser(ownerId)
      const filtered = command.status ? tasks.filter((task) => task.status === command.status) : tasks
      if (!filtered.length) return '할 일이 없습니다.'
      return filtered.map(formatTaskLine).join('\n')
    }
    case 'show': {
      const task = await getTaskForUser(command.taskId, ownerId)
      if (!task) return '할 일을 찾을 수 없습니다.'
      return formatTaskDetail(task)
    }
    case 'create': {
      const task = await createTaskForUser({
        userId: ownerId,
        title: command.title,
        description: command.description ?? null,
        status: command.status || 'todo',
        priority: command.priority || 'medium',
        dueDate: parseDueDate(command.dueDate),
      })
      return '할 일을 추가했습니다.\n' + formatTaskDetail(task)
    }
    case 'update': {
      const current = await getTaskForUser(command.taskId, ownerId)
      if (!current) return '할 일을 찾을 수 없습니다.'
      const changes = command.changes
      const task = await updateTaskForUser({
        userId: ownerId,
        taskId: command.taskId,
        title: changes.title ?? current.title,
        description: changes.description !== undefined ? changes.description : current.description,
        status: changes.status ?? current.status,
        priority: changes.priority ?? current.priority,
        dueDate: changes.dueDate !== undefined ? parseDueDate(changes.dueDate) : current.dueDate,
      })
      if (!task) return '할 일을 찾을 수 없습니다.'
      return '할 일을 저장했습니다.\n' + formatTaskDetail(task)
    }
    case 'done': {
      const task = await setTaskStatusForUser({ userId: ownerId, taskId: command.taskId, status: 'done' })
      if (!task) return '할 일을 찾을 수 없습니다.'
      return '완료 처리했습니다.\n' + formatTaskDetail(task)
    }
    case 'delete': {
      const deleted = await deleteTaskForUser({ userId: ownerId, taskId: command.taskId })
      if (!deleted) return '할 일을 찾을 수 없습니다.'
      return '할 일을 삭제했습니다.\nID: ' + deleted.id
    }
  }
}

async function executeCommand(payload: SlackAppMentionPayload, ownerId: string, slackEnv: ReturnType<typeof getSlackEnv>) {
  const text = stripSlackMention(payload.event.text)
  const parsed = parseSlackCommand(text)
  if (parsed.ok) {
    return executeParsedCommand(parsed.command, ownerId)
  }

  const tasks = await listTasksForUser(ownerId)
  const aiResult = await interpretSlackWithClaude({
    apiKey: slackEnv.ANTHROPIC_API_KEY,
    model: slackEnv.ANTHROPIC_MODEL,
    userText: text,
    tasks: tasks.slice(0, 20).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    })),
  })

  if (!aiResult) {
    return parsed.error
  }

  if (aiResult.mode === 'reply') {
    return aiResult.text
  }

  return executeParsedCommand(aiResult.command, ownerId)
}

export async function handleSlackEvent(payload: SlackEventPayload): Promise<SlackHandlingResult> {
  if (payload.type === 'url_verification') {
    return { kind: 'challenge', challenge: (payload as SlackUrlVerificationPayload).challenge }
  }

  if (payload.type !== 'event_callback') return { kind: 'ignored' }
  const eventPayload = payload as SlackAppMentionPayload
  if (eventPayload.event.type !== 'app_mention') return { kind: 'ignored' }
  if (eventPayload.event.bot_id) return { kind: 'ignored' }

  const saved = await recordSlackEvent(eventPayload)
  if (!saved) return { kind: 'ignored' }

  const threadTs = resolveThreadTs(eventPayload.event)

  try {
    const { slackEnv, owner } = await resolveOwner()
    const responseText = await executeCommand(eventPayload, owner.id, slackEnv)
    await postResponse(slackEnv.SLACK_BOT_TOKEN, eventPayload.event.channel, threadTs, responseText)
    await markSlackEventStatus(eventPayload.event_id, 'processed')
    return { kind: 'processed' }
  } catch (error) {
    await markSlackEventStatus(eventPayload.event_id, 'failed')
    console.error('Slack event failed:', error)
    try {
      const slackEnv = getSlackEnv()
      await postResponse(
        slackEnv.SLACK_BOT_TOKEN,
        eventPayload.event.channel,
        threadTs,
        '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
    } catch {
      // Slack fallback도 실패하면 더 이상 할 수 있는 일이 없다.
    }
    return { kind: 'processed' }
  }
}
