'use client'

import { useActionState } from 'react'
import { updateTask } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'
import {
  taskPriorityLabels,
  taskPriorityValues,
  taskStatusLabels,
  taskStatusValues,
} from '../validation'
import type { TaskListItem } from '../utils'

export function TaskEditForm({ task }: { task: TaskListItem }) {
  const [state, formAction, pending] = useActionState(updateTask, undefined)
  const dueDate = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ''

  return (
    <form className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" action={formAction}>
      <input type="hidden" name="taskId" value={task.id} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">상세 편집</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">업무 정보 수정</h2>
      </div>

      {state?.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
      {state?.success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" maxLength={80} defaultValue={task.title} required />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">메모</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={task.description ?? ''}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <select
            id="status"
            name="status"
            defaultValue={task.status}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
          >
            {taskStatusValues.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
          <FieldError messages={state?.fieldErrors?.status} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">우선순위</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={task.priority}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
          >
            {taskPriorityValues.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority]}
              </option>
            ))}
          </select>
          <FieldError messages={state?.fieldErrors?.priority} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">마감일</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={dueDate} />
          <FieldError messages={state?.fieldErrors?.dueDate} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-slate-950 hover:bg-slate-800">
        {pending ? '저장 중...' : '저장하기'}
      </Button>
    </form>
  )
}