import { beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'

const mocks = vi.hoisted(() => ({
  handleSlackEvent: vi.fn(),
}))

vi.mock('@/features/slack/handler', () => ({
  handleSlackEvent: mocks.handleSlackEvent,
}))

import { POST } from './route'

function sign(secret: string, timestamp: string, body: string) {
  return (
    'v0=' +
    crypto.createHmac('sha256', secret).update(['v0', timestamp, body].join(':')).digest('hex')
  )
}

beforeEach(() => {
  process.env.DATABASE_URL = 'file:./dev.db'
  process.env.SESSION_SECRET = 'change-me-to-a-long-random-string-of-32-chars-or-more'
  process.env.SLACK_SIGNING_SECRET = 'secret'
  process.env.SLACK_BOT_TOKEN = 'xoxb-test'
  process.env.SLACK_DEFAULT_USER_EMAIL = 'demo@example.com'
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
  process.env.ANTHROPIC_MODEL = 'claude-sonnet-4-5'
  mocks.handleSlackEvent.mockReset()
})

describe('Slack route', () => {
  it('url_verification challenge를 반환한다', async () => {
    const body = JSON.stringify({ type: 'url_verification', challenge: 'abc123' })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = sign('secret', timestamp, body)

    const response = await POST(
      new Request('http://localhost/api/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slack-request-timestamp': timestamp,
          'x-slack-signature': signature,
        },
        body,
      }) as never,
    )

    expect(await response.json()).toEqual({ challenge: 'abc123' })
  })

  it('잘못된 서명은 거부한다', async () => {
    const body = JSON.stringify({ type: 'event_callback' })
    const timestamp = String(Math.floor(Date.now() / 1000))

    const response = await POST(
      new Request('http://localhost/api/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slack-request-timestamp': timestamp,
          'x-slack-signature': 'v0=wrong',
        },
        body,
      }) as never,
    )

    expect(response.status).toBe(401)
  })

  it('app_mention 이벤트를 핸들러로 전달한다', async () => {
    mocks.handleSlackEvent.mockResolvedValue({ kind: 'processed' })
    const body = JSON.stringify({ type: 'event_callback', event: { type: 'app_mention' } })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = sign('secret', timestamp, body)

    const response = await POST(
      new Request('http://localhost/api/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slack-request-timestamp': timestamp,
          'x-slack-signature': signature,
        },
        body,
      }) as never,
    )

    expect(response.status).toBe(200)
    expect(mocks.handleSlackEvent).toHaveBeenCalledTimes(1)
  })
})
