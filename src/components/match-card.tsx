"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ChevronDown, Lock } from "lucide-react";
import type { Match, MarketKey, MarketPick } from "@/lib/types";
import { useSlip } from "@/lib/store";
import { TeamBadge, CountryFlag } from "./brand";
import { LiveClock } from "./live-clock";
import { cn } from "@/lib/utils";
import { marketTab, oddsTrack } from "@/lib/markets-ui";

/**
 * Picks for the selected market, falling back to the 1X2 the row has always
 * carried. Returns null when the feed hasn't priced that market for this
 * fixture, which the row renders as disabled placeholders rather than hiding —
 * a row that vanished on market switch would break the column alignment that
 * makes the list scannable in the first place.
 */
function picksFor(m: Match, market: MarketKey): MarketPick[] | null {
  const board = m.board?.[market];
  if (board && board.length > 0) return board;
  if (market === "1x2") {
    return m.markets.map((mk) => ({
      key: mk.label,
      label: mk.label,
      pick: mk.label === "1" ? m.home : mk.label === "2" ? m.away : "Draw",
      odds: mk.odds,
    }));
  }
  return null;
}

/* ------------------------------------------------------------------
 One odds cell. Quiet at rest, solid accent when selected — the
 selected state is intentionally the loudest thing on the page.
 ------------------------------------------------------------------ */
function OddsCell({
  m,
  market,
  p,
}: {
  m: Match;
  market: MarketKey;
  p: MarketPick;
}) {
  // Market key is part of the id, so the same match can hold one selection per
  // market and switching tabs doesn't silently overwrite an existing pick.
  const id = `${m.id}-${market}-${p.key}`;
  const has = useSlip((s) => s.selections.some((x) => x.id === id));
  const toggle = useSlip((s) => s.toggle);
  const locked = m.locked;
  const slipLabel = marketTab(market).slipLabel;

  return (
    <button
      data-active={has}
      disabled={locked}
      aria-pressed={has}
      aria-label={`${p.pick} at ${p.odds.toFixed(2)}`}
      onClick={(e) => {
        e.preventDefault();
        if (locked) return;
        toggle({
          id,
          matchId: m.id,
          match: `${m.home} v ${m.away}`,
          market: slipLabel,
          pick: p.pick,
          odds: p.odds,
        });
      }}
      className="odds-btn flex flex-col items-center justify-center leading-none disabled:opacity-35 disabled:cursor-not-allowed"
    >
      <span className="text-[9.5px] font-semibold text-[var(--color-ink-faint)] mb-0.5">
        {p.label}
      </span>
      <span className="text-[13px]">{p.odds.toFixed(2)}</span>
    </button>
  );
}

/** Placeholder for a market this fixture isn't priced on. Never clickable. */
function OddsCellEmpty({ label }: { label: string }) {
  return (
    <span
      className="odds-btn flex flex-col items-center justify-center leading-none opacity-35 cursor-not-allowed"
      aria-label={`${label} not available`}
    >
      <span className="text-[9.5px] font-semibold text-[var(--color-ink-faint)] mb-0.5">
        {label}
      </span>
      <span className="text-[13px]">—</span>
    </span>
  );
}

/* ------------------------------------------------------------------
 Compact fixture row. Shares one grid with every other row so the
 odds columns line up down the entire page — that alignment is what
 makes a long list scannable rather than just small.
 ------------------------------------------------------------------ */
