"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { formatMoneyWithCurrency } from "@/lib/format-money";

interface WinnerEntry {
  masked: string;
  amount: number;
  currency: string;
  settledAt: string;
  code: string;
}

export function WinnersTicker() {
  const [winners, setWinners] = useState<WinnerEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/winners");
        if (!res.ok) return;
        const data = (await res.json()) as { winners?: WinnerEntry[] };
        if (!cancelled) setWinners(data.winners ?? []);
      } catch {
        /* marketing prop — fail silently */
      }
    }
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Nothing to show until at least one real winner exists.
  if (winners.length === 0) return null;

  const items = [...winners, ...winners];

  return (
    <div className="mt-3 flex items-center h-8 overflow-hidden card">
      <span className="shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-[var(--color-line)]">
        <Trophy size={12} className="text-[var(--color-accent)]" />
        <span className="num text-[9.5px] font-bold tracking-[0.14em] text-[var(--color-accent)]">
          WINNERS
        </span>
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-7 whitespace-nowrap animate-[ticker_42s_linear_infinite] hover:[animation-play-state:paused] pl-6">
          {items.map((w, i) => (
            <span key={i} className="text-[11.5px] text-[var(--color-ink-dim)]">
              <span className="text-white font-semibold">{w.masked}</span> won{" "}
              {/* Accent here is money, not decoration — the one other role it holds. */}
              <span className="num font-bold text-[var(--color-accent)]">
                {formatMoneyWithCurrency(w.amount, w.currency)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
