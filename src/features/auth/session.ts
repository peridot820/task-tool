import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

const key = new TextEncoder().encode(env.SESSION_SECRET)
const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7일(초)

export type SessionPayload = { userId: string }

// 페이로드를 서명된 JWT 문자열로 만든다(순수 함수, 쿠키와 무관)
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

// JWT를 검증해 페이로드를 돌려준다. 위조/만료면 null.
export async function decrypt(token?: string): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return { userId: String(payload.userId) }
  } catch {
    return null
  }
}

// 로그인 성공 시 세션 쿠키를 굽는다(httpOnly라 JS에서 접근 불가 → XSS 안전)
export async function createSession(userId: string) {
  const token = await encrypt({ userId })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

// 현재 요청의 쿠키에서 세션을 읽어 검증한다.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return decrypt(store.get(COOKIE)?.value)
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
