import { describe, expect, it } from 'vitest'
import { taskUpsertSchema } from './validation'

describe('taskUpsertSchema', () => {
  it('유효한 할 일 입력을 통과시킨다', () => {
    const result = taskUpsertSchema.safeParse({
      title: '주간 회의 준비',
      description: '아젠다 정리하고 자료 링크 모으기',
      status: 'doing',
      priority: 'high',
      dueDate: '2026-06-25',
    })

    expect(result.success).toBe(true)
  })

  it('빈 제목은 거른다', () => {
    const result = taskUpsertSchema.safeParse({
      title: '   ',
    })

    expect(result.success).toBe(false)
  })
})