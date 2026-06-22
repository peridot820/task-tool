import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { logout } from '@/features/auth/actions'
import { Button } from '@/components/ui/Button'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 진짜 유저 검증(proxy는 쿠키 존재만 봤음). 없으면 로그인으로.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-slate-200/80 bg-[rgba(247,244,238,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-slate-950">
              Task Tool
            </Link>
            <div className="flex gap-4 text-sm text-slate-600">
              <Link href="/dashboard" className="font-medium hover:text-slate-950">
                업무판
              </Link>
              <Link href="/settings" className="font-medium hover:text-slate-950">
                설정
              </Link>
            </div>
          </div>
          <form action={logout}>
            <Button className="bg-slate-900 hover:bg-slate-800">로그아웃</Button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  )
}