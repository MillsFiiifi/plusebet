import { ArrowDownLeft, ArrowUpRight, Trophy, Ticket } from "lucide-react";
import type { Txn } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";

// Icon tiles stay neutral. The one thing worth colouring in a ledger is the
// sign of the amount, and colouring the tiles too just competes with it.
const META = {
  deposit: { icon: ArrowDownLeft, label: "Deposit" },
  withdrawal: { icon: ArrowUpRight, label: "Withdrawal" },
  winning: { icon: Trophy, label: "Winnings" },
  bet: { icon: Ticket, label: "Bet Placed" },
} as const;

const STATUS: Record<string, string> = {
  completed:
    "bg-[var(--color-accent)]/12 text-[var(--color-accent)] border-[var(--color-accent)]/25",
  pending:
    "bg-[var(--color-warn)]/12 text-[var(--color-warn)] border-[var(--color-warn)]/25",
  failed:
    "bg-[var(--color-loss)]/12 text-[var(--color-loss)] border-[var(--color-loss)]/25",
};

export function TxnRow({ t }: { t: Txn }) {
  const meta = META[t.type];
  const Icon = meta.icon;
  const positive = t.amount >= 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid place-items-center w-8 h-8 rounded-[var(--radius-ctl)] shrink-0 bg-[var(--color-surface-2)] border border-[var(--color-line)] text-[var(--color-ink-dim)]">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[12.5px] truncate">{meta.label}</div>
        <div className="text-[10.5px] text-[var(--color-ink-faint)] truncate">
          {t.method} · {t.date}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            "num text-[13px] font-bold",
            positive ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]",
          )}
        >
          {positive ? "+" : "−"}GH₵ {fmt(Math.abs(t.amount))}
        </span>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border",
            STATUS[t.status],
          )}
        >
          {t.status}
        </span>
      </div>
    </div>
  );
}
