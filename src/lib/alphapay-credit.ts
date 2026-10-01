// Shared verify-then-credit pipeline for AlphaPay deposits.
//
// Used by:
//   - /api/payments/alphapay/callback  (GET, user redirect after checkout)
//   - /api/payments/alphapay/verify    (POST, frontend confirm)
//   - /api/payments/alphapay/webhook   (POST, server-to-server, HMAC-signed)
//   - /api/payments/alphapay/reconcile (POST, load-time safety net)
//
// Idempotent on our reference. We always re-verify via GET /payments/verify
// and credit only when status === 'success' with a matching amount + currency.
// The atomic markPaymentResolved gate guarantees only one path runs
// applyDepositCredit.

import { findPaymentByReference, markPaymentResolved } from '@/lib/payments-store'
import { verifyByReference } from '@/lib/alphapay'
import { applyDepositCredit } from '@/lib/deposit-credit'

export type AlphapayCreditStatus =
  | 'success'
  | 'already-credited'
  | 'missing-reference'
  | 'unknown-reference'
  | 'verify-failed'
  | 'amount-mismatch'
  | 'currency-mismatch'
  | 'no-user'
  | 'credit-failed'
  | string // pass-through for non-successful statuses (failed/pending/otp_required/…)

export interface AlphapayCreditResult {
  status: AlphapayCreditStatus
  ok: boolean
  reference: string
}

export async function verifyAndCreditAlphapay(
  ref: string,
): Promise<AlphapayCreditResult> {
  const reference = (ref ?? '').trim()
  if (!reference) {
    return { status: 'missing-reference', ok: false, reference }
  }

  const pending = await findPaymentByReference(reference)
  if (!pending) {
    return { status: 'unknown-reference', ok: false, reference }
  }

  if (pending.status === 'success') {
    return { status: 'already-credited', ok: true, reference }
  }

  let tx
  try {
    tx = await verifyByReference(reference)
  } catch (e) {
    console.error('[alphapay-credit] verify failed:', e)
    return { status: 'verify-failed', ok: false, reference }
  }

  if (tx.status !== 'success') {
    return { status: tx.status, ok: false, reference }
  }

  // AlphaPay returns major-unit amounts (often as a string like "50.00").
  // Guard against a tampered redirect by re-checking the settled amount and
  // currency against the pending row.
  const paid = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount)
  if (!Number.isFinite(paid) || paid + 0.01 < pending.amount) {
    console.error('[alphapay-credit] amount mismatch', {
      reference,
      pendingAmount: pending.amount,
      paidAmount: paid,
    })
    return { status: 'amount-mismatch', ok: false, reference }
  }
  if (tx.currency && pending.currency && tx.currency !== pending.currency) {
    console.error('[alphapay-credit] currency mismatch', {
      reference,
      pendingCurrency: pending.currency,
      paidCurrency: tx.currency,
    })
    return { status: 'currency-mismatch', ok: false, reference }
  }

  if (!pending.userId) {
    console.error('[alphapay-credit] missing userId on pending row', reference)
    return { status: 'no-user', ok: false, reference }
  }

  try {
    const resolved = await markPaymentResolved(pending.id, 'alphapay auto-verify')
    if (!resolved) {
      // Another path (redirect racing the webhook, or admin manual credit)
      // already ran the credit pipeline on this reference.
      return { status: 'already-credited', ok: true, reference }
    }
    await applyDepositCredit(pending.userId, pending.amount, { reference })
  } catch (e) {
    console.error('[alphapay-credit] credit pipeline failed:', e)
    return { status: 'credit-failed', ok: false, reference }
  }

  return { status: 'success', ok: true, reference }
}
