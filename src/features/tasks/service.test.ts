import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import {
  createTaskForUser,
  deleteTaskForUser,
  listTasksForUser,
  setTaskStatusForUser,
} from './service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('task service', () => {
  it('listTasksForUser는 userId로 조회한다', async () => {
    mocks.prisma.task.findMany.mockResolvedValue([])

    await listTasksForUser('user-1')

    expect(mocks.prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      }),
    )
  })

  it('createTaskForUser는 task를 생성한다', async () => {
    mocks.prisma.task.create.mockResolvedValue({ id: 'task-1' })

    await createTaskForUser({
      userId: 'user-1',
      title: 'Fix login',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
    })

    expect(mocks.prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Fix login',
        }),
      }),
    )
  })

  it('setTaskStatusForUser는 task가 없으면 null을 돌려준다', async () => {
    mocks.prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      setTaskStatusForUser({ userId: 'user-1', taskId: 'task-1', status: 'done' }),
    ).resolves.toBeNull()
  })

  it('deleteTaskForUser는 task가 없으면 null을 돌려준다', async () => {
    mocks.prisma.task.findFirst.mockResolvedValue(null)

    await expect(deleteTaskForUser({ userId: 'user-1', taskId: 'task-1' })).resolves.toBeNull()
  })
})
