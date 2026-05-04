import { mockClaudeResponse } from '../lib/mockClaude.js'
import { getConfiguredSecret } from '../lib/env.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, systemPrompt, maxTokens, temperature } = req.body || {}
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
  const apiKey = getConfiguredSecret('ANTHROPIC_API_KEY')

  if (!apiKey) {
    return res.status(200).json(mockClaudeResponse(messages || []))
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 1000,
        system: systemPrompt || '',
        messages,
        temperature: temperature ?? 0.8,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.error || `Anthropic API error ${response.status}`,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
