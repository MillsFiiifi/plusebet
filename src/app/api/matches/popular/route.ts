import { NextResponse } from 'next/server'
import { popularMatchCounts } from '@/lib/bets-store'

export const dynamic = 'force-dynamic'

/** How far back "hot right now" looks. */
const WINDOW_HOURS = 24

/**
 * Public: how many legs each match has taken in the last day, so the fixture
 * list can flame the busy ones. Counts only — no stakes, no player identity,
 * nothing that would leak one player's action to another.
 *
 * A failure here must never take the fixture list down with it: the list is the
 * product, the flame is a garnish, so an error returns empty counts.
 */
export async function GET() {
  const sinceISO = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString()
  try {
    const counts = await popularMatchCounts(sinceISO)
    return NextResponse.json({ counts, sinceISO, windowHours: WINDOW_HOURS })
  } catch (e) {
    console.error('[matches/popular] count failed:', e)
    return NextResponse.json({ counts: {}, sinceISO, windowHours: WINDOW_HOURS })
  }
}
