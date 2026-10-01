import { NextResponse } from 'next/server'
import { verifyAndCreditAlphapay } from '@/lib/alphapay-credit'

export const dynamic = 'force-dynamic'

interface VerifyBody {
  reference?: string
}

// JSON verify endpoint the frontend can hit after the checkout closes. Re-verifies
// against AlphaPay and runs the same credit pipeline as the redirect callback.
export async function POST(request: Request) {
  let body: VerifyBody
  try {
    body = (await request.json()) as VerifyBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const reference = (body.reference ?? '').trim()
  if (!reference) {
    return NextResponse.json({ error: 'reference required' }, { status: 400 })
  }

  const result = await verifyAndCreditAlphapay(reference)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
