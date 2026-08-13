import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Solid accent mark: an ascending odds line.
 *
 * The line is deliberately asymmetric — rise, small correction, bigger rise.
 * The previous glyph had two even peaks, which punned on the old name's
 * "pulse" but rendered as a capital "M" once it became a solid white shape
 * on a solid tile. That is the wrong initial for this brand, so the peaks
 * were unbalanced into a price line, which also suits a sportsbook better
 * and still holds its silhouette at 16px.
 *
 * Kept in sync with src/app/icon.svg, which must repeat the same path with
 * literal colours because it is served standalone with no stylesheet.
 */
// `id` is accepted but no longer read: it existed only to give each instance's
// <linearGradient> a unique id. With a solid fill there is nothing to
// disambiguate. Kept in the signature so existing call sites still type-check.
export function LogoMark({
  size = 30,
}: {
  size?: number;
  id?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <path
        d="M7 22L13 14L18 18L25 8"
        stroke="var(--color-accent-ink)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Brand({
  size = 30,
  className,
  id = "main",
  // The "PRO" tag was a third colour in the header for no product reason.
  // Off by default; the prop stays so existing call sites keep type-checking.
  pro = false,
  href = "/",
}: {
  size?: number;
  className?: string;
  id?: string;
  pro?: boolean;
  href?: string | null;
}) {
  const inner = (
    <span className={cn("flex items-center gap-2 select-none", className)}>
      <LogoMark size={size} id={id} />
      <span className="font-display font-extrabold tracking-[-0.02em] text-[17px] leading-none">
        Bet<span className="text-[var(--color-accent)]">lixx</span>
      </span>
      {pro && (
        <span className="num text-[8.5px] font-bold tracking-[0.16em] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-line)] text-[var(--color-ink-faint)]">
          PRO
        </span>
      )}
    </span>
  );
  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}

/**
 * League/country flag. Renders the real flag image from the feed when we have
 * one, otherwise falls back to the emoji flag (or globe for unknown countries).
 */
export function CountryFlag({
  url,
  emoji,
  className = "",
}: {
  url?: string;
  emoji: string;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(
          "inline-block h-[12px] w-[16px] rounded-[2px] object-cover align-[-1px]",
          className,
        )}
      />
    );
  }
  return <span className={className}>{emoji}</span>;
}

export function TeamBadge({
  short,
  color,
  size = 38,
  logo,
}: {
  short: string;
  color: string;
  size?: number;
  logo?: string;
}) {
  // Real crest from the feed when we have one; otherwise an initials badge.
  // Small sizes drop the ring — a 1.5px border around a 16px circle reads as
  // mud, and in the compact fixture list these render at 16px.
  const small = size <= 20;

  if (logo) {
    return (
      <span
        className="grid place-items-center rounded-full shrink-0 overflow-hidden"
        style={{
          width: size,
          height: size,
          border: small ? "none" : `1px solid ${color}55`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          aria-hidden
          width={Math.round(size * (small ? 1 : 0.74))}
          height={Math.round(size * (small ? 1 : 0.74))}
          loading="lazy"
          className="object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full font-display font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(7, size * (small ? 0.42 : 0.34)),
        // Tint + ring carry the team's identity; the letters use ink rather
        // than the team colour. Crest colours come from the feed and include
        // yellows and pale golds that fall under 2:1 on white, so tinting the
        // text would make some badges unreadable and there is no way to know
        // which in advance. The tint is stronger than the dark theme's
        // because a 15% wash is nearly invisible against white.
        background: `${color}2e`,
        border: small ? "none" : `1px solid ${color}66`,
        color: "var(--color-ink)",
      }}
    >
      {short.slice(0, small ? 2 : 3)}
    </span>
  );
}
