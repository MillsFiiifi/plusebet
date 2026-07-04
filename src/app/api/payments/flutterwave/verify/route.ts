import { NextResponse } from 'next/server'
import { verifyAndCreditFlutterwave } from '@/lib/flutterwave-credit'

export const dynamic = 'force-dynamic'

interface VerifyBody {
  reference?: string
  tx_ref?: string
}

// JSON verify endpoint the frontend can hit after the checkout closes. Re-verifies
// against Flutterwave and runs the same credit pipeline as the redirect callback.
export async function POST(request: Request) {
  let body: VerifyBody
  try {
    body = (await request.json()) as VerifyBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const reference = (body.reference ?? body.tx_ref ?? '').trim()
  if (!reference) {
    return NextResponse.json({ error: 'reference required' }, { status: 400 })
  }

  const result = await verifyAndCreditFlutterwave(reference)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
