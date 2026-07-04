// Flutterwave v3 "Standard" integration — the main deposit gateway for Nigeria
// (NGN) and Ghana (GHS). Korapay is the automatic fallback if this fails.
//
// Flow (mirrors Korapay's hosted checkout):
//   1. Frontend POSTs to /api/payments/flutterwave/start with userId + amount.
//   2. We POST /v3/payments and get back a hosted-checkout `link`; a pending
//      row is written to `payments` keyed on our tx_ref.
//   3. User pays on Flutterwave's page, then Flutterwave redirects to
//      /api/payments/flutterwave/callback?status=…&tx_ref=<ours>.
//   4. We verify with /v3/transactions/verify_by_reference?tx_ref=<ours> and,
//      only when data.status === 'successful' with a matching amount+currency,
//      run applyDepositCredit() — the same pipeline every other rail uses.
//   5. Defence-in-depth: Flutterwave also POSTs a webhook to
//      /api/payments/flutterwave/webhook (verified via the verif-hash header).
//
// Amounts are MAJOR units (₦1000 = 1000 / GH₵1000 = 1000), like Korapay — no
// minor-unit conversion. Trust the inner data.status, never the envelope status.

import { timingSafeEqual } from 'crypto'
import type { CurrencyCode } from '@/lib/countries'

const FLW_BASE = 'https://api.flutterwave.com/v3'

export interface FlutterwaveInitResponse {
  /** Hosted-checkout URL to redirect the customer to. */
  link: string
}

// Flutterwave verify statuses: successful, failed, pending.
export interface FlutterwaveTxData {
  id: number
  tx_ref: string
  status: 'successful' | 'failed' | 'pending' | string
  amount: number // major units
  currency: string
  customer?: { email?: string; name?: string }
}

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim()
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not configured')
  return key
}

export function getFlutterwavePublicKey(): string | null {
  return process.env.FLUTTERWAVE_PUBLIC_KEY?.trim() || null
}

export async function initialisePayment(input: {
  email: string
  name: string
  phone?: string | null
  amount: number // major units
  currency: CurrencyCode
  txRef: string
  redirectUrl: string
  title?: string
  meta?: Record<string, unknown>
}): Promise<FlutterwaveInitResponse> {
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl,
      customer: {
        email: input.email,
        name: input.name,
        phonenumber: input.phone ?? undefined,
      },
      customizations: { title: input.title ?? 'Deposit' },
      meta: input.meta ?? {},
    }),
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => ({}))) as {
    status?: string
    message?: string
    data?: FlutterwaveInitResponse
  }
  if (!res.ok || body.status !== 'success' || !body.data?.link) {
    throw new Error(
      `Flutterwave init failed: ${body.message ?? `HTTP ${res.status}`}`,
    )
  }
  return body.data
}

/**
 * Authoritatively fetch a transaction by OUR tx_ref (not Flutterwave's numeric
 * id), so the callback / webhook / reconcile paths all key off the same value.
 */
export async function verifyByReference(txRef: string): Promise<FlutterwaveTxData> {
  const res = await fetch(
    `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: 'no-store',
    },
  )
  const body = (await res.json().catch(() => ({}))) as {
    status?: string
    message?: string
    data?: FlutterwaveTxData
  }
  if (!res.ok || body.status !== 'success' || !body.data) {
    throw new Error(
      `Flutterwave verify failed: ${body.message ?? `HTTP ${res.status}`}`,
    )
  }
  return body.data
}

/**
 * Verify a v3 webhook. Flutterwave sends the static secret hash you configure
 * in the dashboard in the `verif-hash` header — a plain equality check (not an
 * HMAC). Returns false if the hash isn't configured or doesn't match.
 */
export function verifyWebhookHash(headerHash: string | null): boolean {
  const secret = process.env.FLUTTERWAVE_SECRET_HASH?.trim()
  if (!secret || !headerHash) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(headerHash.trim())
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
