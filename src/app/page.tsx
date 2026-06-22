import Link from 'next/link'
import { getCurrentUser } from '@/features/users/queries'

export default async function HomePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">개인 업무 관리</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            개인 할 일을 흩어지지 않게 모으고, 진행 상태를 한눈에 보는 툴
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            로그인만 하면 오늘 해야 할 일, 진행 중인 일, 끝난 일을 같은 화면에서 정리할 수
            있습니다. 별도 설정 없이 바로 시작하세요.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                업무판 열기
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">핵심 흐름</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1. 할 일을 추가한다</li>
              <li>2. 상태를 바꾸며 진행을 추적한다</li>
              <li>3. 상세 화면에서 메모와 마감일을 수정한다</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">지금 가능한 것</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-100 px-4 py-3">회원가입 / 로그인</div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">업무 추가 / 수정 / 삭제</div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">대시보드 상태 요약</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}