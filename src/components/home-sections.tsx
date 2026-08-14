"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  Gift,
  Radio,
  ShieldCheck,
  Ticket,
  UserPlus,
  Wallet,
} from "lucide-react";
import { promos } from "@/lib/data";
import type { Match } from "@/lib/types";
import { useSlip } from "@/lib/store";
import { useMatches } from "@/lib/use-matches";
import { TeamBadge, CountryFlag } from "./brand";
import { LiveClock } from "./live-clock";

/**
 * Hero banner — the headline offer, the journeys it drives, and match imagery.
 *
 * Two columns from lg, stacked below. The photo sits in its OWN panel beside
 * the copy rather than behind it: the text is dark ink on a light page, and a
 * night-stadium shot underneath it would need a heavy scrim to stay legible,
 * which is exactly the murky look this light theme exists to avoid. Beside it,
 * the picture can stay full-strength and the words stay at full contrast.
 *
 * Exactly ONE solid accent button: "Create account" is what this banner exists
 * to drive, and giving all three equal weight would mean none reads as next.
 *
 * Image: Unsplash (photo-1629217855633-79a6925d6c47), Unsplash License —
 * free for commercial use, no attribution required. Kept as a local asset
 * rather than hotlinked so the hero cannot break when a CDN URL rots, and
 * pre-sized to two widths so phones don't pull the desktop file.
 */
