'use client'
import { useActionState } from 'react'
import { signup } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Label htmlFor="name">이름 (선택)</Label>
        <Input id="name" name="name" type="text" autoComplete="name" />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="password">비밀번호 (8자 이상)</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError messages={state?.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  )
}
