"use client";

import { useMatches } from "@/lib/use-matches";

export function LiveTicker() {
  const { live, today } = useMatches();

  // Real scrolling feed: live scores first, then today's upcoming kickoffs.
  const liveItems = live.map(
    (m) =>
      `⚽ ${m.home} ${m.scoreHome ?? 0}–${m.scoreAway ?? 0} ${m.away} · ${m.minute ?? 0}'`,
  );
  const upcomingItems = today
    .slice(0, 8)
    .map((m) => `🕒 ${m.home} v ${m.away} · ${m.kickoff}`);
  const base = [...liveItems, ...upcomingItems];
  const items = base.length > 0 ? [...base, ...base] : [];

  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1600px] flex items-center h-8 overflow-hidden">
        <span className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 h-full border-r border-[var(--color-line)]">
          <span className="live-dot" />
          <span className="num text-[9.5px] font-bold tracking-[0.14em] text-[var(--color-loss)]">
            LIVE
          </span>
        </span>
        <div className="relative flex-1 overflow-hidden">
          {items.length > 0 ? (
            <div className="flex items-center gap-7 whitespace-nowrap animate-[ticker_38s_linear_infinite] hover:[animation-play-state:paused] pl-6">
              {items.map((t, i) => (
                <span
                  key={i}
                  className="text-[11.5px] text-[var(--color-ink-dim)]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="pl-6 text-[11.5px] text-[var(--color-ink-faint)]">
              No matches in play right now
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
