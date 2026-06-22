export async function postSlackMessage(input: {
  token: string
  channel: string
  text: string
  threadTs?: string
}) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + input.token,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: input.channel,
      text: input.text,
      thread_ts: input.threadTs,
    }),
  })

  if (!response.ok) {
    throw new Error('Slack API 요청이 실패했습니다')
  }

  const data = (await response.json()) as { ok?: boolean; error?: string }
  if (!data.ok) {
    throw new Error(data.error || 'Slack API가 오류를 반환했습니다')
  }

  return data
}
