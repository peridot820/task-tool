import { z } from 'zod'
import type { SlackCommand } from './commands'

const anthropicResponseSchema = z.object({
  mode: z.union([z.literal('command'), z.literal('reply')]),
  command: z
    .object({
      type: z.enum(['help', 'list', 'show', 'create', 'update', 'done', 'delete']),
      taskId: z.string().optional(),
      status: z.enum(['todo', 'doing', 'done']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dueDate: z.string().optional(),
      changes: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(['todo', 'doing', 'done']).optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          dueDate: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  text: z.string().optional(),
})

export type SlackClaudeAction =
  | { mode: 'command'; command: SlackCommand }
  | { mode: 'reply'; text: string }

function toCommand(result: z.infer<typeof anthropicResponseSchema>): SlackClaudeAction | null {
  if (result.mode === 'reply') {
    if (!result.text?.trim()) return null
    return { mode: 'reply', text: result.text.trim() }
  }

  const command = result.command
  if (!command) return null

  switch (command.type) {
    case 'help':
      return { mode: 'command', command: { type: 'help' } }
    case 'list':
      return { mode: 'command', command: { type: 'list', status: command.status } }
    case 'show':
      if (!command.taskId) return null
      return { mode: 'command', command: { type: 'show', taskId: command.taskId } }
    case 'create':
      if (!command.title) return null
      return {
        mode: 'command',
        command: {
          type: 'create',
          title: command.title,
          description: command.description,
          status: command.status,
          priority: command.priority,
          dueDate: command.dueDate,
        },
      }
    case 'update':
      if (!command.taskId) return null
      return {
        mode: 'command',
        command: {
          type: 'update',
          taskId: command.taskId,
          changes: command.changes ?? {},
        },
      }
    case 'done':
      if (!command.taskId) return null
      return { mode: 'command', command: { type: 'done', taskId: command.taskId } }
    case 'delete':
      if (!command.taskId) return null
      return { mode: 'command', command: { type: 'delete', taskId: command.taskId } }
  }
}

function buildPrompt(input: {
  userText: string
  tasks: Array<{ id: string; title: string; status: string; priority: string; dueDate: string | null }>
}) {
  return [
    'You are a Slack assistant for a shared task app.',
    'Return only compact JSON with either mode="command" or mode="reply".',
    'Allowed commands are help, list, show, create, update, done, delete.',
    'If the message is a direct request to change tasks, prefer mode="command".',
    'If the request is ambiguous, return mode="reply" with a short clarification question in Korean.',
    'Use the current tasks as context.',
    '',
    'Current tasks JSON:',
    JSON.stringify(input.tasks),
    '',
    'User message:',
    input.userText,
  ].join('\n')
}

function extractJson(text: string) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return (fenced?.[1] ?? trimmed).trim()
}

export async function interpretSlackWithClaude(input: {
  apiKey: string
  model: string
  userText: string
  tasks: Array<{ id: string; title: string; status: string; priority: string; dueDate: string | null }>
}): Promise<SlackClaudeAction | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 512,
      temperature: 0,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    }),
  })

  if (!response.ok) {
    throw new Error('Anthropic API 요청이 실패했습니다')
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.find((part) => part.type === 'text')?.text
  if (!text) return null

  try {
    const parsed = anthropicResponseSchema.parse(JSON.parse(extractJson(text)))
    return toCommand(parsed)
  } catch {
    return null
  }
}
