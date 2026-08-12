import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Solid accent mark. The pulse-line glyph is kept — it reads as both a
 * heartbeat and a scoreline — but the two-stop gradient and the stray
 * amber dot are gone, so the logo uses the one accent like everything else.
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
        d="M7 21.5L12.5 10.5L16 18.5L19.5 10.5L25 21.5"
        stroke="var(--color-accent-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        Pluse<span className="text-[var(--color-accent)]">bet</span>
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
        background: `${color}26`,
        border: small ? "none" : `1px solid ${color}55`,
        color: "#fff",
      }}
    >
      {short.slice(0, small ? 2 : 3)}
    </span>
  );
}
