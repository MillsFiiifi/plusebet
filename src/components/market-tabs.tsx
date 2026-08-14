"use client";

import type { MarketKey } from "@/lib/types";
import { MARKET_TABS } from "@/lib/markets-ui";

/**
 * Market selector for the fixture list. Switching re-prices every row at once,
 * so a whole league can be scanned on Over 2.5 without opening a match.
 *
 * Uses the existing `.chip` treatment rather than a new control, so it reads as
 * a sibling of the league filters already above it.
 */
export function MarketTabs({
  value,
  onChange,
}: {
  value: MarketKey;
  onChange: (k: MarketKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Odds market"
      className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3"
    >
      {MARKET_TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          data-active={value === t.key}
          onClick={() => onChange(t.key)}
          className="chip shrink-0 px-3 py-1.5"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
