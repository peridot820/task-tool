import { taskStatusLabels, taskStatusValues } from '../validation'
import { TaskCard } from './TaskCard'
import type { TaskListItem } from '../utils'

export function TaskBoard({ tasksByStatus }: { tasksByStatus: Record<(typeof taskStatusValues)[number], TaskListItem[]> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {taskStatusValues.map((status) => (
        <section key={status} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{taskStatusLabels[status]}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {status === 'todo'
                  ? '아직 시작하지 않은 일'
                  : status === 'doing'
                    ? '지금 손에 잡고 있는 일'
                    : '완료해서 정리한 일'}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {tasksByStatus[status].length}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {tasksByStatus[status].length ? (
              tasksByStatus[status].map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                이 칸은 비어 있어요.
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}