import { describe, expect, it } from 'vitest'
import { parseSlackCommand, stripSlackMention } from './commands'

describe('stripSlackMention', () => {
  it('봇 멘션을 앞에서 제거한다', () => {
    expect(stripSlackMention('<@U123ABC> list')).toBe('list')
  })
})

describe('parseSlackCommand', () => {
  it('create 명령을 파싱한다', () => {
    const result = parseSlackCommand('create Fix login button | priority=high | due=2026-06-30')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command).toMatchObject({
      type: 'create',
      title: 'Fix login button',
      priority: 'high',
      dueDate: '2026-06-30',
    })
  })

  it('list 명령의 상태 필터를 파싱한다', () => {
    const result = parseSlackCommand('list done')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command).toMatchObject({ type: 'list', status: 'done' })
  })

  it('잘못된 명령은 도움말을 반환한다', () => {
    const result = parseSlackCommand('nonsense')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('@task-tool help')
  })
})
