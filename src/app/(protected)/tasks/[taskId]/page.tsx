import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { getTaskForUser } from '@/features/tasks/queries'
import { TaskEditForm } from '@/features/tasks/components/TaskEditForm'
import { formatTaskDate } from '@/features/tasks/utils'
import { taskPriorityLabels, taskStatusLabels } from '@/features/tasks/validation'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const task = await getTaskForUser(taskId, user.id)
  if (!task) redirect('/dashboard')

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
        >
          ← 업무판으로 돌아가기
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <TaskEditForm task={task} />

        <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">작업 정보</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">{task.title}</h1>
          </div>

          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">상태</dt>
              <dd className="font-medium text-slate-900">{taskStatusLabels[task.status]}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">우선순위</dt>
              <dd className="font-medium text-slate-900">{taskPriorityLabels[task.priority]}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">마감일</dt>
              <dd className="font-medium text-slate-900">{formatTaskDate(task.dueDate) || '없음'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">생성일</dt>
              <dd className="font-medium text-slate-900">{task.createdAt.toLocaleDateString('ko-KR')}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">수정일</dt>
              <dd className="font-medium text-slate-900">{task.updatedAt.toLocaleDateString('ko-KR')}</dd>
            </div>
          </dl>

          <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            작업 상태를 바꾸고, 메모를 수정하고, 완료한 뒤에는 다시 목록으로 돌아가서 흐름을 정리하세요.
          </div>
        </aside>
      </div>
    </main>
  )
}