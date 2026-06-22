import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifySlackRequest } from './verification'
import crypto from 'node:crypto'

afterEach(() => {
  vi.useRealTimers()
})

function sign(secret: string, timestamp: string, body: string) {
  return (
    'v0=' +
    crypto.createHmac('sha256', secret).update(['v0', timestamp, body].join(':')).digest('hex')
  )
}

describe('verifySlackRequest', () => {
  it('유효한 서명을 통과시킨다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-22T00:00:00Z'))

    const timestamp = String(Math.floor(Date.now() / 1000))
    const body = JSON.stringify({ type: 'event_callback' })
    const signature = sign('secret', timestamp, body)

    expect(
      verifySlackRequest({
        signingSecret: 'secret',
        timestamp,
        signature,
        rawBody: body,
      }),
    ).toBe(true)
  })

  it('오래된 요청은 거른다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-22T00:00:00Z'))

    const timestamp = String(Math.floor(Date.now() / 1000) - 60 * 6)
    const body = JSON.stringify({ type: 'event_callback' })
    const signature = sign('secret', timestamp, body)

    expect(
      verifySlackRequest({
        signingSecret: 'secret',
        timestamp,
        signature,
        rawBody: body,
      }),
    ).toBe(false)
  })
})
