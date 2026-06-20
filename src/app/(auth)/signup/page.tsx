import Link from 'next/link'
import { SignupForm } from '@/features/auth/components/SignupForm'

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 p-8">
      <h1 className="text-xl font-bold">회원가입</h1>
      <SignupForm />
      <p className="text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 underline">
          로그인
        </Link>
      </p>
    </main>
  )
}
