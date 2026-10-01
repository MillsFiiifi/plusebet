import { NextResponse } from 'next/server'
import { verifyAndCreditAlphapay } from '@/lib/alphapay-credit'

export const dynamic = 'force-dynamic'

function sanitizeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/me'
  return raw
}

function redirectWith(originUrl: URL, path: string, status: string) {
  const url = new URL(path, originUrl)
  url.searchParams.set('alphapay', status)
  return NextResponse.redirect(url, 303)
}

// User-redirect callback. Our reference is baked into the URL at start time —
// the user controls this URL, so it's never trusted alone: we re-verify
// server-to-server, credit on success, then bounce back to returnPath.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = url.searchParams.get('reference') ?? ''
  const returnPath = sanitizeReturnPath(url.searchParams.get('returnPath'))

  const result = await verifyAndCreditAlphapay(reference)
  return redirectWith(url, returnPath, result.status)
}
