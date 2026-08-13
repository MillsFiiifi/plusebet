"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Wallet,
  User,
  Menu,
  Home,
  Radio,
  Ticket,
  ScrollText,
  ShieldCheck,
  Receipt,
  LogOut,
} from "lucide-react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";
import { formatMoneyWithCurrency } from "@/lib/format-money";
import { getUserId, getUserName, clearUserSession } from "@/lib/user-session";
import { GlobalSearch } from "./global-search";

// Lucide throughout rather than emoji: emoji render differently on every
// platform and can't inherit colour or stroke weight, so an "active" nav
// item couldn't be styled consistently.
const NAV = [
  { href: "/", label: "Sports", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/my-bets", label: "My Bets", icon: Ticket },
  { href: "/bet-history", label: "History", icon: ScrollText },
  { href: "/verify", label: "Verify", icon: ShieldCheck },
];

function initials(name: string | null): string {
  if (!name) return "ME";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ME";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Auth state. `userId` starts null so SSR and the first client render both
  // show the logged-out (Log in / Sign up) buttons — matching markup, no
  // hydration mismatch. The effect runs after hydration and, if a session
  // exists in localStorage, swaps the cluster to the logged-in wallet view.
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("GHS");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    setUserName(getUserName());
    if (!id) return;
    let alive = true;
    fetch(`/api/users/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!alive || !u) return;
        setBalance(typeof u.balance === "number" ? u.balance : 0);
        if (u.currency) setCurrency(u.currency);
        if (u.name) setUserName(u.name);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  // Cmd/Ctrl-K opens search — the expected shortcut, and it makes the
  // hint shown in the search field honest.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const logout = () => {
    clearUserSession();
    setUserId(null);
    setUserName(null);
    setBalance(null);
    setProfileOpen(false);
    router.push("/login");
  };

  const loggedIn = !!userId;

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-[1600px] flex items-center gap-2 px-3 sm:px-4 h-[54px]">
          <button
            onClick={onMenu}
            aria-label="Open menu"
            className="lg:hidden grid place-items-center w-9 h-9 -ml-1 rounded-[var(--radius-ctl)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <Menu size={20} />
          </button>

          <Brand />

          <nav className="hidden lg:flex items-center gap-0.5 ml-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 px-2.5 h-[54px] text-[12.5px] font-semibold transition-colors",
                    active
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]",
                  )}
                >
                  <Icon size={14} strokeWidth={active ? 2.4 : 2} />
                  {n.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[var(--color-accent)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] pl-2.5 pr-1.5 py-1.5 text-[var(--color-ink-faint)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink-dim)] transition-colors w-[190px]"
          >
            <Search size={14} />
            <span className="text-[12px]">Search</span>
            <kbd className="num ml-auto text-[9.5px] rounded border border-[var(--color-line)] bg-[var(--color-surface-2)] px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>

          {loggedIn ? (
            <>
              {/* Balance reads as data — mono, tabular, no decoration. */}
              <Link
                href="/account"
                className="hidden md:flex flex-col leading-none rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 hover:border-[var(--color-line-2)] transition-colors"
              >
                <span className="text-[8.5px] uppercase tracking-wider text-[var(--color-ink-faint)] font-semibold">
                  Balance
                </span>
                <span className="num text-[13px] font-bold mt-0.5">
                  {balance === null
                    ? "—"
                    : formatMoneyWithCurrency(balance, currency)}
                </span>
              </Link>

              {/* The one primary action in the bar. */}
              <Link
                href="/account"
                className="flex items-center gap-1 rounded-[var(--radius-ctl)] btn-primary px-3 py-2 font-bold text-[12.5px] transition-colors"
              >
                <Plus size={15} strokeWidth={2.6} />
                <span className="hidden sm:inline">Deposit</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-0.5 rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1 hover:border-[var(--color-line-2)] transition-colors"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-[var(--color-surface-3)] text-[var(--color-ink)] font-bold text-[11px]">
                    {initials(userName)}
                  </span>
                  <ChevronDown
                    size={13}
                    className="text-[var(--color-ink-faint)]"
                  />
                </button>
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 card p-1 animate-rise shadow-2xl">
                      <div className="px-2.5 py-2 border-b border-[var(--color-line)] mb-1">
                        <div className="text-[12.5px] font-semibold truncate">
                          {userName ?? "Your account"}
                        </div>
                        <div className="num text-[11px] text-[var(--color-accent)] font-bold mt-0.5">
                          {balance === null
                            ? "—"
                            : formatMoneyWithCurrency(balance, currency)}
                        </div>
                      </div>
                      <ProfileItem
                        href="/account"
                        icon={<User size={14} />}
                        label="Account"
                        onClick={() => setProfileOpen(false)}
                      />
                      <ProfileItem
                        href="/account"
                        icon={<Wallet size={14} />}
                        label="Deposit / Withdraw"
                        onClick={() => setProfileOpen(false)}
                      />
                      <ProfileItem
                        href="/transactions"
                        icon={<Receipt size={14} />}
                        label="Transactions"
                        onClick={() => setProfileOpen(false)}
                      />
                      <ProfileItem
                        href="/bet-history"
                        icon={<ScrollText size={14} />}
                        label="Bet History"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="h-px bg-[var(--color-line)] my-1" />
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-ctl)] text-[12.5px] font-medium text-[var(--color-loss)] hover:bg-[var(--color-loss)]/10 transition-colors"
                      >
                        <span className="w-4 grid place-items-center">
                          <LogOut size={14} />
                        </span>
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-[var(--radius-ctl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-semibold text-[12.5px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-2)] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-[var(--radius-ctl)] btn-primary px-3.5 py-2 font-bold text-[12.5px] transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function ProfileItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-ctl)] text-[12.5px] font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      <span className="w-4 grid place-items-center">{icon}</span>
      {label}
    </Link>
  );
}
