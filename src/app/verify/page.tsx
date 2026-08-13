"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Lock, Zap, ShieldCheck, Check, X, RotateCcw } from "lucide-react";
import { Brand } from "@/components/brand";
import { cn, cedis } from "@/lib/utils";

type LegResult = "won" | "lost" | "pending";

type Result = {
  code: string;
  status: LegResult;
  stake: number;
  odds: number;
  payout: number;
  legs: { match: string; pick: string; odds: number; result: LegResult }[];
};

// Shape returned by GET /api/bets?code=<code>
type ApiSelection = {
  outcomeLabel?: string;
  odds?: number;
  status?: LegResult;
  match?: { homeTeam?: string; awayTeam?: string };
};
type ApiBet = {
  code: string;
  status: LegResult;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  payout?: number;
  selections?: ApiSelection[];
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function verify() {
    const clean = code.trim();
    if (clean.length < 4) {
      setError("Enter a valid verification code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/bets?code=${encodeURIComponent(clean)}`);
      if (res.status === 404) {
        setError("No ticket found with that code. Check and try again.");
        return;
      }
      if (!res.ok) {
        setError("Couldn't verify right now — please try again.");
        return;
      }
      const data = (await res.json()) as { bet?: ApiBet };
      const bet = data.bet;
      if (!bet) {
        setError("No ticket found with that code. Check and try again.");
        return;
      }
      setResult({
        code: bet.code,
        status: bet.status,
        stake: bet.stake,
        odds: bet.totalOdds,
        payout: bet.payout ?? bet.potentialWin,
        legs: (bet.selections ?? []).map((s) => ({
          match: [s.match?.homeTeam, s.match?.awayTeam].filter(Boolean).join(" v ") || "Match",
          pick: s.outcomeLabel || "Selection",
          odds: Number(s.odds) || 0,
          result: s.status ?? "pending",
        })),
      });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <Link href="/" className="absolute top-5 left-5 z-10">
        <Brand size={28} />
      </Link>

      <div className="w-full max-w-[420px]">
        {!result ? (
          <div className="card animate-rise">
            <div className="p-6 sm:p-7 text-center">
              <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)] mb-5">
                <Shield size={26} className="text-[var(--color-accent)]" strokeWidth={1.8} />
              </div>

              <h1 className="font-display font-extrabold text-[20px]">Verify your ticket</h1>
              <p className="text-[12.5px] text-[var(--color-ink-dim)] mt-1.5 leading-relaxed">
                Enter your verification code to confirm authenticity and check results in real time.
              </p>

              <div
                className={cn(
                  "relative mt-5 flex items-center rounded-[var(--radius-ctl)] border bg-[var(--color-surface)] transition-colors",
                  error
                    ? "border-[var(--color-loss)]"
                    : "border-[var(--color-line)] focus-within:border-[var(--color-accent)]",
                )}
              >
                <Lock size={15} className="ml-3 text-[var(--color-ink-faint)] shrink-0" />
                <input
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  placeholder="Enter verification code"
                  aria-label="Verification code"
                  className="flex-1 min-w-0 bg-transparent num text-[13.5px] tracking-wider px-2.5 py-3 outline-none placeholder:text-[var(--color-ink-faint)] placeholder:tracking-normal placeholder:font-sans"
                />
                <button
                  onClick={verify}
                  disabled={loading}
                  className="m-1.5 flex items-center gap-1.5 rounded-[6px] btn-primary px-3.5 py-2 font-bold text-[12.5px] active:scale-95 transition disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-[spin_0.8s_linear_infinite]" />
                  ) : (
                    <>Verify <ArrowRight size={14} /></>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-[11.5px] text-[var(--color-loss)] mt-2 flex items-center justify-center gap-1.5">
                  <X size={12} /> {error}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-[var(--color-line)]">
                <Feature icon={<ShieldCheck size={16} />} title="Authentic" sub="Genuine ticket" />
                <Feature icon={<Zap size={16} />} title="Instant" sub="Real-time" />
                <Feature icon={<Lock size={16} />} title="Private" sub="Protected" />
              </div>
            </div>
          </div>
        ) : (
          <ResultCard r={result} onReset={() => { setResult(null); setCode(""); }} />
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[var(--color-ink-faint)]">{icon}</span>
      <span className="font-bold text-[11.5px]">{title}</span>
      <span className="text-[9.5px] text-[var(--color-ink-faint)]">{sub}</span>
    </div>
  );
}

function ResultCard({ r, onReset }: { r: Result; onReset: () => void }) {
  const wonLegs = r.legs.filter((l) => l.result === "won").length;
  return (
    <div className="card animate-rise">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid place-items-center w-9 h-9 rounded-[var(--radius-ctl)] bg-[var(--color-accent)]/12 text-[var(--color-accent)] shrink-0">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-[14px]">Ticket verified</div>
              <div className="num text-[11px] text-[var(--color-ink-dim)] truncate">{r.code}</div>
            </div>
          </div>
          <span
            className={cn(
              "chip px-2.5 py-1 shrink-0",
              r.status === "won" && "bg-[var(--color-accent)]/12 border-[var(--color-accent)]/30 text-[var(--color-accent)]",
              r.status === "lost" && "bg-[var(--color-loss)]/12 border-[var(--color-loss)]/30 text-[var(--color-loss)]",
              r.status === "pending" && "bg-[var(--color-warn)]/12 border-[var(--color-warn)]/30 text-[var(--color-warn)]",
            )}
          >
            {r.status === "won" ? "Won" : r.status === "lost" ? "Lost" : "In progress"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <Box label="Stake" value={cedis(r.stake)} />
          <Box label="Total Odds" value={`@ ${r.odds.toFixed(2)}`} />
          <Box label="Potential" value={cedis(r.payout)} grad />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
            <span>Selections</span>
            <span className="text-[var(--color-accent)]">{wonLegs}/{r.legs.length} won</span>
          </div>
          {r.legs.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-2.5"
            >
              <span
                className={cn(
                  "grid place-items-center w-6 h-6 rounded-md shrink-0",
                  l.result === "won" && "bg-[var(--color-accent)]/12 text-[var(--color-accent)]",
                  l.result === "lost" && "bg-[var(--color-loss)]/12 text-[var(--color-loss)]",
                  l.result === "pending" && "bg-[var(--color-warn)]/12 text-[var(--color-warn)]",
                )}
              >
                {l.result === "won" ? (
                  <Check size={13} />
                ) : l.result === "lost" ? (
                  <X size={13} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[12px] truncate">{l.pick}</div>
                <div className="text-[10.5px] text-[var(--color-ink-faint)] truncate">{l.match}</div>
              </div>
              <span className="num text-[12px] font-bold shrink-0">{l.odds.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onReset}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] py-2.5 text-[12.5px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
        >
          <RotateCcw size={14} /> Verify another ticket
        </button>
      </div>
    </div>
  );
}

function Box({ label, value, grad }: { label: string; value: string; grad?: boolean }) {
  return (
    <div className="rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-2.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</div>
      <div className={cn("num text-[13.5px] font-extrabold mt-1", grad && "text-[var(--color-accent)]")}>{value}</div>
    </div>
  );
}
