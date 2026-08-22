// Maps the backend PlacedBet model (`@/lib/domain-types`, returned by
// /api/bets) into the UI Bet shape that BetCard / my-bets / bet-history
// render (`@/lib/types`). Pure mapping — no fetching.

import type { PlacedBet, BetSelection } from '@/lib/domain-types'
import type { Bet } from '@/lib/types'

function matchLabel(s: BetSelection): string {
  const m = s.match
  if (m && (m.homeTeam || m.awayTeam)) {
    return `${m.homeTeam ?? ''} v ${m.awayTeam ?? ''}`.trim()
  }
  return s.marketLabel ?? 'Match'
}

/** Kickoff stamp on a settled leg — "21/08/2026 22:00", like the ticket. */
function fmtKickoff(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * What the match actually finished as, for the "Result" row. Only derivable
 * from a final score on a match-result leg — other markets (over/under, BTTS)
 * would need their own judging, so they show no result line rather than a
 * wrong one.
 */
function outcomeFrom(s: BetSelection): string | undefined {
  const m = s.match
  if (m?.homeScore == null || m?.awayScore == null) return undefined
  if (m.homeScore > m.awayScore) return m.homeTeam || 'Home'
  if (m.homeScore < m.awayScore) return m.awayTeam || 'Away'
  return 'Draw'
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 17-char alphanumeric verification code, deterministic per bet — mirrors the
 * reference ticket: bet UUID hex + public code, padded, sliced to 17.
 */
function verifyCodeFor(id: string, code: string): string {
  const idHex = id.replace(/-/g, '').toUpperCase()
  return `${idHex}${code}0000000000`.slice(0, 17)
}

export function placedBetToUi(b: PlacedBet): Bet {
  const legs = (b.selections ?? []).map((s) => ({
    match: matchLabel(s),
    pick: s.outcomeLabel ?? s.marketLabel ?? '—',
    odds: Number(s.odds) || 0,
    result: (s.status ?? 'pending') as 'won' | 'lost' | 'pending',
    matchId: s.matchId,
    homeTeam: s.match?.homeTeam,
    awayTeam: s.match?.awayTeam,
    homeScore: s.match?.homeScore,
    awayScore: s.match?.awayScore,
    kickoff: fmtKickoff(s.match?.startTimeISO),
    // Stored lowercase ("football"); the ticket reads better title-cased.
    sport: s.match?.sport ? s.match.sport[0].toUpperCase() + s.match.sport.slice(1) : undefined,
    market: s.marketLabel || undefined,
    outcome: outcomeFrom(s),
  }))

  return {
    id: b.code ?? b.id,
    type: legs.length > 1 ? 'multi' : 'single',
    legs,
    stake: b.stake,
    totalOdds: b.totalOdds,
    potential: b.payout ?? b.potentialWin,
    // PlacedBet status is 'pending' | 'won' | 'lost'; the UI also models
    // 'cashout' but the API never emits it, so this maps 1:1.
    status: b.status,
    date: fmtDate(b.placedAt),
    currency: b.currency,
    verifyCode: verifyCodeFor(b.id, b.code ?? b.id),
  }
}
