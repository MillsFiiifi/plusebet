-- ============================================================================
-- 0025 — Operator-flagged "best odds" fixtures
-- ----------------------------------------------------------------------------
-- The fixture list can now carry a BEST ODDS chip. It is deliberately a flag
-- the operator sets on a match, not something the app infers: we have no
-- price-comparison feed, so any computed version of that claim would be
-- decoration. The admin marks the fixtures whose prices they want to push, and
-- the chip means exactly that.
-- ============================================================================

alter table public.custom_matches
    add column if not exists boosted boolean not null default false;
 bnrn 9e