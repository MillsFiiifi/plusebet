import { NextResponse } from 'next/server'
import { verifyAndCreditFlutterwave } from '@/lib/flutterwave-credit'

export const dynamic = 'force-dynamic'

// Poll target for the custom MoMo checkout. Re-verifies the charge by tx_ref
// and credits on success (idempotent). Returns the current status so the
// frontend can keep polling ('pending'), stop on success, or show a failure.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = (searchParams.get('reference') ?? '').trim()
  if (!reference) {
    return NextResponse.json({ error: 'reference required' }, { status: 400 })
  }

  const result = await verifyAndCreditFlutterwave(reference)
  return NextResponse.json(result)
}
