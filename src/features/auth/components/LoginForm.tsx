'use client'
import { useActionState } from 'react'
import { login } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state?.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
