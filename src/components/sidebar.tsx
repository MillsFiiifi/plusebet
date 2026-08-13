"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, Radio, Ticket, Star, Gift } from "lucide-react";
import { sports, competitions } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./brand";

const BROWSE = [
  { href: "/", icon: Home, label: "Sports" },
  { href: "/live", icon: Radio, label: "Live Now" },
  { href: "/my-bets", icon: Ticket, label: "My Bets" },
  { href: "/account", icon: Star, label: "Favourites" },
  { href: "/account", icon: Gift, label: "Promotions" },
];

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-5 py-4 px-2.5">
      <Section label="Browse">
        {BROWSE.map((b, i) => {
          const Icon = b.icon;
          const active =
            b.href === "/" ? pathname === "/" : pathname.startsWith(b.href);
          return (
            <Link
              key={i}
              href={b.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 py-[7px] text-[12.5px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]",
              )}
            >
              {/* A 2px accent rail marks the active item — enough signal
 without spending a filled accent block on navigation. */}
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--color-accent)]" />
              )}
              <Icon
                size={15}
                strokeWidth={active ? 2.4 : 2}
                className="shrink-0"
              />
              {b.label}
            </Link>
          );
        })}
      </Section>

      <Section label="Top Competitions">
        {competitions.map((c) => (
          <Link
            key={c.id}
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 py-[7px] text-[12.5px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <CountryFlag emoji={c.flag} className="shrink-0" />
            <span className="truncate">{c.name}</span>
          </Link>
        ))}
      </Section>

      <Section label="All Sports">
        {sports.map((s) => (
          <Link
            key={s.id}
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 py-[7px] text-[12.5px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <span className="w-[15px] text-center shrink-0">{s.icon}</span>
            {s.name}
          </Link>
        ))}
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-2.5 mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </div>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-[214px] shrink-0 sticky top-[54px] h-[calc(100dvh-54px)] overflow-y-auto no-scrollbar border-r border-[var(--color-line)]">
      <SidebarInner />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-[272px] max-w-[82vw] h-full bg-[var(--color-bg-2)] border-r border-[var(--color-line)] overflow-y-auto no-scrollbar animate-rise">
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--color-line)] sticky top-0 bg-[var(--color-bg-2)] z-10">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
          >
            <X size={19} />
          </button>
        </div>
        <SidebarInner onNavigate={onClose} />
      </div>
    </div>
  );
}
