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

const slackSchema = z
  .object({
    SLACK_SIGNING_SECRET: z.string().min(1, 'SLACK_SIGNING_SECRET이 필요합니다'),
    SLACK_BOT_TOKEN: z.string().min(1, 'SLACK_BOT_TOKEN이 필요합니다'),
    SLACK_DEFAULT_USER_EMAIL: z.string().email('SLACK_DEFAULT_USER_EMAIL 형식이 올바르지 않습니다').optional(),
    SLACK_DEFAULT_TASK_OWNER_EMAIL: z
      .string()
      .email('SLACK_DEFAULT_TASK_OWNER_EMAIL 형식이 올바르지 않습니다')
      .optional(),
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY가 필요합니다'),
    ANTHROPIC_MODEL: z.string().min(1).default('claude-sonnet-4-5'),
  })
  .refine((value) => Boolean(value.SLACK_DEFAULT_USER_EMAIL || value.SLACK_DEFAULT_TASK_OWNER_EMAIL), {
    message: 'SLACK_DEFAULT_USER_EMAIL 또는 SLACK_DEFAULT_TASK_OWNER_EMAIL이 필요합니다',
    path: ['SLACK_DEFAULT_USER_EMAIL'],
  })

export type SlackEnv = z.infer<typeof slackSchema> & {
  SLACK_DEFAULT_USER_EMAIL: string
}

export function getSlackEnv(): SlackEnv {
  const parsedSlack = slackSchema.safeParse(process.env)
  if (!parsedSlack.success) {
    console.error('❌ Slack 환경변수 오류:', parsedSlack.error.flatten().fieldErrors)
    throw new Error('Slack 환경변수를 확인하세요 (.env 참고)')
  }

  return {
    ...parsedSlack.data,
    SLACK_DEFAULT_USER_EMAIL:
      parsedSlack.data.SLACK_DEFAULT_USER_EMAIL ?? parsedSlack.data.SLACK_DEFAULT_TASK_OWNER_EMAIL ?? '',
  }
}
