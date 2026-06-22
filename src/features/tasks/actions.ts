'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import type { FormState } from '@/lib/forms'
import { taskIdSchema, taskStatusSchema, taskUpsertSchema } from './validation'
import {
  createTaskForUser,
  deleteTaskForUser,
  setTaskStatusForUser,
  updateTaskForUser,
} from './service'

function toDate(value?: string) {
  if (!value) return null
  return new Date(value.includes('T') ? value : value + 'T12:00:00.000Z')
}

export async function createTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = taskUpsertSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'todo',
    priority: formData.get('priority') || 'medium',
    dueDate: formData.get('dueDate'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  await createTaskForUser({
    userId: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    dueDate: toDate(parsed.data.dueDate ?? undefined),
  })

  revalidatePath('/dashboard')
  return { success: '할 일이 추가되었습니다.' }
}

export async function updateTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const idParsed = taskIdSchema.safeParse({
    taskId: formData.get('taskId'),
  })
  if (!idParsed.success) return { fieldErrors: idParsed.error.flatten().fieldErrors }

  const parsed = taskUpsertSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'todo',
    priority: formData.get('priority') || 'medium',
    dueDate: formData.get('dueDate'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const task = await updateTaskForUser({
    userId: user.id,
    taskId: idParsed.data.taskId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    dueDate: toDate(parsed.data.dueDate ?? undefined),
  })

  if (!task) return { error: '할 일을 찾을 수 없습니다.' }

  revalidatePath('/dashboard')
  revalidatePath('/tasks/' + task.id)
  return { success: '할 일이 저장되었습니다.' }
}

export async function updateTaskStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = taskStatusSchema.safeParse({
    taskId: formData.get('taskId'),
    status: formData.get('status'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const task = await setTaskStatusForUser({
    userId: user.id,
    taskId: parsed.data.taskId,
    status: parsed.data.status,
  })

  if (!task) return { error: '할 일을 찾을 수 없습니다.' }

  revalidatePath('/dashboard')
  revalidatePath('/tasks/' + task.id)
  return { success: '상태를 변경했습니다.' }
}

export async function deleteTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = taskIdSchema.safeParse({
    taskId: formData.get('taskId'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const task = await deleteTaskForUser({ userId: user.id, taskId: parsed.data.taskId })

  if (!task) return { error: '할 일을 찾을 수 없습니다.' }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
