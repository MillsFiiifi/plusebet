// Live goal alerts. When a match a player has a PENDING bet on scores, push a
// notification to their phone. Works off the custom (scripted) match score,
// which ticks up off the clock — so no external API quota is used.
//
// Idempotent per goal: goal_notifications stores the last score we alerted for,
// and we only send when the score has advanced. A conditional update acts as a
// concurrency guard so two overlapping runs don't double-notify the same goal.

import { readCustomMatches } from '@/lib/custom-matches-store'
import { readBets } from '@/lib/bets-store'
import { sendPushToUsers } from '@/lib/push'
import { supabaseServer } from '@/lib/supabase'
import type { PlacedBet } from '@/lib/domain-types'

interface GoalRow {
  match_id: string
  home: number
  away: number
}

export async function runGoalAlerts(): Promise<{
  live: number
  goals: number
  pushed: number
}> {
  const matches = await readCustomMatches().catch(() => [])
  const live = matches.filter(
    (m) => m.isLive && (m.homeScore != null || m.awayScore != null),
  )
  if (live.length === 0) return { live: 0, goals: 0, pushed: 0 }

  const sb = supabaseServer()
  const ids = live.map((m) => m.id)
  const { data: prevRows } = await sb
    .from('goal_notifications')
    .select('*')
    .in('match_id', ids)
  const prev = new Map<string, GoalRow>(
    ((prevRows ?? []) as GoalRow[]).map((r) => [r.match_id, r]),
  )

  let bets: PlacedBet[] | null = null
  let goals = 0
  let pushed = 0

  for (const m of live) {
    const home = m.homeScore ?? 0
    const away = m.awayScore ?? 0
    const p = prev.get(m.id) ?? { match_id: m.id, home: 0, away: 0 }
    if (home <= p.home && away <= p.away) continue // no new goal

    // Concurrency guard: only the run that actually advances the stored score
    // gets to notify. Try a conditional update; if no row exists yet, insert.
    const now = new Date().toISOString()
    const { data: advanced } = await sb
      .from('goal_notifications')
      .update({ home, away, updated_at: now })
      .eq('match_id', m.id)
      .or(`home.lt.${home},away.lt.${away}`)
      .select('match_id')
    let won = (advanced?.length ?? 0) > 0
    if (!won) {
      const { error } = await sb
        .from('goal_notifications')
        .insert({ match_id: m.id, home, away, updated_at: now })
      won = !error // inserted → we're first; unique-violation → another run won
    }
    if (!won) continue

    goals++

    // Who to tell: everyone with a still-pending bet that has a leg on this match.
    if (!bets) bets = await readBets().catch(() => [] as PlacedBet[])
    const userIds = bets
      .filter(
        (b) =>
          b.status === 'pending' &&
          !!b.userId &&
          b.selections.some((s) => s.matchId === m.id),
      )
      .map((b) => b.userId as string)
    if (userIds.length === 0) continue

    const homeScored = home > p.home
    const awayScored = away > p.away
    const scorer = homeScored && awayScored
      ? `${m.homeTeam} & ${m.awayTeam} scored`
      : homeScored
        ? `${m.homeTeam} scored!`
        : `${m.awayTeam} scored!`

    pushed += await sendPushToUsers(userIds, {
      title: `⚽ GOAL — ${scorer}`,
      body: `${m.homeTeam} ${home}–${away} ${m.awayTeam}${m.minute ? ` · ${m.minute}` : ''}`,
      url: '/my-bets',
      // Same tag per match so a rapid duplicate replaces rather than stacks.
      tag: `goal-${m.id}-${home}-${away}`,
    })
  }

  return { live: live.length, goals, pushed }
}
