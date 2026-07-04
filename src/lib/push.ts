import webpush from 'web-push'
import {
  listSubscriptionsForUsers,
  deleteSubscription,
} from '@/lib/push-subscriptions-store'

let configured = false

/** Configure web-push with the VAPID keys once. Returns false if unset. */
function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@example.com'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Send a push to every device of the given users. Dead subscriptions (410/404)
 * are pruned. Best-effort — never throws; returns how many were delivered.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0
  const subs = await listSubscriptionsForUsers([...new Set(userIds)]).catch(() => [])
  if (subs.length === 0) return 0

  const body = JSON.stringify(payload)
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
        sent++
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await deleteSubscription(s.endpoint).catch(() => {})
        }
      }
    }),
  )
  return sent
}
