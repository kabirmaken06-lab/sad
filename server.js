import express from 'express'
import { existsSync, readFileSync } from 'node:fs'
import { getConfiguredSecret } from './lib/env.js'
import { mockClaudeResponse } from './lib/mockClaude.js'
import { sendRenewalEmail } from './lib/renewalEmail.js'

const app = express()

if (existsSync('.env')) {
  const envFile = readFileSync('.env', 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!match) continue

    const key = match[1]
    let value = match[2] || ''
    value = value.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

app.use(express.json())

const ANTHROPIC_API_KEY = getConfiguredSecret('ANTHROPIC_API_KEY')
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'

if (!ANTHROPIC_API_KEY) {
  console.warn('\nANTHROPIC_API_KEY is not configured, so the dev server is using mock AI for testing.\n')
}

app.post('/api/claude', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.json(mockClaudeResponse(req.body?.messages || []))
  }

  const { messages, systemPrompt, maxTokens, temperature } = req.body

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
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

    return res.json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/send-renewal-email', async (req, res) => {
  try {
    return res.json(await sendRenewalEmail(req.body || {}))
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message })
  }
})

app.listen(3001, () => {
  console.log('Dev API proxy: http://localhost:3001')
  console.log(`Claude model: ${ANTHROPIC_MODEL}`)
})
