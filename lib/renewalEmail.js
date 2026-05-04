import { getConfiguredSecret } from './env.js'

export const buildRenewalEmail = ({ name, planName, renewsAt }) => {
  const subject = `${planName} plan renewal reminder`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">Your CareerAI ${planName} plan is ending soon</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your ${planName} plan is scheduled to expire on <strong>${renewsAt}</strong>.</p>
      <p>To keep using your paid limits, open CareerAI and renew your monthly plan before that date.</p>
      <p style="margin-top:24px;color:#4b5563">CareerAI</p>
    </div>
  `
  const text = [
    `Your CareerAI ${planName} plan is ending soon`,
    '',
    `Hi ${name || 'there'},`,
    `Your ${planName} plan is scheduled to expire on ${renewsAt}.`,
    'To keep using your paid limits, open CareerAI and renew your monthly plan before that date.',
    '',
    'CareerAI',
  ].join('\n')

  return { subject, html, text }
}

export const sendRenewalEmail = async ({ to, name, planName, renewsAt }) => {
  if (!to || !to.includes('@')) {
    const error = new Error('A valid recipient email is required.')
    error.statusCode = 400
    throw error
  }

  const email = buildRenewalEmail({ name, planName, renewsAt })

  const resendApiKey = getConfiguredSecret('RESEND_API_KEY')

  if (!resendApiKey) {
    return {
      ok: true,
      mode: 'mock',
      message: `Mock renewal email prepared for ${to}. Add RESEND_API_KEY to send real email.`,
      email,
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REMINDER_FROM_EMAIL || 'CareerAI <onboarding@resend.dev>',
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || data.error || `Email provider error ${response.status}`)
    error.statusCode = response.status
    throw error
  }

  return {
    ok: true,
    mode: 'sent',
    id: data.id,
  }
}
