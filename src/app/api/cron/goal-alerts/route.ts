import { NextResponse } from 'next/server'
import { runGoalAlerts } from '@/lib/goal-alerts'

export const dynamic = 'force-dynamic'

/**
 * Detect goals in live matches and push alerts to bettors. Point a 1-minute
 * external cron (e.g. cron-job.org) at this with `Authorization: Bearer
 * <CRON_SECRET>` so alerts fire even when nobody has the site open. It also
 * runs opportunistically from the match feed (see /api/matches).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (secret) {
    const auth = request.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }
  try {
    const result = await runGoalAlerts()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/goal-alerts] failed:', e)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
