import { taskPriorityValues, taskStatusValues } from '@/features/tasks/validation'

export type SlackTaskStatus = (typeof taskStatusValues)[number]
export type SlackTaskPriority = (typeof taskPriorityValues)[number]

export type SlackCommand =
  | { type: 'help' }
  | { type: 'list'; status?: SlackTaskStatus }
  | { type: 'show'; taskId: string }
  | {
      type: 'create'
      title: string
      description?: string
      status?: SlackTaskStatus
      priority?: SlackTaskPriority
      dueDate?: string
    }
  | {
      type: 'update'
      taskId: string
      changes: {
        title?: string
        description?: string
        status?: SlackTaskStatus
        priority?: SlackTaskPriority
        dueDate?: string
      }
    }
  | { type: 'done'; taskId: string }
  | { type: 'delete'; taskId: string }

export type SlackCommandParseResult =
  | { ok: true; command: SlackCommand }
  | { ok: false; error: string }

const helpText = [
  '지원 명령:',
  '@task-tool help',
  '@task-tool list [todo|doing|done]',
  '@task-tool show <taskId>',
  '@task-tool create <title> | [description] | [status=todo|doing|done] | [priority=low|medium|high] | [due=YYYY-MM-DD]',
  '@task-tool update <taskId> | [title=...] | [description=...] | [status=...] | [priority=...] | [due=YYYY-MM-DD]',
  '@task-tool done <taskId>',
  '@task-tool delete <taskId>',
].join('\n')

export function buildSlackHelpText() {
  return helpText
}

export function stripSlackMention(text: string) {
  return text.replace(/^<@[^>]+>\s*/, '').trim()
}

function splitCommandText(text: string) {
  const trimmed = stripSlackMention(text)
  const [firstChunk = '', ...pipeChunks] = trimmed.split('|').map((chunk) => chunk.trim())
  const [rawCommand = '', ...headParts] = firstChunk.split(/\s+/)
  return {
    command: rawCommand.toLowerCase(),
    headText: headParts.join(' ').trim(),
    pipeChunks,
  }
}

function isStatus(value: string): value is SlackTaskStatus {
  return (taskStatusValues as readonly string[]).includes(value)
}

function isPriority(value: string): value is SlackTaskPriority {
  return (taskPriorityValues as readonly string[]).includes(value)
}

function parseDateValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed
}

function parseFieldSegments(
  segments: string[],
  options: { allowDescription?: boolean; allowBareStatus?: boolean },
) {
  const changes: {
    title?: string
    description?: string
    status?: SlackTaskStatus
    priority?: SlackTaskPriority
    dueDate?: string
  } = {}

  for (const rawSegment of segments) {
    const segment = rawSegment.trim()
    if (!segment) continue

    const equalsIndex = segment.indexOf('=')
    if (equalsIndex > 0) {
      const key = segment.slice(0, equalsIndex).trim().toLowerCase()
      const value = segment.slice(equalsIndex + 1).trim()

      if (key === 'title') {
        changes.title = value || undefined
        continue
      }
      if (key === 'description') {
        changes.description = value || undefined
        continue
      }
      if (key === 'status') {
        if (!isStatus(value)) throw new Error(helpText)
        changes.status = value
        continue
      }
      if (key === 'priority') {
        if (!isPriority(value)) throw new Error(helpText)
        changes.priority = value
        continue
      }
      if (key === 'due' || key === 'duedate') {
        changes.dueDate = parseDateValue(value)
        continue
      }

      throw new Error(helpText)
    }

    if (options.allowDescription && !changes.description) {
      changes.description = segment
      continue
    }

    if (options.allowBareStatus && !changes.status && isStatus(segment)) {
      changes.status = segment
      continue
    }

    throw new Error(helpText)
  }

  return changes
}

export function parseSlackCommand(text: string): SlackCommandParseResult {
  const { command, headText, pipeChunks } = splitCommandText(text)

  if (!command) {
    return { ok: false, error: helpText }
  }

  try {
    if (command === 'help') return { ok: true, command: { type: 'help' } }

    if (command === 'list') {
      const statusText = headText || pipeChunks[0] || ''
      if (!statusText) return { ok: true, command: { type: 'list' } }
      if (!isStatus(statusText)) return { ok: false, error: helpText }
      return { ok: true, command: { type: 'list', status: statusText } }
    }

    if (command === 'show') {
      if (!headText) return { ok: false, error: helpText }
      return { ok: true, command: { type: 'show', taskId: headText } }
    }

    if (command === 'done') {
      if (!headText) return { ok: false, error: helpText }
      return { ok: true, command: { type: 'done', taskId: headText } }
    }

    if (command === 'delete') {
      if (!headText) return { ok: false, error: helpText }
      return { ok: true, command: { type: 'delete', taskId: headText } }
    }

    if (command === 'create') {
      if (!headText) return { ok: false, error: helpText }
      const changes = parseFieldSegments(pipeChunks, { allowDescription: true })
      return {
        ok: true,
        command: {
          type: 'create',
          title: headText,
          description: changes.description,
          status: changes.status,
          priority: changes.priority,
          dueDate: changes.dueDate,
        },
      }
    }

    if (command === 'update') {
      if (!headText) return { ok: false, error: helpText }
      const changes = parseFieldSegments(pipeChunks, { allowDescription: true })
      return {
        ok: true,
        command: {
          type: 'update',
          taskId: headText,
          changes,
        },
      }
    }
  } catch {
    return { ok: false, error: helpText }
  }

  return { ok: false, error: helpText }
}
