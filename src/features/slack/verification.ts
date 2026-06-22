import crypto from 'node:crypto'

const MAX_SKEW_SECONDS = 60 * 5

export function verifySlackRequest(input: {
  signingSecret: string
  timestamp: string | null
  signature: string | null
  rawBody: string
}) {
  const { signingSecret, timestamp, signature, rawBody } = input
  if (!timestamp || !signature) return false

  const numericTimestamp = Number(timestamp)
  if (!Number.isFinite(numericTimestamp)) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - numericTimestamp) > MAX_SKEW_SECONDS) return false

  const baseString = ['v0', timestamp, rawBody].join(':')
  const expectedSignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== actualBuffer.length) return false

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}
