"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Clock,
  Banknote,
  Copy,
  Trophy,
} from "lucide-react";
import type { Bet, BetLeg } from "@/lib/types";
import { WinCongrats } from "./win-congrats";
import { cn, cedis } from "@/lib/utils";

// Three semantic states, explicitly. `cashout` previously used cyan, which
// now resolves to the accent — the same green as `won` — so it is given the
// neutral treatment instead. Only a real win is green.
const STATUS = {
  won: {
    label: "Won",
    cls: "bg-[var(--color-accent)]/12 text-[var(--color-accent)] border-[var(--color-accent)]/30",
    icon: Check,
  },
  lost: {
    label: "Lost",
    cls: "bg-[var(--color-loss)]/12 text-[var(--color-loss)] border-[var(--color-loss)]/30",
    icon: X,
  },
  pending: {
    label: "Pending",
    cls: "bg-[var(--color-warn)]/12 text-[var(--color-warn)] border-[var(--color-warn)]/30",
    icon: Clock,
  },
  cashout: {
    label: "Cash Out",
    cls: "bg-[var(--color-surface-3)] text-[var(--color-ink-dim)] border-[var(--color-line-2)]",
    icon: Banknote,
  },
} as const;

const LEG = {
  won: "text-[var(--color-accent)]",
  lost: "text-[var(--color-loss)]",
  pending: "text-[var(--color-warn)]",
} as const;

/**
 * One leg, opened up: when it kicked off, how the match actually finished, the
 * market it was struck on and the pick that was made. A player asking "why did
 * this lose?" can answer it here instead of guessing from a red dot.
 *
 * Every match detail is optional — legs placed or settled before the ticket
 * started keeping the score have none, so each row is dropped rather than
 * rendered empty, and such a leg degrades to the pick + odds it always showed.
 */
function LegResult({ l }: { l: BetLeg }) {
  const scored = l.homeScore != null && l.awayScore != null;
  const home = l.homeTeam ?? l.match;
  const away = l.awayTeam;

  return (
    <div className="flex rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
      <span
        className={cn(
          "w-[3px] shrink-0",
          l.result === "won"
            ? "bg-[var(--color-accent)]"
            : l.result === "lost"
              ? "bg-[var(--color-loss)]"
              : "bg-[var(--color-warn)]",
        )}
      />
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          {(l.kickoff || l.sport) && (
            <span className="num text-[10.5px] text-[var(--color-ink-faint)] truncate">
              {[l.kickoff, l.sport].filter(Boolean).join(" · ")}
            </span>
          )}
          <span
            className={cn(
              "ml-auto text-[9.5px] font-bold uppercase tracking-wide shrink-0",
              LEG[l.result],
            )}
          >
            {l.result}
          </span>
        </div>

        <div className="rounded-lg bg-[var(--color-surface-2)] px-2.5 py-2 space-y-0.5">
          <Team name={home} score={scored ? l.homeScore : undefined} />
          {away && (
            <Team name={away} score={scored ? l.awayScore : undefined} ft={scored} />
          )}
        </div>

        <dl className="mt-2 space-y-1 text-[11.5px]">
          {l.market && <Row label="Market" value={l.market} />}
          {l.outcome && <Row label="Result" value={l.outcome} />}
          <Row label="Pick" value={`${l.pick} @ ${l.odds.toFixed(2)}`} strong />
        </dl>

        {l.matchId && (
          <Link
            href={`/match/${encodeURIComponent(l.matchId)}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition"
          >
            Match Results <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Team({ name, score, ft }: { name: string; score?: number; ft?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12.5px] font-medium truncate flex-1">{name}</span>
      {ft && (
        <span className="text-[9.5px] font-bold uppercase text-[var(--color-ink-faint)]">
          FT
        </span>
      )}
      {score != null && (
        <span className="num text-[13px] font-extrabold w-4 text-right">{score}</span>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-[var(--color-ink-faint)]">{label}</dt>
      <dd
        className={cn(
          "ml-auto text-right truncate",
          strong ? "font-bold text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function BetCard({ b }: { b: Bet }) {
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const s = STATUS[b.status];
  const Icon = s.icon;
  const isWon = b.status === "won";

  return (
    <div className="card overflow-hidden">
      {isWon && (
        <WinCongrats
          open={celebrate}
          onClose={() => setCelebrate(false)}
          onDetails={() => {
            setCelebrate(false);
            setOpen(true);
          }}
          amount={b.potential}
          currency={b.currency}
          verifyCode={b.verifyCode}
          ticketId={b.id}
        />
      )}
      <button
        onClick={() => {
          // Opening a won ticket pops the celebration first (reference behaviour).
          if (isWon && !open) setCelebrate(true);
          setOpen((v) => !v);
        }}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "grid place-items-center w-10 h-10 rounded-xl border shrink-0",
            s.cls,
          )}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[13.5px]">
              {b.type === "multi" ? `${b.legs.length}-Fold Acca` : "Single"}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                s.cls,
              )}
            >
              {s.label}
            </span>
          </div>
          <div className="num text-[11px] text-[var(--color-ink-faint)] mt-0.5 flex items-center gap-1.5">
            {b.id} · {b.date}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div
              className={cn(
                "num text-[14px] font-bold",
                b.status === "won"
                  ? "text-[var(--color-accent)]"
                  : b.status === "lost"
                    ? "text-[var(--color-ink-faint)] line-through"
                    : "text-[var(--color-ink)]",
              )}
            >
              {cedis(b.potential)}
            </div>
            <div className="num text-[10px] text-[var(--color-ink-faint)]">
              @ {b.totalOdds.toFixed(2)}
            </div>
          </div>
          {/* Spelling out the affordance: a lone chevron didn't read as
              "the result of every match is in here". */}
          <span className="flex flex-col items-center gap-0.5 text-[var(--color-ink-faint)]">
            <ChevronDown
              size={16}
              className={cn("transition-transform", open && "rotate-180")}
            />
            <span className="text-[8.5px] font-bold uppercase tracking-wide">
              {open ? "Hide" : "Details"}
            </span>
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-line)] px-4 py-3 space-y-2.5 bg-[var(--color-bg-2)]/50 animate-rise">
          {b.legs.map((l, i) => (
            <LegResult key={i} l={l} />
          ))}
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-line)] text-[12px]">
            <span className="text-[var(--color-ink-dim)]">Stake</span>
            <span className="num font-bold">{cedis(b.stake)}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button className="flex items-center gap-1.5 chip px-3 py-1.5">
              <Copy size={12} /> Copy code
            </button>
            {isWon && (
              <button
                onClick={() => setCelebrate(true)}
                className="flex items-center gap-1.5 chip px-3 py-1.5 bg-[var(--color-accent)]/12 border-[var(--color-accent)]/30 text-[var(--color-accent)]"
              >
                <Trophy size={12} /> Celebrate win
              </button>
            )}
            {b.status === "pending" && (
              <button className="flex items-center gap-1.5 chip px-3 py-1.5">
                <Banknote size={12} /> Cash out{" "}
                {cedis(b.stake * b.totalOdds * 0.82)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
