// AlphaPay hosted-checkout integration — the main deposit gateway for Ghana
// (GHS only; AlphaPay settles mobile money / cards in cedis).
// Docs: https://alphapay.edibytes.online/docs
//
// Flow (mirrors the other hosted checkouts):
//   1. Frontend POSTs to /api/payments/alphapay/start with userId + amount.
//   2. We POST /payments/initialize and get back a hosted `checkout_url`; a
//      pending row is written to `payments` keyed on our reference.
//   3. User pays on AlphaPay's page (phone prompt / SMS code handled there),
//      then AlphaPay redirects to the callback_url we baked in.
//   4. We verify with GET /payments/verify/:reference and, only when
//      status === 'success' with a matching amount+currency, run
//      applyDepositCredit() — the same pipeline every other rail uses.
//   5. Defence-in-depth: AlphaPay also POSTs a webhook to
//      /api/payments/alphapay/webhook, signed with X-AlphaPay-Signature
//      (HMAC-SHA256 of the raw body, keyed with the secret key).
//
// Amounts are MAJOR units (GH₵50 = 50.00) — not pesewas.

import { createHmac, timingSafeEqual } from 'crypto'

const ALPHAPAY_BASE = 'https://api.edibytes.online/api'

export interface AlphapayInitResponse {
  /** Hosted-checkout URL to redirect the customer to. */
  checkoutUrl: string
  id?: string
  status?: string
}

// AlphaPay statuses: pending | success | failed | otp_required.
export interface AlphapayTxData {
  id?: string | number
  reference: string
  status: 'pending' | 'success' | 'failed' | 'otp_required' | string
  /** Major units; AlphaPay returns it as a string like "50.00". */
  amount: string | number
  currency: string
  paid_at?: string
  channel?: string
}

function getSecretKey(): string {
  const key = process.env.ALPHAPAY_SECRET_KEY?.trim()
  if (!key) throw new Error('ALPHAPAY_SECRET_KEY is not configured')
  return key
}

/**
 * The whitelisted domain AlphaPay requires on every initialize call
 * (dashboard → Domains). ALPHAPAY_DOMAIN overrides; otherwise fall back to
 * the host the request came in on, so prod picks up the live domain.
 */
export function getAlphapayDomain(fallbackHost?: string | null): string {
  const explicit = process.env.ALPHAPAY_DOMAIN?.trim()
  if (explicit) return explicit.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return (fallbackHost ?? '').replace(/:\d+$/, '') || 'localhost'
}

export async function initialisePayment(input: {
  amount: number // major units, GHS
  reference: string
  domain: string
  phone?: string | null
  callbackUrl?: string
}): Promise<AlphapayInitResponse> {
  const res = await fetch(`${ALPHAPAY_BASE}/payments/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: 'GHS',
      reference: input.reference,
      domain: input.domain,
      phone_number: input.phone || undefined,
      callback_url: input.callbackUrl || undefined,
    }),
    cache: 'no-store',
  })
  // Responses are flat ({checkout_url, …}) today; tolerate a {data:{…}} wrapper.
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
  const body = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as {
    checkout_url?: string
    id?: string
    status?: string
    message?: string
    error?: string
  }
  if (!res.ok || !body.checkout_url) {
    throw new Error(
      `AlphaPay init failed: ${body.message ?? body.error ?? `HTTP ${res.status}`}`,
    )
  }
  return { checkoutUrl: body.checkout_url, id: body.id, status: body.status }
}

/**
 * Authoritatively fetch a transaction by OUR reference, so the callback /
 * webhook / reconcile paths all key off the same value.
 */
export async function verifyByReference(reference: string): Promise<AlphapayTxData> {
  const res = await fetch(
    `${ALPHAPAY_BASE}/payments/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: 'no-store',
    },
  )
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
  const body = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as
    Partial<AlphapayTxData> & { message?: string; error?: string }
  if (!res.ok || !body.status) {
    throw new Error(
      `AlphaPay verify failed: ${body.message ?? body.error ?? `HTTP ${res.status}`}`,
    )
  }
  return {
    id: body.id,
    reference: body.reference ?? reference,
    status: body.status,
    amount: body.amount ?? NaN,
    currency: body.currency ?? 'GHS',
    paid_at: body.paid_at,
    channel: body.channel,
  }
}

/**
 * Verify a webhook. AlphaPay signs the RAW request body with HMAC-SHA256
 * keyed with the secret key, sent hex-encoded in `X-AlphaPay-Signature`.
 */
export function verifyWebhookSignature(
  rawBody: string,
  headerSignature: string | null,
): boolean {
  const secret = process.env.ALPHAPAY_SECRET_KEY?.trim()
  if (!secret || !headerSignature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(headerSignature.trim().toLowerCase())
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
