import { describe, expect, it } from 'vitest'
import { groupTasksByStatus } from './utils'

describe('groupTasksByStatus', () => {
  it('상태별로 모으고 마감일이 가까운 순으로 정렬한다', () => {
    const grouped = groupTasksByStatus([
      {
        id: '1',
        title: '가장 늦은 할 일',
        description: null,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-06-30'),
        createdAt: new Date('2026-06-20T10:00:00Z'),
        updatedAt: new Date('2026-06-20T10:00:00Z'),
      },
      {
        id: '2',
        title: '더 급한 할 일',
        description: null,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-06-24'),
        createdAt: new Date('2026-06-20T12:00:00Z'),
        updatedAt: new Date('2026-06-20T12:00:00Z'),
      },
      {
        id: '3',
        title: '진행 중',
        description: null,
        status: 'doing',
        priority: 'medium',
        dueDate: null,
        createdAt: new Date('2026-06-20T09:00:00Z'),
        updatedAt: new Date('2026-06-20T09:00:00Z'),
      },
    ])

    expect(grouped.todo.map((task) => task.id)).toEqual(['2', '1'])
    expect(grouped.doing.map((task) => task.id)).toEqual(['3'])
    expect(grouped.done).toEqual([])
  })
})