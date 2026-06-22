import 'server-only'

import { cache } from 'react'
import { listTasksForUser, getTaskForUser as getTaskForUserService } from './service'

export const getTasksForUser = cache(async (userId: string) => {
  return listTasksForUser(userId)
})

export const getTaskForUser = cache(async (taskId: string, userId: string) => {
  return getTaskForUserService(taskId, userId)
})
