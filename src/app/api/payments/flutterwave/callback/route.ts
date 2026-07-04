import { NextResponse } from 'next/server'
import { verifyAndCreditFlutterwave } from '@/lib/flutterwave-credit'

export const dynamic = 'force-dynamic'

function sanitizeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/me'
  return raw
}

function redirectWith(originUrl: URL, path: string, status: string) {
  const url = new URL(path, originUrl)
  url.searchParams.set('flutterwave', status)
  return NextResponse.redirect(url, 303)
}

// User-redirect callback. Flutterwave appends ?status=…&tx_ref=…&transaction_id=…
// We re-verify server-to-server by our tx_ref (the user controls this URL, so
// it's never trusted alone), credit on success, then bounce back to returnPath.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const txRef = url.searchParams.get('tx_ref') ?? ''
  const returnPath = sanitizeReturnPath(url.searchParams.get('returnPath'))

  const result = await verifyAndCreditFlutterwave(txRef)
  return redirectWith(url, returnPath, result.status)
}
