"use client";

import { useState } from "react";
import { sports } from "@/lib/data";
import { cn } from "@/lib/utils";

export function SportTabs() {
  const [active, setActive] = useState("football");
  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-bg-2)]">
      <div className="mx-auto max-w-[1600px] flex items-center gap-4 px-3 sm:px-4 overflow-x-auto no-scrollbar">
        {sports.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              aria-current={on ? "true" : undefined}
              className={cn(
                "relative shrink-0 flex items-center gap-1.5 py-2.5 text-[12.5px] font-semibold transition-colors",
                on
                  ? "text-white"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)]",
              )}
            >
              <span className="text-[13px]">{s.icon}</span>
              {s.name}
              {/* Underline, not a filled pill — a pill here would compete with
 selected odds for the accent. */}
              {on && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
