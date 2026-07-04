import { NextResponse } from 'next/server'
import { verifyWebhookHash } from '@/lib/flutterwave'
import { verifyAndCreditFlutterwave } from '@/lib/flutterwave-credit'

export const dynamic = 'force-dynamic'

// Flutterwave v3 webhook. Authenticity is the static secret hash you set in the
// dashboard, sent in the `verif-hash` header. Body: { event, data: { tx_ref, … } }.
// We re-verify the transaction against the API rather than trusting the body,
// and always ack 200 on a valid hash so Flutterwave doesn't retry-storm us.
export async function POST(request: Request) {
  const secret = process.env.FLUTTERWAVE_SECRET_HASH?.trim()
  if (!secret) {
    return NextResponse.json({ ok: true, reason: 'webhook-disabled' })
  }

  if (!verifyWebhookHash(request.headers.get('verif-hash'))) {
    console.warn('[flutterwave/webhook] verif-hash mismatch — rejecting')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: { event?: string; data?: { tx_ref?: string } }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const txRef = body.data?.tx_ref
  if (!txRef) {
    return NextResponse.json({ ok: true, reason: 'no-reference' })
  }
  // Only charge events lead to a credit; ignore transfers/refunds quietly.
  if (body.event && !body.event.startsWith('charge')) {
    return NextResponse.json({ ok: true, reason: `ignored:${body.event}` })
  }

  const result = await verifyAndCreditFlutterwave(txRef)
  return NextResponse.json({ ok: result.ok, reason: result.status })
}
