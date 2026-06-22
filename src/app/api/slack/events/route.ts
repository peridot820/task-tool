import { NextResponse, type NextRequest } from 'next/server'
import { handleSlackEvent } from '@/features/slack/handler'
import { verifySlackRequest } from '@/features/slack/verification'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const timestamp = request.headers.get('x-slack-request-timestamp')
  const signature = request.headers.get('x-slack-signature')
  const { getSlackEnv } = await import('@/lib/env')
  const slackEnv = getSlackEnv()

  if (
    !verifySlackRequest({
      signingSecret: slackEnv.SLACK_SIGNING_SECRET,
      timestamp,
      signature,
      rawBody,
    })
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: { type?: string; challenge?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge })
  }

  const result = await handleSlackEvent(payload as never)
  if (result.kind === 'challenge') {
    return NextResponse.json({ challenge: result.challenge })
  }

  return NextResponse.json({ ok: true })
}
