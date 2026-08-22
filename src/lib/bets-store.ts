import { randomInt } from 'crypto'
import type { BetSelection, Match, PlacedBet } from '@/lib/domain-types'
import { supabaseServer } from '@/lib/supabase'
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/lib/countries'

export type { PlacedBet }

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

interface BetRow {
  id: string
  code: string
  user_id: string | null
  placed_at: string
  stake: number
  total_odds: number
  potential_win: number
  currency: string | null
  status: 'pending' | 'won' | 'lost'
  settled_at: string | null
  payout: number | null
}

interface BetSelectionRow {
  id: string
  bet_id: string
  match_id: string
  home_team: string
  away_team: string
  league: string
  country: string
  market_key: string
  market_label: string
  outcome_key: string
  outcome_label: string
  odds: number
  status: 'pending' | 'won' | 'lost' | null
  sport: string | null
  kickoff: string | null
  home_score: number | null
  away_score: number | null
  settled_at: string | null
}

function rowToSelection(row: BetSelectionRow): BetSelection {
  // A judged leg carries its final score, so the settled ticket can show the
  // result rather than just a green or red dot. Legs from before migration 0024
  // have none — they stay score-less and the card drops those rows.
  const scored = row.home_score != null && row.away_score != null
  const match: Match = {
    id: row.match_id,
    league: row.league,
    country: row.country,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    isLive: false,
    odds: { home: 0, draw: 0, away: 0 },
    ...(scored ? { homeScore: row.home_score!, awayScore: row.away_score!, minute: 'FT' } : {}),
    ...(row.kickoff ? { startTimeISO: row.kickoff } : {}),
    ...(row.sport ? { sport: row.sport } : {}),
  }
  return {
    id: row.id,
    matchId: row.match_id,
    match,
    marketKey: row.market_key,
    marketLabel: row.market_label,
    outcomeKey: row.outcome_key,
    outcomeLabel: row.outcome_label,
    odds: Number(row.odds),
    selection: row.market_key === '1x2'
      ? (row.outcome_key as 'home' | 'draw' | 'away')
      : undefined,
    status: row.status ?? 'pending',
  }
}

function rowToBet(row: BetRow, selections: BetSelection[]): PlacedBet {
  const currency: CurrencyCode = isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id ?? undefined,
    placedAt: row.placed_at,
    stake: Number(row.stake),
    totalOdds: Number(row.total_odds),
    potentialWin: Number(row.potential_win),
    currency,
    status: row.status,
    selections,
    settledAt: row.settled_at ?? undefined,
    payout: row.payout != null ? Number(row.payout) : undefined,
  }
}

function generateCode(length = 6): string {
  let s = ''
  for (let i = 0; i < length; i++) s += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]
  return s
}

export async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateCode()
    const { data, error } = await supabaseServer()
      .from('bets')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (error) throw new Error(`bets.generateCode: ${error.message}`)
    if (!data) return code
  }
  return generateCode(8)
}

async function loadSelectionsFor(betIds: string[]): Promise<Map<string, BetSelection[]>> {
  const map = new Map<string, BetSelection[]>()
  if (betIds.length === 0) return map
  const { data, error } = await supabaseServer()
    .from('bet_selections')
    .select('*')
    .in('bet_id', betIds)
  if (error) throw new Error(`bet_selections.load: ${error.message}`)
  for (const row of (data ?? []) as BetSelectionRow[]) {
    const existing = map.get(row.bet_id) ?? []
    existing.push(rowToSelection(row))
    map.set(row.bet_id, existing)
  }
  return map
}

