import Link from "next/link";
import { ChevronLeft, Zap, ShieldCheck, Smartphone } from "lucide-react";
import { Brand } from "./brand";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* left brand panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-[var(--color-line)] bg-[var(--color-bg-2)]">
        <Brand size={32} />
        <div>
          <h2 className="font-display font-extrabold text-[32px] leading-[1.15] tracking-[-0.02em]">
            Bet smarter.
            <br />
            <span className="text-[var(--color-accent)]">Get paid faster.</span>
          </h2>
          <p className="text-[13.5px] text-[var(--color-ink-dim)] mt-4 max-w-sm leading-relaxed">
            Live odds across every major league, mobile-money deposits and
            withdrawals, and a verification code on every ticket you place.
          </p>
          {/* Product guarantees, not invented usage numbers. The previous build
 hard-coded "4,820 bets today" and "348 live now" here, which were
 fabricated — and contradicted the home page, which is careful to
 show only feed-derived counts. */}
          <ul className="flex flex-col gap-3 mt-8">
            <Feature
              icon={<Smartphone size={15} />}
              text="MTN, Telecel and AirtelTigo mobile money"
            />
            <Feature
              icon={<Zap size={15} />}
              text="Balance credited automatically once payment clears"
            />
            <Feature
              icon={<ShieldCheck size={15} />}
              text="Every ticket carries a verification code"
            />
          </ul>
        </div>
        <p className="text-[11px] text-[var(--color-ink-faint)]">
          © {new Date().getFullYear()} Betlixx. 18+ · Play responsibly.
        </p>
      </div>

      {/* right form panel */}
      <div className="grid place-items-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-6 transition-colors"
          >
            <ChevronLeft size={14} /> Back to home
          </Link>
          <div className="lg:hidden mb-6">
            <Brand size={30} />
          </div>
          <h1 className="font-display font-extrabold text-[22px] tracking-[-0.01em]">
            {title}
          </h1>
          <p className="text-[12.5px] text-[var(--color-ink-dim)] mt-1.5">
            {subtitle}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2.5 text-[12.5px] text-[var(--color-ink-dim)]">
      <span className="grid place-items-center w-7 h-7 rounded-[var(--radius-ctl)] bg-[var(--color-surface-2)] border border-[var(--color-line)] text-[var(--color-accent)] shrink-0">
        {icon}
      </span>
      {text}
    </li>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  children,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11.5px] font-semibold text-[var(--color-ink-dim)] mb-1.5">
        {label}
      </label>
      {children ?? (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-ctl)] px-3 py-2.5 text-[13.5px] outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-ink-faint)]"
        />
      )}
    </div>
  );
}
