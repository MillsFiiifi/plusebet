"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Search, Ticket, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";

const ITEMS: { href: string; label: string; icon: typeof Home }[] = [
  { href: "/", label: "Sports", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "__search", label: "Search", icon: Search },
  { href: "/my-bets", label: "My Bets", icon: Ticket },
  { href: "/account", label: "Account", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Docked to the edge rather than a floating pill. A detached pill costs
 horizontal margin and a drop shadow on every frame, and on short
 phone screens it covered the last fixture row. Docked also gives the
 bar a real safe-area inset on iOS. */}
      <nav className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-bg-2)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[54px]">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const active =
              it.href !== "__search" &&
              (it.href === "/"
                ? pathname === "/"
                : pathname.startsWith(it.href));
            const content = (
              <span className="relative flex flex-col items-center justify-center gap-[3px] h-full">
                {active && (
                  <span className="absolute top-0 w-9 h-[2px] rounded-b-full bg-[var(--color-accent)]" />
                )}
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 1.9}
                  className={
                    active
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-ink-faint)]"
                  }
                />
                <span
                  className={cn(
                    "text-[9.5px] font-semibold",
                    active ? "text-white" : "text-[var(--color-ink-faint)]",
                  )}
                >
                  {it.label}
                </span>
              </span>
            );
            if (it.href === "__search") {
              return (
                <button
                  key={it.label}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  {content}
                </button>
              );
            }
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
