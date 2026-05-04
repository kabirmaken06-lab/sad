const PLACEHOLDER_VALUES = new Set([
  'your_anthropic_api_key_here',
  'your_real_key_here',
  'your_resend_api_key_here',
  'your_google_oauth_web_client_id_here',
])

export const getConfiguredSecret = (name) => {
  const value = (process.env[name] || '').trim()
  if (!value) return ''

  const normalized = value.toLowerCase()
  if (
    PLACEHOLDER_VALUES.has(normalized) ||
    normalized.startsWith('your_') ||
    normalized.startsWith('replace_') ||
    normalized.endsWith('_here')
  ) {
    return ''
  }

  return value
}