export async function readBets(): Promise<PlacedBet[]> {
  const { data, error } = await supabaseServer()
    .from('bets')
    .select('*')
    .order('placed_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(`bets.readAll: ${error.message}`)
  const rows = (data ?? []) as BetRow[]
  const selectionsByBet = await loadSelectionsFor(rows.map((r) => r.id))
  return rows.map((r) => rowToBet(r, selectionsByBet.get(r.id) ?? []))
}

export async function readBetsForUser(userId: string): Promise<PlacedBet[]> {
  const { data, error } = await supabaseServer()
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(`bets.readForUser: ${error.message}`)
  const rows = (data ?? []) as BetRow[]
  const selectionsByBet = await loadSelectionsFor(rows.map((r) => r.id))
  return rows.map((r) => rowToBet(r, selectionsByBet.get(r.id) ?? []))
}

export async function findBetByCode(code: string): Promise<PlacedBet | null> {
  const upper = code.trim().toUpperCase()
  const { data, error } = await supabaseServer()
    .from('bets')
    .select('*')
    .eq('code', upper)
    .maybeSingle()
  if (error) throw new Error(`bets.findByCode: ${error.message}`)
  if (!data) return null
  const selectionsByBet = await loadSelectionsFor([data.id])
  return rowToBet(data as BetRow, selectionsByBet.get(data.id) ?? [])
}

export async function addBet(bet: PlacedBet): Promise<void> {
  const { data, error } = await supabaseServer()
    .from('bets')
    .insert({
      id: bet.id,
      code: bet.code.toUpperCase(),
      user_id: bet.userId ?? null,
      placed_at: bet.placedAt,
      stake: bet.stake,
      total_odds: bet.totalOdds,
      potential_win: bet.potentialWin,
      currency: bet.currency ?? DEFAULT_CURRENCY,
      status: bet.status,
      settled_at: bet.settledAt ?? null,
      payout: bet.payout ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`bets.add: ${error.message}`)
  const betId = data.id

  if (bet.selections.length > 0) {
    const rows = bet.selections.map((s) => ({
      bet_id: betId,
      match_id: s.matchId,
      home_team: s.match.homeTeam,
      away_team: s.match.awayTeam,
      league: s.match.league,
      country: s.match.country,
      market_key: s.marketKey,
      market_label: s.marketLabel,
      outcome_key: s.outcomeKey,
      outcome_label: s.outcomeLabel,
      odds: s.odds,
      // Kickoff and sport are known now and never again — the match feed moves
      // on, so the settled ticket would otherwise have no date to show.
      sport: s.match.sport ?? null,
      kickoff: s.match.startTimeISO ?? null,
    }))
    const { error: selErr } = await supabaseServer().from('bet_selections').insert(rows)
    if (selErr) {
      // 42703 = undefined_column: migration 0024 hasn't been run on this
      // database yet. The parent bet row is already in, so failing here would
      // leave a ticket with no legs and a stake already taken. The match
      // context is a nicety; the ticket is the product — drop the former and
      // save the latter.
      if (selErr.code !== '42703') throw new Error(`bet_selections.add: ${selErr.message}`)
      console.warn('[bets] bet_selections is missing the 0024 columns — inserting without match context')
      const legacy = rows.map(({ sport: _sport, kickoff: _kickoff, ...rest }) => rest)
      const { error: retryErr } = await supabaseServer().from('bet_selections').insert(legacy)
      if (retryErr) throw new Error(`bet_selections.add: ${retryErr.message}`)
    }
  }
}

export async function updateBet(
  id: string,
  patch: Partial<Pick<PlacedBet, 'status' | 'settledAt' | 'payout'>>,
): Promise<PlacedBet | null> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.status !== undefined) dbPatch.status = patch.status
  if (patch.settledAt !== undefined) dbPatch.settled_at = patch.settledAt
  if (patch.payout !== undefined) dbPatch.payout = patch.payout

  if (Object.keys(dbPatch).length === 0) {
    const all = await readBets()
    return all.find((b) => b.id === id) ?? null
  }

  const { data, error } = await supabaseServer()
    .from('bets')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw new Error(`bets.update: ${error.message}`)
  if (!data) return null
  const selectionsByBet = await loadSelectionsFor([data.id])
  return rowToBet(data as BetRow, selectionsByBet.get(data.id) ?? [])
}

