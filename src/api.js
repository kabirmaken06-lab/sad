/**
 * Calls our backend proxy (/api/claude) which forwards to Anthropic.
 * In dev:  Express server on :3001 (via vite proxy)
 * In prod: Vercel serverless function at /api/claude
 */
export const callClaude = async (messages, systemPrompt = '', maxTokens = 1000) => {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, maxTokens }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.content?.find?.(block => block?.type === 'text')?.text ?? data.content?.[0]?.text ?? ''
}
