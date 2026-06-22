import { prisma } from '@/lib/prisma'
import type { TaskListItem } from './utils'

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
} as const

export type TaskWriteInput = {
  userId: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
}

export async function listTasksForUser(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    select: taskSelect,
    orderBy: [{ createdAt: 'desc' }],
  }) as Promise<TaskListItem[]>
}

export async function getTaskForUser(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    select: taskSelect,
  }) as Promise<TaskListItem | null>
}

export async function createTaskForUser(input: TaskWriteInput) {
  return prisma.task.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
    },
    select: taskSelect,
  }) as Promise<TaskListItem>
}

export async function updateTaskForUser(
  input: TaskWriteInput & { taskId: string },
) {
  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId: input.userId },
    select: { id: true },
  })

  if (!task) return null

  return prisma.task.update({
    where: { id: task.id },
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
    },
    select: taskSelect,
  }) as Promise<TaskListItem>
}

export async function setTaskStatusForUser(
  input: { userId: string; taskId: string; status: string },
) {
  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId: input.userId },
    select: { id: true },
  })

  if (!task) return null

  return prisma.task.update({
    where: { id: task.id },
    data: { status: input.status },
    select: taskSelect,
  }) as Promise<TaskListItem>
}

export async function deleteTaskForUser(input: { userId: string; taskId: string }) {
  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId: input.userId },
    select: { id: true },
  })

  if (!task) return null

  await prisma.task.delete({ where: { id: task.id } })
  return task
}