/**
 * Settle a bet ONLY if it's still pending — a Postgres-level guard (the
 * `.eq('status','pending')` filter) so two concurrent settlers (e.g. the cron
 * and a player opening My Bets at the same moment) can't both credit the same
 * win. Returns the updated bet, or null when another path already settled it.
 */
export async function settleBetIfPending(
  id: string,
  patch: { status: 'won' | 'lost'; settledAt: string; payout: number },
): Promise<PlacedBet | null> {
  const { data, error } = await supabaseServer()
    .from('bets')
    .update({ status: patch.status, settled_at: patch.settledAt, payout: patch.payout })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle()
  if (error) throw new Error(`bets.settleIfPending: ${error.message}`)
  if (!data) return null
  const selectionsByBet = await loadSelectionsFor([data.id])
  return rowToBet(data as BetRow, selectionsByBet.get(data.id) ?? [])
}

/**
 * How many legs have been struck on each match since `sinceISO` — the signal
 * behind the "hot" flame on the fixture list. Counts selections rather than
 * tickets, so a match riding a lot of accumulators reads as busy, which is what
 * a player scanning the list is actually asking.
 */
export async function popularMatchCounts(sinceISO: string): Promise<Record<string, number>> {
  const sb = supabaseServer()
  const { data: betRows, error } = await sb
    .from('bets')
    .select('id')
    .gte('placed_at', sinceISO)
  if (error) throw new Error(`bets.popularIds: ${error.message}`)

  const ids = (betRows ?? []).map((r) => (r as { id: string }).id)
  if (ids.length === 0) return {}

  const counts: Record<string, number> = {}
  // Chunked: a single `in` list of every recent bet id would outgrow the
  // request URL on a busy day.
  const CHUNK = 200
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error: legErr } = await sb
      .from('bet_selections')
      .select('match_id')
      .in('bet_id', ids.slice(i, i + CHUNK))
    if (legErr) throw new Error(`bets.popularCounts: ${legErr.message}`)
    for (const row of data ?? []) {
      const id = (row as { match_id: string }).match_id
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
}

/**
 * Set a single selection's result (per-leg colours on the bet card). Pass the
 * final score when the leg was judged off one — it's stored with the leg so the
 * expanded ticket can show the player what the match actually finished.
 */
export async function setSelectionStatusById(
  selectionId: string,
  status: 'won' | 'lost' | 'pending',
  score?: { home: number; away: number },
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (score) {
    patch.home_score = score.home
    patch.away_score = score.away
    patch.settled_at = new Date().toISOString()
  }
  const { error } = await supabaseServer()
    .from('bet_selections')
    .update(patch)
    .eq('id', selectionId)
  if (!error) return
  // Same fallback as the insert: on a database without migration 0024, record
  // the result and let the score go. A leg that settles without its score is
  // worth more than one that never settles.
  if (error.code !== '42703') throw new Error(`bet_selections.setStatusById: ${error.message}`)
  const { error: retryErr } = await supabaseServer()
    .from('bet_selections')
    .update({ status })
    .eq('id', selectionId)
  if (retryErr) throw new Error(`bet_selections.setStatusById: ${retryErr.message}`)
}

/**
 * Bulk-set the status of every selection on a bet (used when settling).
 * Pass 'won' to mark them all winners (cashout) or 'lost' to mark them all
 * losers. Per-leg control can come later.
 */
export async function setSelectionStatusForBet(
  betId: string,
  status: 'won' | 'lost' | 'pending',
): Promise<void> {
  const { error } = await supabaseServer()
    .from('bet_selections')
    .update({ status })
    .eq('bet_id', betId)
  if (error) throw new Error(`bet_selections.setStatus: ${error.message}`)
}

export async function deleteBet(id: string): Promise<boolean> {
  const { error, count } = await supabaseServer()
    .from('bets')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw new Error(`bets.delete: ${error.message}`)
  return (count ?? 0) > 0
}
