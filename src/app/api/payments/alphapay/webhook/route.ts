import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/alphapay'
import { verifyAndCreditAlphapay } from '@/lib/alphapay-credit'

export const dynamic = 'force-dynamic'

// AlphaPay webhook. Authenticity is the X-AlphaPay-Signature header — an
// HMAC-SHA256 of the RAW body keyed with the secret key, so we must read the
// body as text before parsing. Body: { event, data: { reference, … } }.
// We re-verify the transaction against the API rather than trusting the body,
// and always ack 200 on a valid signature so AlphaPay doesn't retry-storm us.
export async function POST(request: Request) {
  const raw = await request.text()

  if (!verifyWebhookSignature(raw, request.headers.get('x-alphapay-signature'))) {
    console.warn('[alphapay/webhook] signature mismatch — rejecting')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: { event?: string; data?: { reference?: string } }
  try {
    body = JSON.parse(raw) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const reference = body.data?.reference
  if (!reference) {
    return NextResponse.json({ ok: true, reason: 'no-reference' })
  }
  // Only payment events lead to a credit; ignore anything else quietly.
  if (body.event && !body.event.startsWith('payment')) {
    return NextResponse.json({ ok: true, reason: `ignored:${body.event}` })
  }

  const result = await verifyAndCreditAlphapay(reference)
  return NextResponse.json({ ok: result.ok, reason: result.status })
}
