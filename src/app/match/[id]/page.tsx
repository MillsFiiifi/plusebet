"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Star, Share2, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { Match as ApiMatch } from "@/lib/domain-types";
import type { Match as UiMatch } from "@/lib/types";
import { apiMatchToUi, buildMarketGroupsFromApi } from "@/lib/match-adapter";
import { useSlip } from "@/lib/store";
import { TeamBadge, CountryFlag } from "@/components/brand";
import { LiveClock } from "@/components/live-clock";
import { cn } from "@/lib/utils";

const TABS = ["All", "Main", "Goals", "Halves", "Players", "Specials"];

export default function MatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState("All");
  const { selections, toggle } = useSlip();

  const [api, setApi] = useState<ApiMatch | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/matches/${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (!res.ok) {
          setStatus("notfound");
          return;
        }
        const data = (await res.json()) as { match?: ApiMatch };
        if (cancelled) return;
        if (!data.match) {
          setStatus("notfound");
          return;
        }
        setApi(data.match);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    }
    load();
    // Keep live scores/minute fresh while the page is open.
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  if (status === "loading") {
    return (
      <AppShell tabs={false}>
        <div className="card px-4 py-14 text-center">
          <p className="text-[12.5px] text-[var(--color-ink-faint)]">
            Loading match…
          </p>
        </div>
      </AppShell>
    );
  }

  if (status === "notfound" || !api) {
    return (
      <AppShell tabs={false}>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-ink-dim)] hover:text-white mb-3 transition-colors"
        >
          <ChevronLeft size={15} /> Back to sports
        </Link>
        <div className="card px-4 py-14 text-center">
          <p className="text-[12.5px] text-[var(--color-ink-faint)] max-w-sm mx-auto">
            This match is no longer available. It may have finished or been
            removed from the feed.
          </p>
        </div>
      </AppShell>
    );
  }

  const m: UiMatch = apiMatchToUi(api);
  const groups = buildMarketGroupsFromApi(api);

  return (
    <AppShell tabs={false}>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-ink-dim)] hover:text-white mb-2.5 transition-colors"
      >
        <ChevronLeft size={15} /> Back to sports
      </Link>

      {/* match header */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-dim)] min-w-0">
            <CountryFlag url={m.leagueFlagUrl} emoji={m.leagueFlag} />
            <span className="truncate">{m.league}</span>
          </span>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button
              aria-label="Add to favourites"
              className="grid place-items-center w-7 h-7 rounded-[var(--radius-ctl)] text-[var(--color-ink-faint)] hover:text-white hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <Star size={14} />
            </button>
            <button
              aria-label="Share match"
              className="grid place-items-center w-7 h-7 rounded-[var(--radius-ctl)] text-[var(--color-ink-faint)] hover:text-white hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadge
                short={m.homeShort}
                color={m.homeColor}
                size={48}
                logo={m.homeLogo}
              />
              <span className="font-semibold text-[13.5px] text-center truncate max-w-full">
                {m.home}
              </span>
            </div>
            <div className="flex flex-col items-center shrink-0 px-2">
              {m.live ? (
                <>
                  <div className="num text-[30px] font-extrabold leading-none">
                    {m.scoreHome}
                    <span className="text-[var(--color-ink-faint)] mx-1.5">
                      :
                    </span>
                    {m.scoreAway}
                  </div>
                  <span className="flex items-center gap-1.5 mt-1.5 text-[var(--color-loss)]">
                    <span className="live-dot" />
                    <LiveClock
                      startTimeISO={m.startTimeISO}
                      sport={m.sport}
                      fallbackMinute={m.minute}
                      className="num text-[11px] font-bold"
                    />
                  </span>
                </>
              ) : (
                <>
                  <div className="text-[14px] font-bold text-[var(--color-ink-faint)]">
                    VS
                  </div>
                  <span className="num text-[11px] text-[var(--color-ink-dim)] font-semibold mt-1.5">
                    {m.kickoff}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadge
                short={m.awayShort}
                color={m.awayColor}
                size={48}
                logo={m.awayLogo}
              />
              <span className="font-semibold text-[13.5px] text-center truncate max-w-full">
                {m.away}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--color-line)]">
            <Stat label="Markets" value={`${m.marketCount}`} />
            <Stat label="Country" value={m.country} />
            <Stat label="Sport" value={m.sport} />
          </div>
        </div>
      </div>

      {/* market tabs — sticky under the 54px top bar so filters stay reachable
 while scrolling a long market list */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-4 sticky top-[54px] z-20 bg-[var(--color-bg)] py-2 -mx-2.5 px-2.5 sm:-mx-3 sm:px-3">
        {TABS.map((t) => (
          <button
            key={t}
            data-active={tab === t}
            onClick={() => setTab(t)}
            className="chip shrink-0 px-3.5 py-1.5"
          >
            {t}
          </button>
        ))}
      </div>

      {m.locked && (
        <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[12px] text-[var(--color-ink-dim)]">
          <Lock size={13} className="text-[var(--color-ink-faint)] shrink-0" />
          Betting is closed for this match
          {m.lockLabel ? ` — ${m.lockLabel.toLowerCase()}` : ""}.
        </div>
      )}

      {/* market groups */}
      <div className="space-y-2 mt-2">
        {groups.map((g, gi) => (
          <div key={gi} className="card overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
              <h3 className="font-display font-bold text-[12.5px]">
                {g.title}
              </h3>
              <span className="num text-[10.5px] text-[var(--color-ink-faint)]">
                {g.picks.length}
              </span>
            </div>
            <div
              className={cn(
                "grid gap-1.5 p-2.5",
                g.cols === 2 ? "grid-cols-2" : "grid-cols-3",
              )}
            >
              {g.picks.map((p, pi) => {
                const sid = `${m.id}-${gi}-${pi}`;
                const active = selections.some((x) => x.id === sid);
                return (
                  <button
                    key={pi}
                    data-active={active}
                    disabled={m.locked}
                    aria-pressed={active}
                    onClick={() => {
                      if (m.locked) return;
                      toggle({
                        id: sid,
                        matchId: m.id,
                        match: `${m.home} v ${m.away}`,
                        market: g.title,
                        pick: p.label,
                        odds: p.odds,
                      });
                    }}
                    className="odds-btn flex items-center justify-between gap-2 px-2.5 py-2 disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <span className="text-[11px] font-medium text-[var(--color-ink-faint)] truncate">
                      {p.label}
                    </span>
                    <span className="text-[13px] shrink-0">
                      {p.odds.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <span className="num text-[13.5px] font-bold truncate max-w-full capitalize">
        {value}
      </span>
      <span className="text-[9.5px] text-[var(--color-ink-faint)] uppercase tracking-wide mt-0.5">
        {label}
      </span>
    </div>
  );
}
