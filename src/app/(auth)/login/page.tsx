import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 p-8">
      <h1 className="text-xl font-bold">로그인</h1>
      <LoginForm />
      <p className="text-sm text-gray-600">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-blue-600 underline">
          회원가입
        </Link>
      </p>
    </main>
  )
}
