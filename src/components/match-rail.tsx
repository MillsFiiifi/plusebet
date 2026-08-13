"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Match } from "@/lib/types";
import { useSlip } from "@/lib/store";
import { TeamBadge, CountryFlag } from "./brand";
import { LiveClock } from "./live-clock";

/**
 * Horizontal card rail — the "Top matches" treatment from the reference
 * layout, carrying real fixtures.
 *
 * The rail exists ALONGSIDE the dense fixture list further down, not instead
 * of it. A rail is good at showcasing a handful of matches and bad at being
 * scanned: it hides most of its content off-screen and costs a gesture per
 * card. So it takes the top few matches, and anything resembling "find me a
 * specific fixture" stays with the vertical list, which shows ~16 at once.
 */

function RailOdds({ m, idx }: { m: Match; idx: number }) {
  const mk = m.markets[idx];
  const id = `${m.id}-1x2-${mk.label}`;
  const active = useSlip((s) => s.selections.some((x) => x.id === id));
  const toggle = useSlip((s) => s.toggle);
  const label = mk.label === "1" ? m.home : mk.label === "2" ? m.away : "Draw";

  return (
    <button
      data-active={active}
      aria-pressed={active}
      disabled={m.locked}
      onClick={() => {
        if (m.locked) return;
        toggle({
          id,
          matchId: m.id,
          match: `${m.home} v ${m.away}`,
          market: "Match Result",
          pick: label,
          odds: mk.odds,
        });
      }}
      className="odds-btn flex flex-col items-center justify-center gap-0.5 py-1.5 disabled:opacity-35 disabled:cursor-not-allowed"
    >
      <span className="text-[9.5px] font-medium text-[var(--color-ink-faint)]">
        {mk.label}
      </span>
      <span className="text-[12px]">{mk.odds.toFixed(2)}</span>
    </button>
  );
}

function RailCard({ m }: { m: Match }) {
  return (
    <div className="card card-hover w-[228px] overflow-hidden">
      <Link href={`/match/${m.id}`} className="block">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <CountryFlag url={m.leagueFlagUrl} emoji={m.leagueFlag} />
          <span className="text-[10.5px] text-[var(--color-ink-dim)] truncate flex-1 min-w-0">
            {m.league}
          </span>
          {m.live ? (
            <span className="flex items-center gap-1 text-[var(--color-loss)] shrink-0">
              <span className="live-dot" />
              <LiveClock
                startTimeISO={m.startTimeISO}
                sport={m.sport}
                fallbackMinute={m.minute}
                className="num text-[9.5px] font-bold"
              />
            </span>
          ) : (
            <span className="num text-[10px] text-[var(--color-ink-faint)] shrink-0">
              {m.kickoff}
            </span>
          )}
        </div>

        <div className="px-3 py-2.5 space-y-2">
          {(
            [
              [m.home, m.homeShort, m.homeColor, m.homeLogo, m.scoreHome],
              [m.away, m.awayShort, m.awayColor, m.awayLogo, m.scoreAway],
            ] as const
          ).map(([name, short, color, logo, score], i) => (
            <div key={i} className="flex items-center gap-2">
              <TeamBadge
                short={short}
                color={color}
                size={18}
                logo={logo}
              />
              <span className="text-[12.5px] font-medium truncate flex-1 min-w-0">
                {name}
              </span>
              {m.live && (
                <span className="num text-[13px] font-bold shrink-0">
                  {score ?? 0}
                </span>
              )}
            </div>
          ))}
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        <RailOdds m={m} idx={0} />
        <RailOdds m={m} idx={1} />
        <RailOdds m={m} idx={2} />
      </div>
    </div>
  );
}

export function MatchRail({
  title,
  matches,
  href,
  limit = 12,
}: {
  title: string;
  matches: Match[];
  href?: string;
  limit?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Arrows disable at each end rather than silently doing nothing. Read from
  // the live scroll position instead of tracking an index, so a thumb-swipe
  // and an arrow click can't disagree about where the rail is.
  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    // Content arrives async (fixtures fetch after mount) and the container is
    // responsive, so re-measure on resize as well as on scroll.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync, matches.length]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // Page by whole cards so the rail never stops mid-card.
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 10 : 240;
    const perPage = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * perPage });
  };

  if (matches.length === 0) return null;
  const shown = matches.slice(0, limit);

  return (
    <section className="mt-5">
      <div className="flex items-center gap-2 mb-2.5">
        <h2 className="font-display font-bold text-[14px] tracking-tight">
          {title}
        </h2>
        <span className="num text-[11px] text-[var(--color-ink-faint)]">
          {matches.length}
        </span>
        <div className="flex-1" />
        {href && (
          <Link
            href={href}
            className="text-[11.5px] font-semibold text-[var(--color-accent)] hover:underline"
          >
            Go to all
          </Link>
        )}
        {/* Touch devices swipe; the arrows would just eat space there. */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            className="rail-arrow"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label={`Scroll ${title} back`}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="rail-arrow"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label={`Scroll ${title} forward`}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={sync}
        className="rail no-scrollbar -mx-2.5 px-2.5 sm:mx-0 sm:px-0 pb-1"
      >
        {shown.map((m) => (
          <RailCard key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}
