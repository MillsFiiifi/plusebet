import { NextResponse } from 'next/server'
import { findUserById } from '@/lib/users-store'
import { recordPayment, markPaymentFailed } from '@/lib/payments-store'
import { getAlphapayDomain, initialisePayment } from '@/lib/alphapay'
import { getMinFirstDeposit } from '@/lib/countries'

export const dynamic = 'force-dynamic'

interface StartBody {
  userId?: string
  amount?: number
  returnPath?: string
  purpose?: 'deposit' | 'verification'
}

function sanitizeReturnPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/me'
  return raw
}

function originFromRequest(req: Request): string {
  // Prefer the host the player is actually on, so after payment we always send
  // them back to the same site (works across domains, ignores a stale
  // NEXT_PUBLIC_APP_URL). Fall back to the configured app URL, then req.url.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) {
    const proto =
      req.headers.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(request: Request) {
  let body: StartBody
  try {
    body = (await request.json()) as StartBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const userId = (body.userId ?? '').trim()
  const amount = Number(body.amount)
  const purpose: 'deposit' | 'verification' =
    body.purpose === 'verification' ? 'verification' : 'deposit'
  const returnPath = sanitizeReturnPath(body.returnPath)

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be > 0' }, { status: 400 })
  }

  const user = await findUserById(userId)
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  // AlphaPay settles in Ghana cedis only.
  if (user.currency !== 'GHS') {
    return NextResponse.json({ error: 'this payment method is Ghana-only' }, { status: 400 })
  }

  const minDeposit = getMinFirstDeposit(user.country)
  if (amount < minDeposit) {
    return NextResponse.json(
      { error: `minimum deposit is ${user.currency} ${minDeposit.toFixed(2)}` },
      { status: 400 },
    )
  }

  const refPrefix = purpose === 'verification' ? 'AP-VRF' : 'AP-DEP'
  const reference = `${refPrefix}-${userId.slice(0, 8)}-${Date.now()}`
  const origin = originFromRequest(request)
  // Bake returnPath + our reference into the callback so it can credit
  // immediately, regardless of what query params AlphaPay appends.
  const callbackUrl = `${origin}/api/payments/alphapay/callback?returnPath=${encodeURIComponent(returnPath)}&reference=${encodeURIComponent(reference)}`

  try {
    await recordPayment({
      userId,
      reference,
      amount,
      type: 'deposit',
      status: 'pending',
      provider: 'alphapay',
      currency: user.currency,
      metadata: {
        purpose,
        returnPath,
        userName: user.name,
        userPhone: user.phone ?? null,
        country: user.country,
      },
    })
  } catch (e) {
    console.error('[alphapay/start] pending ledger write failed:', e)
  }

  try {
    const init = await initialisePayment({
      amount,
      reference,
      domain: getAlphapayDomain(request.headers.get('x-forwarded-host') ?? request.headers.get('host')),
      phone: user.phone,
      callbackUrl,
    })
    return NextResponse.json(
      { url: init.checkoutUrl, reference, amount, currency: user.currency },
      { status: 201 },
    )
  } catch (e) {
    console.error('[alphapay/start] init failed:', e)
    // Retire the pending row so it doesn't linger as a live deposit — the
    // reconcile sweep still re-checks failed rows, so a payment that did get
    // created despite this error is not stranded.
    const reason = e instanceof Error ? e.message : 'alphapay init failed'
    await markPaymentFailed(reference, reason).catch((err) =>
      console.error('[alphapay/start] pending row cleanup failed:', err),
    )
    return NextResponse.json({ error: reason }, { status: 502 })
  }
}
