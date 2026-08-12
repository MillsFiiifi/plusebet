import Link from "next/link";
import { Lock, Clock } from "lucide-react";
import { Brand } from "./brand";

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Sports",
    links: [
      { label: "Football", href: "/" },
      { label: "Basketball", href: "/" },
      { label: "Tennis", href: "/" },
      { label: "Cricket", href: "/" },
      { label: "Esports", href: "/" },
      { label: "Boxing & MMA", href: "/" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "Account Overview", href: "/account" },
      { label: "Bet History", href: "/bet-history" },
      { label: "Transactions", href: "/transactions" },
      { label: "Deposit", href: "/account" },
      { label: "Withdraw", href: "/account" },
      { label: "Verify Ticket", href: "/verify" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Plusebet", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Affiliates", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal & Help",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Responsible Gambling", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--color-line)] bg-[var(--color-bg-2)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-5 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Brand block */}
          <div className="col-span-2">
            <Brand size={30} href="/" pro={false} />
            <p className="text-[12.5px] text-[var(--color-ink-dim)] leading-relaxed mt-3 max-w-[280px]">
              International sports betting. Live odds, mobile-money payouts,
              verified tickets.
            </p>
            <div className="mt-4 space-y-2">
              <span className="flex items-center gap-2 text-[11.5px] text-[var(--color-ink-dim)]">
                <Lock size={13} className="text-[var(--color-ink-faint)]" /> SSL
                secured
              </span>
              <span className="flex items-center gap-2 text-[11.5px] text-[var(--color-ink-dim)]">
                <Clock size={13} className="text-[var(--color-ink-faint)]" />{" "}
                24/7 support
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-faint)] mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[12.5px] text-[var(--color-ink-dim)] hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11.5px] text-[var(--color-ink-faint)]">
            © {new Date().getFullYear()} Plusebet. All rights reserved.
          </p>
          <p className="text-[11.5px] text-[var(--color-ink-faint)] flex items-center gap-2">
            <span className="num font-bold text-[var(--color-ink-dim)] border border-[var(--color-line-2)] rounded px-1.5 py-0.5">
              18+
            </span>
            Please gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
