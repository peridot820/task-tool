import { z } from 'zod'

// 앱 시작 시 환경변수를 한 번 검증한다. 누락/오류면 즉시 명확한 에러로 알린다.
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL이 필요합니다'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET은 최소 32자 이상이어야 합니다'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 환경변수 오류:', parsed.error.flatten().fieldErrors)
  throw new Error('.env 설정을 확인하세요 (.env.example 참고)')
}

export const env = parsed.data
