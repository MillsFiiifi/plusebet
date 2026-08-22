/**
 * Customer-service contact URL. Set NEXT_PUBLIC_TELEGRAM_SUPPORT_HANDLE in
 * .env.local to override the default handle. The variable is build-time
 * inlined by Next, so changes require a redeploy.
 */
const RAW_HANDLE = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_HANDLE ?? 'PrimeBet_Africa'

// Strip a leading "@" or whole URL in case someone pasted the wrong shape into the env var.
function cleanHandle(raw: string): string {
  const trimmed = raw.trim().replace(/^@+/, '')
  const m = trimmed.match(/t\.me\/([^/?#]+)/i)
  return (m ? m[1] : trimmed) || 'PrimeBet_Africa'
}

export const SUPPORT_TELEGRAM_HANDLE = cleanHandle(RAW_HANDLE)
export const SUPPORT_TELEGRAM_URL = `https://t.me/${SUPPORT_TELEGRAM_HANDLE}`

/**
 * WhatsApp line a player can tap when a deposit doesn't land. Defaults to the
 * deposit agent's number — the one already printed on that same screen — and is
 * overridden with NEXT_PUBLIC_SUPPORT_WHATSAPP (build-time inlined by Next, so
 * a change needs a redeploy). Accepts a local or international number.
 */
const RAW_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '0597018113'

/** Digits only, with Ghana's country code in front of a local 0-number. */
function toWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('233')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return digits
}

export const SUPPORT_WHATSAPP_NUMBER = RAW_WHATSAPP.trim()
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${toWhatsAppDigits(RAW_WHATSAPP)}`
