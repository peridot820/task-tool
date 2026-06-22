'use client'

import { useActionState } from 'react'
import { createTask } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'
import { taskPriorityLabels, taskPriorityValues } from '../validation'

export function TaskCreateForm() {
  const [state, formAction, pending] = useActionState(createTask, undefined)

  return (
    <form className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" action={formAction}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">빠른 추가</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">새 업무 만들기</h2>
      </div>

      {state?.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
      {state?.success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" maxLength={80} placeholder="예: 주간 회의 정리" required />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">메모</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-950"
          placeholder="상세 설명이나 체크리스트를 적어 두세요"
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">우선순위</Label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
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
          <Input id="dueDate" name="dueDate" type="date" />
          <FieldError messages={state?.fieldErrors?.dueDate} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-slate-950 hover:bg-slate-800">
        {pending ? '추가 중...' : '할 일 추가'}
      </Button>
    </form>
  )
}