import { taskStatusValues } from './validation'

export type TaskListItem = {
  id: string
  title: string
  description: string | null
  status: (typeof taskStatusValues)[number]
  priority: 'low' | 'medium' | 'high'
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}

type GroupedTasks = Record<(typeof taskStatusValues)[number], TaskListItem[]>

function compareTasks(left: TaskListItem, right: TaskListItem) {
  if (left.dueDate && right.dueDate) {
    const diff = left.dueDate.getTime() - right.dueDate.getTime()
    if (diff !== 0) return diff
  }

  if (left.dueDate && !right.dueDate) return -1
  if (!left.dueDate && right.dueDate) return 1

  return right.createdAt.getTime() - left.createdAt.getTime()
}

export function groupTasksByStatus(tasks: TaskListItem[]): GroupedTasks {
  const grouped: GroupedTasks = {
    todo: [],
    doing: [],
    done: [],
  }

  for (const task of tasks) {
    grouped[task.status].push(task)
  }

  for (const status of taskStatusValues) {
    grouped[status].sort(compareTasks)
  }

  return grouped
}

export function formatTaskDate(date: Date | null | undefined) {
  if (!date) return ''
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}