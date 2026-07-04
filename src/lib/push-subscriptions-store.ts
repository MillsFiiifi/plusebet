import { supabaseServer } from '@/lib/supabase'

export interface PushSubscriptionRecord {
  endpoint: string
  userId: string
  p256dh: string
  auth: string
}

interface Row {
  endpoint: string
  user_id: string
  p256dh: string
  auth: string
}

function toRecord(r: Row): PushSubscriptionRecord {
  return { endpoint: r.endpoint, userId: r.user_id, p256dh: r.p256dh, auth: r.auth }
}

/** Upsert a device subscription (idempotent on endpoint). */
export async function saveSubscription(sub: PushSubscriptionRecord): Promise<void> {
  const { error } = await supabaseServer()
    .from('push_subscriptions')
    .upsert(
      { endpoint: sub.endpoint, user_id: sub.userId, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: 'endpoint' },
    )
  if (error) throw new Error(`pushSubs.save: ${error.message}`)
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await supabaseServer()
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) throw new Error(`pushSubs.delete: ${error.message}`)
}

export async function listSubscriptionsForUsers(
  userIds: string[],
): Promise<PushSubscriptionRecord[]> {
  if (userIds.length === 0) return []
  const { data, error } = await supabaseServer()
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)
  if (error) throw new Error(`pushSubs.listForUsers: ${error.message}`)
  return ((data ?? []) as Row[]).map(toRecord)
}
