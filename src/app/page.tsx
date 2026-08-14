"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FixtureList, SectionHead } from "@/components/match-card";
import {
  HeroPromo,
  CategoryTiles,
  StatRibbon,
  FeaturedMatch,
} from "@/components/home-sections";
import { MatchRail } from "@/components/match-rail";
import { MarketTabs } from "@/components/market-tabs";
import { WinnersTicker } from "@/components/winners-ticker";
import type { MarketKey } from "@/lib/types";
import { competitions } from "@/lib/data";
import { useMatches } from "@/lib/use-matches";

const FILTERS = ["All", "Football", "Top Leagues", "Boosted", "Ghana 🇬🇭"];

function ListSkeleton() {
  return (
    <div className="space-y-2 mt-3">
      {[0, 1, 2].map((g) => (
        <div key={g} className="card overflow-hidden">
          <div className="h-[34px] shimmer" />
          {[0, 1, 2].map((r) => (
            <div key={r} className="fixture-row">
              <div className="fx-time h-3 rounded shimmer" />
              <div className="fx-teams space-y-1.5">
                <div className="h-3 w-2/3 rounded shimmer" />
                <div className="h-3 w-1/2 rounded shimmer" />
              </div>
              <div className="fx-odds">
                <div className="h-[42px] rounded-[var(--radius-ctl)] shimmer" />
                <div className="h-[42px] rounded-[var(--radius-ctl)] shimmer" />
                <div className="h-[42px] rounded-[var(--radius-ctl)] shimmer" />
              </div>
              <div className="fx-more h-4 rounded shimmer" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [market, setMarket] = useState<MarketKey>("1x2");
  const { live, today, tomorrow, week, loading } = useMatches();
  const featured = live[0] ?? today[0] ?? week[0];

  return (
    <AppShell>
      <HeroPromo />
      <CategoryTiles />

      {/* Showcase rail. Deliberately capped and placed ABOVE the dense list
          rather than replacing it: a rail hides most of its content off-screen,
          so it suits "here are a few worth a look" and is the wrong tool for
          "find me Arsenal v Chelsea". The vertical list below still does that. */}
      <MatchRail
        title="Top matches"
        matches={live.length > 0 ? live : today}
        href={live.length > 0 ? "/live" : undefined}
      />

      <StatRibbon />
      <WinnersTicker />
      {featured && <FeaturedMatch m={featured} />}

      {/* league filter chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            data-active={filter === f}
            onClick={() => setFilter(f)}
            className="chip shrink-0 px-3 py-1.5"
          >
            {f}
          </button>
        ))}
        <div className="w-px bg-[var(--color-line)] mx-0.5 shrink-0" />
        {competitions.slice(0, 4).map((c) => (
          <button key={c.id} className="chip shrink-0 px-3 py-1.5">
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {/* Which market the odds columns price. Applies to every list below at
          once, so a whole day's fixtures can be read on Over 2.5 or GG/NG. */}
      <MarketTabs value={market} onChange={setMarket} />

      {loading ? (
        <ListSkeleton />
      ) : (
        <>
          <SectionHead
            title="Live In-Play"
            more="View all"
            href="/live"
            accent="var(--color-loss)"
          />
          <FixtureList matches={live}
            market={market} empty="No live matches right now." />

          <SectionHead title="Today" more={`${today.length} matches`} />
          <FixtureList matches={today}
            market={market} empty="No more matches today." />

          <SectionHead title="Tomorrow" more={`${tomorrow.length} matches`} />
          <FixtureList
            matches={tomorrow}
            market={market}
            empty="No fixtures listed for tomorrow yet."
          />

          <SectionHead title="This Week" more={`${week.length} matches`} />
          <FixtureList
            matches={week}
            market={market}
            empty="No upcoming fixtures this week yet."
          />
        </>
      )}
    </AppShell>
  );
}
