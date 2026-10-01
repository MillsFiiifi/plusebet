import { NextResponse } from 'next/server'
import { listPaymentsForUser } from '@/lib/payments-store'
import { verifyAndCreditAlphapay } from '@/lib/alphapay-credit'

export const dynamic = 'force-dynamic'

/**
 * Safety net: re-check the user's recent pending AlphaPay deposits and credit
 * any that settled while they were away (redirect never fired / webhook missed).
 * Called on account-page load. Idempotent — verifyAndCreditAlphapay guards
 * against double-credit.
 */
export async function POST(request: Request) {
  let body: { userId?: string }
  try {
    body = (await request.json()) as { userId?: string }
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const userId = (body.userId ?? '').trim()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  let payments
  try {
    payments = await listPaymentsForUser(userId)
  } catch (e) {
    console.error('[alphapay/reconcile] list failed:', e)
    return NextResponse.json({ credited: 0, checked: 0 })
  }

  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  // `failed` is swept alongside `pending`: a start that errored after AlphaPay
  // had already created the payment (timeout, unparseable reply) leaves a
  // failed row for a payment the customer may still have approved.
  // Re-verifying is idempotent and cheap at this cutoff, and never
  // double-credits — markPaymentResolved is the atomic gate.
  const pending = payments.filter(
    (p) =>
      p.type === 'deposit' &&
      p.provider === 'alphapay' &&
      (p.status === 'pending' || p.status === 'failed') &&
      new Date(p.createdAt).getTime() >= cutoff,
  )

  let credited = 0
  for (const p of pending) {
    try {
      const r = await verifyAndCreditAlphapay(p.reference)
      if (r.status === 'success' || r.status === 'already-credited') credited++
    } catch {
      /* skip; will retry on next load */
    }
  }

  return NextResponse.json({ credited, checked: pending.length })
}
