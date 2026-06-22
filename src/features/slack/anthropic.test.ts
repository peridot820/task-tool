import { afterEach, describe, expect, it, vi } from 'vitest'
import { interpretSlackWithClaude } from './anthropic'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('interpretSlackWithClaude', () => {
  it('Claude가 명령 JSON을 돌려주면 파싱한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            content: [
              {
                type: 'text',
                text: '{"mode":"command","command":{"type":"list","status":"done"}}',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as never,
    )

    const result = await interpretSlackWithClaude({
      apiKey: 'sk-ant-test',
      model: 'claude-sonnet-4-5',
      userText: '완료된 일 보여줘',
      tasks: [],
    })

    expect(result).toEqual({ mode: 'command', command: { type: 'list', status: 'done' } })
  })
})
