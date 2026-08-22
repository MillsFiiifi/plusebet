-- ============================================================================
-- 0024 — Keep the match result on each bet leg
-- ----------------------------------------------------------------------------
-- A settled ticket could only say "won" or "lost" per leg: the final score was
-- never stored, so the bet card had nothing to show a player who wants to see
-- WHY a leg went the way it did. These columns let the expanded ticket read
-- like a result slip — kickoff, sport, the full-time score, and the market the
-- leg was judged on.
--
-- kickoff / sport are stamped when the bet is placed (both are on the match the
-- player bet into); home_score / away_score / settled_at are stamped by
-- settlePendingBets when it judges the leg. All nullable: legs placed or
-- settled before this migration simply have no score, and the UI drops those
-- rows rather than inventing them.
-- ============================================================================

alter table public.bet_selections
    add column if not exists sport      text,
    add column if not exists kickoff    timestamptz,
    add column if not exists home_score integer,
    add column if not exists away_score integer,
    add column if not exists settled_at timestamptz;

-- Backfill what we still have on hand: scripted (custom) matches keep their
-- final score and kickoff, so tickets already settled against one can show a
-- result straight away instead of waiting for the next match to be judged.
-- API-feed legs can't be recovered this way — that feed has moved on.
update public.bet_selections s
   set home_score = m.home_score,
       away_score = m.away_score
  from public.custom_matches m
 where m.id::text = s.match_id
   and s.status in ('won', 'lost')
   and s.home_score is null
   and m.home_score is not null
   and m.away_score is not null;

update public.bet_selections s
   set sport   = coalesce(s.sport, m.sport),
       kickoff = coalesce(s.kickoff, m.start_time_utc)
  from public.custom_matches m
 where m.id::text = s.match_id
   and (s.sport is null or s.kickoff is null);
