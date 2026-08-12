"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, TrendingUp } from "lucide-react";
import { matches } from "@/lib/data";

const TRENDING = [
  "Arsenal",
  "Champions League",
  "Man City",
  "El Clasico",
  "Hearts of Oak",
];

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const close = () => {
    setQ("");
    onClose();
  };

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return matches
      .filter(
        (m) =>
          m.home.toLowerCase().includes(t) ||
          m.away.toLowerCase().includes(t) ||
          m.league.toLowerCase().includes(t),
      )
      .slice(0, 8);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/75" onClick={close} />
      <div className="relative w-full max-w-[540px] card overflow-hidden animate-rise shadow-2xl">
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[var(--color-line)]">
          <Search
            size={16}
            className="text-[var(--color-ink-faint)] shrink-0"
          />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && close()}
            placeholder="Search teams, leagues, ticket ID…"
            aria-label="Search"
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-[var(--color-ink-faint)]"
          />
          <button
            onClick={close}
            aria-label="Close search"
            className="text-[var(--color-ink-faint)] hover:text-white shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto no-scrollbar p-1.5">
          {!q && (
            <div className="p-1.5">
              <div className="flex items-center gap-1.5 px-1.5 mb-2 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                <TrendingUp size={11} /> Trending
              </div>
              <div className="flex flex-wrap gap-1.5 px-1.5">
                {TRENDING.map((t) => (
                  <button
                    key={t}
                    onClick={() => setQ(t)}
                    className="chip px-3 py-1.5"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && results.length === 0 && (
            <div className="py-10 text-center text-[12.5px] text-[var(--color-ink-faint)]">
              No matches for “{q}”.
            </div>
          )}

          {results.map((m) => (
            <Link
              key={m.id}
              href={`/match/${m.id}`}
              onClick={close}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-ctl)] px-2.5 py-2 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold text-[13px] truncate">
                  {m.home}{" "}
                  <span className="text-[var(--color-ink-faint)]">v</span>{" "}
                  {m.away}
                </div>
                <div className="text-[11px] text-[var(--color-ink-dim)] flex items-center gap-1.5 mt-0.5">
                  {m.leagueFlag} {m.league}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {m.live && <span className="live-dot" />}
                <span className="num text-[11.5px] font-bold">
                  {m.markets[0].odds.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