export function HeroPromo() {
  const offer = promos[0];
  return (
    <section className="hero grid lg:grid-cols-[1.05fr_0.95fr] gap-4 lg:gap-5 p-4 sm:p-5">
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-[11px] font-semibold text-[var(--color-accent)]">
          {offer.eyebrow}
        </p>
        <h1 className="font-display font-extrabold text-[24px] sm:text-[30px] lg:text-[34px] leading-[1.08] tracking-tight mt-1.5 text-balance">
          {offer.title}
        </h1>
        <p className="text-[13px] text-[var(--color-ink-dim)] mt-2 max-w-[44ch]">
          {offer.sub}
        </p>

        {/* Primary on its own row so it never ends up sharing a line with a
            secondary, or worse, wrapping alone underneath one. */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <Link
            href="/register"
            className="btn-primary flex items-center justify-center gap-1.5 rounded-[var(--radius-ctl)] px-5 py-3 font-display font-bold text-[13.5px]"
          >
            <UserPlus size={15} /> Create account
          </Link>
          <div className="flex gap-2">
            <Link
              href="/account"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 font-display font-semibold text-[13px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
            >
              <Gift size={14} /> Bonuses
            </Link>
            <Link
              href="/account"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 font-display font-semibold text-[13px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
            >
              <Wallet size={14} /> Deposit
            </Link>
          </div>
        </div>
      </div>

      <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-line)] aspect-[16/9] lg:aspect-auto lg:min-h-[196px]">
        {/* Plain <img> with a srcset rather than next/image: the asset is
            already pre-sized at build time, so the optimiser would only add a
            per-request cost for an identical result.
            eager + high priority because this is the largest element above the
            fold — it is the LCP candidate, and lazy-loading it would delay the
            very metric it defines. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-stadium-1040.webp"
          srcSet="/hero-stadium-640.webp 640w, /hero-stadium-1040.webp 1040w"
          sizes="(min-width: 1024px) 46vw, 100vw"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          width={1040}
          height={694}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </section>
  );
}

/**
 * The four shortcuts under the hero. The reference design uses these for its
 * product verticals (casino / sports / bonuses / affiliates); this is a pure
 * sportsbook, so they point at the four things a punter actually does here.
 * Every tile goes somewhere real — no placeholders.
 */
const TILES = [
  { href: "/live", icon: Radio, title: "Live betting", sub: "In-play odds" },
  { href: "/my-bets", icon: Ticket, title: "My bets", sub: "Open & settled" },
  { href: "/booking", icon: Download, title: "Booking code", sub: "Load a slip" },
  { href: "/verify", icon: ShieldCheck, title: "Verify ticket", sub: "Check a code" },
];

export function CategoryTiles() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
      {TILES.map((t) => {
        const Icon = t.icon;
        return (
          <Link key={t.title} href={t.href} className="tile">
            <span className="tile-icon">
              <Icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block font-display font-bold text-[12.5px] truncate">
                {t.title}
              </span>
              <span className="block text-[10.5px] text-[var(--color-ink-faint)] truncate">
                {t.sub}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Quick actions + feed-derived counts. No fabricated figures. */
export function StatRibbon() {
  const { live, today, all } = useMatches();
  const tiles = [
    { val: `${live.length}`, label: "Live now" },
    { val: `${today.length}`, label: "Starting today" },
    { val: `${all.length}`, label: "Total fixtures" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
      <Link
        href="/booking"
        className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
      >
        <Download size={14} /> Load booking code
      </Link>
      <Link
        href="/verify"
        className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
      >
        <ShieldCheck size={14} /> Verify ticket
      </Link>
      {tiles.map((s, i) => (
        <div
          key={i}
          className="shrink-0 flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2"
        >
          <span className="num text-[14px] font-bold">{s.val}</span>
          <span className="text-[10.5px] text-[var(--color-ink-dim)] whitespace-nowrap">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Featured match. Same information as before minus the animated blur orbs —
 * two `blur-3xl` layers animating on an infinite loop was the most expensive
 * thing on the home screen, and it sat behind the primary betting controls.
 */
export function FeaturedMatch({ m }: { m: Match }) {
  const toggle = useSlip((s) => s.toggle);
  const sels = useSlip((s) => s.selections);
  const picks = [
    { label: "1", name: m.home, odds: m.markets[0].odds },
    { label: "X", name: "Draw", odds: m.markets[1].odds },
    { label: "2", name: m.away, odds: m.markets[2].odds },
  ];

  return (
    <div className="card overflow-hidden mt-3">
      {/* meta strip */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          Featured
        </span>
        {m.live && (
          <span className="flex items-center gap-1.5 text-[var(--color-loss)]">
            <span className="live-dot" />
            <LiveClock
              startTimeISO={m.startTimeISO}
              sport={m.sport}
              fallbackMinute={m.minute}
              className="num text-[10.5px] font-bold"
            />
          </span>
        )}
        {!m.live && m.locked && (
          <span className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--color-ink-faint)]">
            {m.lockLabel ?? "Closed"}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-dim)] ml-auto min-w-0">
          <CountryFlag url={m.leagueFlagUrl} emoji={m.leagueFlag} />
          <span className="truncate">{m.league}</span>
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/match/${m.id}`}
            className="flex flex-col items-center gap-2 flex-1 min-w-0 group"
          >
            <TeamBadge
              short={m.homeShort}
              color={m.homeColor}
              size={44}
              logo={m.homeLogo}
            />
            <span className="font-semibold text-[13px] text-center truncate max-w-full group-hover:text-[var(--color-accent)] transition-colors">
              {m.home}
            </span>
          </Link>

          <div className="flex flex-col items-center shrink-0 px-2">
            {m.live ? (
              <div className="num text-[28px] font-extrabold leading-none tracking-tight">
                {m.scoreHome ?? 0}
                <span className="text-[var(--color-ink-faint)] mx-1.5">:</span>
                {m.scoreAway ?? 0}
              </div>
            ) : (
              <>
                <div className="text-[13px] font-bold text-[var(--color-ink-faint)]">
                  VS
                </div>
                <span className="num text-[11px] text-[var(--color-ink-dim)] font-semibold mt-1">
                  {m.kickoff}
                </span>
              </>
            )}
          </div>

          <Link
            href={`/match/${m.id}`}
            className="flex flex-col items-center gap-2 flex-1 min-w-0 group"
          >
            <TeamBadge
              short={m.awayShort}
              color={m.awayColor}
              size={44}
              logo={m.awayLogo}
            />
            <span className="font-semibold text-[13px] text-center truncate max-w-full group-hover:text-[var(--color-accent)] transition-colors">
              {m.away}
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {picks.map((p) => {
            const id = `${m.id}-1x2-${p.label}`;
            const active = sels.some((x) => x.id === id);
            return (
              <button
                key={p.label}
                data-active={active}
                disabled={m.locked}
                aria-pressed={active}
                onClick={() => {
                  if (m.locked) return;
                  toggle({
                    id,
                    matchId: m.id,
                    match: `${m.home} v ${m.away}`,
                    market: "Match Result",
                    pick: p.name,
                    odds: p.odds,
                  });
                }}
                className="odds-btn flex items-center justify-between gap-2 px-3 py-2.5 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <span className="text-[11.5px] font-medium text-[var(--color-ink-faint)] truncate">
                  {p.name}
                </span>
                <span className="text-[14px] shrink-0">
                  {p.odds.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href={`/match/${m.id}`}
          className="flex items-center justify-center gap-1.5 mt-3 text-[11.5px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-accent)] transition-colors"
        >
          All {m.marketCount} markets <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
