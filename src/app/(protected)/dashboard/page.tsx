import Link from 'next/link'
import { getCurrentUser } from '@/features/users/queries'
import { getTasksForUser } from '@/features/tasks/queries'
import { groupTasksByStatus } from '@/features/tasks/utils'
import { TaskCreateForm } from '@/features/tasks/components/TaskCreateForm'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const tasks = await getTasksForUser(user.id)
  const tasksByStatus = groupTasksByStatus(tasks)
  const completed = tasksByStatus.done.length
  const total = tasks.length
  const completionRate = total ? Math.round((completed / total) * 100) : 0

  // 현재 시각은 서버 렌더 시점 기준으로 계산한다.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const overdue = tasks.filter(
    (task) => task.dueDate && task.status !== 'done' && task.dueDate.getTime() < now,
  ).length
  const dueSoon = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'done') return false
    const diffDays = (task.dueDate.getTime() - now) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 3
  }).length

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">오늘의 업무판</p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            안녕하세요, <span className="text-slate-200">{user.name ?? user.email}</span> 님.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            오늘 해야 할 일, 진행 중인 일, 마무리한 일을 같은 화면에서 관리합니다. 작업이
            늘어나도 상태만 바꾸면 곧바로 정리됩니다.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">전체</p>
              <p className="mt-3 text-2xl font-semibold">{total}</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">완료율</p>
              <p className="mt-3 text-2xl font-semibold">{completionRate}%</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">마감 임박</p>
              <p className="mt-3 text-2xl font-semibold">{dueSoon}</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">지연</p>
              <p className="mt-3 text-2xl font-semibold">{overdue}</p>
            </div>
          </div>
        </div>

        <TaskCreateForm />
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">상태별 보기</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">업무 흐름</h2>
          </div>
          <Link
            href="/settings"
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            프로필 설정
          </Link>
        </div>

        <TaskBoard tasksByStatus={tasksByStatus} />
      </section>
    </main>
  )
}