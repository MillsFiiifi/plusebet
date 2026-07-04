import { NextResponse } from 'next/server'
import { saveSubscription, deleteSubscription } from '@/lib/push-subscriptions-store'

export const dynamic = 'force-dynamic'

interface Body {
  userId?: string
  subscription?: {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
  }
}

// Store a browser push subscription for goal alerts.
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const userId = (body.userId ?? '').trim()
  const sub = body.subscription
  const endpoint = sub?.endpoint
  const p256dh = sub?.keys?.p256dh
  const auth = sub?.keys?.auth

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 })
  }

  try {
    await saveSubscription({ endpoint, userId, p256dh, auth })
  } catch (e) {
    console.error('[push/subscribe] save failed:', e)
    return NextResponse.json({ error: 'could not save subscription' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// Remove a subscription (e.g. player turns alerts off).
export async function DELETE(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const endpoint = body.subscription?.endpoint
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  await deleteSubscription(endpoint).catch(() => {})
  return NextResponse.json({ ok: true })
}