export function FixtureRow({
  m,
  market = "1x2",
}: {
  m: Match;
  market?: MarketKey;
}) {
  const tab = marketTab(market);
  const picks = picksFor(m, market);
  return (
    <div className="fixture-row">
      {/* time / live minute */}
      <div className="fx-time flex flex-col items-start justify-center min-w-0">
        {m.live ? (
          <span className="flex items-center gap-1 text-[var(--color-loss)]">
            <span className="live-dot" />
            <LiveClock
              startTimeISO={m.startTimeISO}
              sport={m.sport}
              fallbackMinute={m.minute}
              className="num text-[10.5px] font-bold"
            />
          </span>
        ) : m.locked ? (
          <span className="flex items-center gap-1 text-[var(--color-ink-faint)]">
            <Lock size={9} />
            <span className="text-[9px] font-bold uppercase">
              {m.lockLabel ?? "Closed"}
            </span>
          </span>
        ) : (
          <span className="num text-[11px] text-[var(--color-ink-dim)] font-semibold">
            {m.kickoff}
          </span>
        )}
      </div>

      {/* teams — two tight lines, score on the right when live */}
      <Link
        href={`/match/${m.id}`}
        className="fx-teams flex items-center gap-2 min-w-0 group"
      >
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="flex items-center gap-1.5 min-w-0">
            <TeamBadge
              short={m.homeShort}
              color={m.homeColor}
              size={16}
              logo={m.homeLogo}
            />
            <span className="text-[12.5px] font-semibold truncate group-hover:text-[var(--color-accent)] transition-colors">
              {m.home}
            </span>
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <TeamBadge
              short={m.awayShort}
              color={m.awayColor}
              size={16}
              logo={m.awayLogo}
            />
            <span className="text-[12.5px] font-semibold truncate group-hover:text-[var(--color-accent)] transition-colors">
              {m.away}
            </span>
          </span>
        </div>
        {m.live && (
          <div className="flex flex-col gap-1 items-center shrink-0 pl-1">
            <span className="num text-[12.5px] font-bold leading-none">
              {m.scoreHome ?? 0}
            </span>
            <span className="num text-[12.5px] font-bold leading-none">
              {m.scoreAway ?? 0}
            </span>
          </div>
        )}
      </Link>

      {/* Odds — `display: contents` on sm+ so these sit in the shared grid */}
      <div className="fx-odds">
        {picks
          ? picks.map((p) => (
              <OddsCell key={p.key} m={m} market={market} p={p} />
            ))
          : tab.headers.map((h) => <OddsCellEmpty key={h} label={h} />)}
      </div>

      {/* extra markets */}
      <Link
        href={`/match/${m.id}`}
        aria-label={`${m.marketCount} markets for ${m.home} v ${m.away}`}
        className="fx-more flex items-center justify-center gap-0.5 h-full rounded-[var(--radius-ctl)] text-[var(--color-ink-faint)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-3)] transition-colors"
      >
        <span className="num text-[10.5px] font-bold">+{m.marketCount}</span>
        <ChevronRight size={12} />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------
 League group — collapsible header over a run of rows.
 ------------------------------------------------------------------ */
export function LeagueGroup({
  league,
  flag,
  flagUrl,
  matches,
  market = "1x2",
  defaultOpen = true,
}: {
  league: string;
  flag: string;
  flagUrl?: string;
  matches: Match[];
  market?: MarketKey;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const liveCount = matches.filter((m) => m.live).length;
  const tab = marketTab(market);

  return (
    // --odds-track is set here and inherited by every row and the column key
    // below, so a two-outcome market widens its columns instead of leaving a
    // gap where the third used to be.
    <div
      className="card overflow-hidden"
      style={
        {
          "--odds-track": oddsTrack(tab.headers.length),
        } as React.CSSProperties
      }
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="league-head"
        aria-expanded={open}
      >
        <ChevronDown
          size={13}
          className={cn(
            "text-[var(--color-ink-faint)] transition-transform shrink-0",
            !open && "-rotate-90",
          )}
        />
        <CountryFlag url={flagUrl} emoji={flag} className="shrink-0" />
        <span className="truncate">{league}</span>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 text-[var(--color-loss)] shrink-0">
            <span className="live-dot" />
            <span className="num text-[10px] font-bold">{liveCount}</span>
          </span>
        )}
        <span className="num text-[10.5px] text-[var(--color-ink-faint)] ml-auto shrink-0">
          {matches.length}
        </span>
      </button>

      {open && (
        <>
          {/* Column key, so the bare 1 / X / 2 numerals are labelled once
 per group instead of on every single row. */}
          <div className="fixture-head">
            <span />
            <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-ink-faint)] font-semibold">
              Match
            </span>
            {tab.headers.map((l) => (
              <span
                key={l}
                className="text-[9.5px] text-center text-[var(--color-ink-faint)] font-semibold"
              >
                {l}
              </span>
            ))}
            <span />
          </div>
          {matches.map((m) => (
            <FixtureRow key={m.id} m={m} market={market} />
          ))}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 Groups a flat feed by league, preserving feed order.
 ------------------------------------------------------------------ */
export function FixtureList({
  matches,
  empty,
  market = "1x2",
}: {
  matches: Match[];
  empty: string;
  market?: MarketKey;
}) {
  if (matches.length === 0) {
    return (
      <div className="card px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-ink-faint)]">{empty}</p>
      </div>
    );
  }

  const groups: {
    league: string;
    flag: string;
    flagUrl?: string;
    matches: Match[];
  }[] = [];
  const index = new Map<string, number>();
  for (const m of matches) {
    let i = index.get(m.league);
    if (i === undefined) {
      i = groups.length;
      index.set(m.league, i);
      groups.push({
        league: m.league,
        flag: m.leagueFlag,
        flagUrl: m.leagueFlagUrl,
        matches: [],
      });
    }
    groups[i].matches.push(m);
  }

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <LeagueGroup
          key={g.league}
          league={g.league}
          flag={g.flag}
          flagUrl={g.flagUrl}
          matches={g.matches}
          market={market}
        />
      ))}
    </div>
  );
}

/* Compat: a single fixture in its own bordered surface. */
export function MatchCard({ m }: { m: Match }) {
  return (
    <div className="card overflow-hidden">
      <FixtureRow m={m} />
    </div>
  );
}

export function MatchRow({ m }: { m: Match }) {
  return <FixtureRow m={m} />;
}

export function SectionHead({
  title,
  more,
  href,
  accent,
}: {
  title: string;
  more?: string;
  href?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2.5 mt-5">
      <div className="flex items-center gap-2">
        <span
          className="title-bar"
          style={accent ? { background: accent } : undefined}
        />
        <h2 className="font-display font-bold text-[14px] tracking-tight">
          {title}
        </h2>
      </div>
      {more &&
        (href ? (
          <Link
            href={href}
            className="text-[11.5px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-accent)] transition-colors"
          >
            {more} →
          </Link>
        ) : (
          <span className="text-[11.5px] font-medium text-[var(--color-ink-faint)]">
            {more}
          </span>
        ))}
    </div>
  );
}
