"use client";

import Link from "next/link";
import { ArrowRight, Download, ShieldCheck } from "lucide-react";
import { promos } from "@/lib/data";
import type { Match } from "@/lib/types";
import { useSlip } from "@/lib/store";
import { useMatches } from "@/lib/use-matches";
import { TeamBadge, CountryFlag } from "./brand";
import { LiveClock } from "./live-clock";

/**
 * Promo cards. Previously each carried its own gradient tone (violet / cyan /
 * emerald / gold), which put four more accents on the busiest screen. They're
 * now one neutral surface; the offer text carries the message.
 */
export function PromoStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
      {promos.map((p, i) => (
        <Link
          key={i}
          href="/account"
          className="group shrink-0 w-[210px] card card-hover p-3"
        >
          <div className="text-[10.5px] font-semibold text-[var(--color-ink-faint)]">
            {p.eyebrow}
          </div>
          <div className="font-display font-bold text-[14px] mt-1 leading-tight">
            {p.title}
          </div>
          <div className="text-[11px] text-[var(--color-ink-dim)] mt-1 leading-snug">
            {p.sub}
          </div>
          <div className="flex items-center gap-1 mt-2.5 text-[11.5px] font-bold text-[var(--color-accent)]">
            {p.cta}
            <ArrowRight
              size={12}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Quick actions + feed-derived counts. No fabricated figures. */
export function StatRibbon() {
  const { live, today, all } = useMatches();
  const tiles = [
    { val: `${live.length}`, label: "Live now" },
    { val: `${today.length}`, label: "Starting today" },
    { val: `${all.length}`, label: "Total fixtures" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
      <Link
        href="/booking"
        className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-ink-dim)] hover:text-white hover:border-[var(--color-line-2)] transition-colors"
      >
        <Download size={14} /> Load booking code
      </Link>
      <Link
        href="/verify"
        className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-ink-dim)] hover:text-white hover:border-[var(--color-line-2)] transition-colors"
      >
        <ShieldCheck size={14} /> Verify ticket
      </Link>
      {tiles.map((s, i) => (
        <div
          key={i}
          className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2"
        >
          <span className="num text-[14px] font-bold">{s.val}</span>
          <span className="text-[10.5px] text-[var(--color-ink-dim)] whitespace-nowrap">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Featured match. Same information as before minus the animated blur orbs —
 * two `blur-3xl` layers animating on an infinite loop was the most expensive
 * thing on the home screen, and it sat behind the primary betting controls.
 */
export function FeaturedMatch({ m }: { m: Match }) {
  const toggle = useSlip((s) => s.toggle);
  const sels = useSlip((s) => s.selections);
  const picks = [
    { label: "1", name: m.home, odds: m.markets[0].odds },
    { label: "X", name: "Draw", odds: m.markets[1].odds },
    { label: "2", name: m.away, odds: m.markets[2].odds },
  ];

  return (
    <div className="card overflow-hidden mt-3">
      {/* meta strip */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          Featured
        </span>
        {m.live && (
          <span className="flex items-center gap-1.5 text-[var(--color-loss)]">
            <span className="live-dot" />
            <LiveClock
              startTimeISO={m.startTimeISO}
              sport={m.sport}
              fallbackMinute={m.minute}
              className="num text-[10.5px] font-bold"
            />
          </span>
        )}
        {!m.live && m.locked && (
          <span className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--color-ink-faint)]">
            {m.lockLabel ?? "Closed"}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-dim)] ml-auto min-w-0">
          <CountryFlag url={m.leagueFlagUrl} emoji={m.leagueFlag} />
          <span className="truncate">{m.league}</span>
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/match/${m.id}`}
            className="flex flex-col items-center gap-2 flex-1 min-w-0 group"
          >
            <TeamBadge
              short={m.homeShort}
              color={m.homeColor}
              size={44}
              logo={m.homeLogo}
            />
            <span className="font-semibold text-[13px] text-center truncate max-w-full group-hover:text-[var(--color-accent)] transition-colors">
              {m.home}
            </span>
          </Link>

          <div className="flex flex-col items-center shrink-0 px-2">
            {m.live ? (
              <div className="num text-[28px] font-extrabold leading-none tracking-tight">
                {m.scoreHome ?? 0}
                <span className="text-[var(--color-ink-faint)] mx-1.5">:</span>
                {m.scoreAway ?? 0}
              </div>
            ) : (
              <>
                <div className="text-[13px] font-bold text-[var(--color-ink-faint)]">
                  VS
                </div>
                <span className="num text-[11px] text-[var(--color-ink-dim)] font-semibold mt-1">
                  {m.kickoff}
                </span>
              </>
            )}
          </div>

          <Link
            href={`/match/${m.id}`}
            className="flex flex-col items-center gap-2 flex-1 min-w-0 group"
          >
            <TeamBadge
              short={m.awayShort}
              color={m.awayColor}
              size={44}
              logo={m.awayLogo}
            />
            <span className="font-semibold text-[13px] text-center truncate max-w-full group-hover:text-[var(--color-accent)] transition-colors">
              {m.away}
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {picks.map((p) => {
            const id = `${m.id}-1x2-${p.label}`;
            const active = sels.some((x) => x.id === id);
            return (
              <button
                key={p.label}
                data-active={active}
                disabled={m.locked}
                aria-pressed={active}
                onClick={() => {
                  if (m.locked) return;
                  toggle({
                    id,
                    matchId: m.id,
                    match: `${m.home} v ${m.away}`,
                    market: "Match Result",
                    pick: p.name,
                    odds: p.odds,
                  });
                }}
                className="odds-btn flex items-center justify-between gap-2 px-3 py-2.5 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <span className="text-[11.5px] font-medium text-[var(--color-ink-faint)] truncate">
                  {p.name}
                </span>
                <span className="text-[14px] shrink-0">
                  {p.odds.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href={`/match/${m.id}`}
          className="flex items-center justify-center gap-1.5 mt-3 text-[11.5px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-accent)] transition-colors"
        >
          All {m.marketCount} markets <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
