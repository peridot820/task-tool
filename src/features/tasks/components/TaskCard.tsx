import Link from 'next/link'
import { deleteTask, updateTaskStatus } from '../actions'
import { Button } from '@/components/ui/Button'
import { formatTaskDate } from '../utils'
import { taskPriorityLabels, taskStatusLabels, taskStatusValues } from '../validation'
import type { TaskListItem } from '../utils'

const statusTone: Record<TaskListItem['status'], string> = {
  todo: 'bg-slate-100 text-slate-700',
  doing: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
}

const priorityTone: Record<TaskListItem['priority'], string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-rose-100 text-rose-800',
}

export function TaskCard({ task }: { task: TaskListItem }) {
  // 현재 시각은 서버 렌더 시점 기준으로 계산한다.
  // eslint-disable-next-line react-hooks/purity
  const overdue = task.dueDate && task.status !== 'done' && task.dueDate.getTime() < Date.now()

  async function changeStatus(formData: FormData) {
    'use server'
    await updateTaskStatus(undefined, formData)
  }

  async function removeTask(formData: FormData) {
    'use server'
    await deleteTask(undefined, formData)
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/tasks/${task.id}`} className="text-base font-semibold text-slate-950 hover:underline">
            {task.title}
          </Link>
          {task.description && <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>}
        </div>

        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[task.priority]}`}>
          {taskPriorityLabels[task.priority]}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-3 py-1 font-semibold ${statusTone[task.status]}`}>
          {taskStatusLabels[task.status]}
        </span>
        {task.dueDate && (
          <span
            className={`rounded-full px-3 py-1 font-medium ${overdue ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}
          >
            {formatTaskDate(task.dueDate)}
            {overdue ? ' · 지연됨' : ''}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <form action={changeStatus} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="taskId" value={task.id} />
          <select
            name="status"
            defaultValue={task.status}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
          >
            {taskStatusValues.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-11 bg-slate-950 hover:bg-slate-800">
            상태 변경
          </Button>
        </form>

        <form action={removeTask}>
          <input type="hidden" name="taskId" value={task.id} />
          <Button type="submit" className="h-11 w-full bg-rose-600 hover:bg-rose-700">
            삭제
          </Button>
        </form>
      </div>
    </article>
  )
}