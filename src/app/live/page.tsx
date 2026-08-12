"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FixtureList, SectionHead } from "@/components/match-card";
import { useMatches } from "@/lib/use-matches";

const TABS = ["All", "Football", "Basketball", "Tennis"];

export default function LivePage() {
  const [tab, setTab] = useState("All");
  const { live, today, loading } = useMatches();

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="title-bar"
          style={{ background: "var(--color-loss)" }}
        />
        <h1 className="font-display font-extrabold text-[17px]">
          Live In-Play
        </h1>
        {live.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-loss)]/30 bg-[var(--color-loss)]/10 px-2 py-0.5">
            <span className="live-dot" />
            <span className="num text-[10px] font-bold text-[var(--color-loss)]">
              {live.length}
            </span>
          </span>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
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

      {loading ? (
        <div className="card px-4 py-10 text-center">
          <p className="text-[12.5px] text-[var(--color-ink-faint)]">
            Loading live matches…
          </p>
        </div>
      ) : (
        <FixtureList
          matches={live}
          empty="No matches are in play right now. Check back closer to kickoff."
        />
      )}

      <SectionHead title="Starting Soon" more="All pre-match" href="/" />
      <FixtureList
        matches={today.slice(0, 12)}
        empty="No pre-match fixtures left today."
      />
    </AppShell>
  );
}
