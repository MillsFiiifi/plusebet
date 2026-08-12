"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { from: "bot" | "me"; text: string };

const QUICK = ["How do I deposit?", "Verify a ticket", "Withdrawal time?", "Bonus terms"];

const REPLIES: Record<string, string> = {
  "How do I deposit?": "Tap Deposit, choose MTN / Telecel / Vodafone Cash, enter the amount and approve the prompt on your phone. Funds land instantly. 💸",
  "Verify a ticket": "Head to the Verify page and paste your ticket code — you'll see real-time results and authenticity in seconds. 🎟️",
  "Withdrawal time?": "Mobile-money withdrawals are typically processed within 5–10 minutes, 24/7. ⚡",
  "Bonus terms": "Your 100% welcome bonus must be wagered 5× on odds of 1.50+ within 30 days. Acca insurance applies to 5+ legs. ✅",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "👋 Hi, I'm the Plusebet assistant. How can I help you win today?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function send(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "me", text }]);
    setInput("");
    setTimeout(() => {
      const reply = REPLIES[text] ?? "Thanks! A support agent will be with you shortly. Meanwhile, you can check our FAQ or try one of the quick options below. 🙌";
      setMsgs((m) => [...m, { from: "bot", text: reply }]);
    }, 600);
  }

  return (
    <>
      {/* Neutral surface, not the accent. On mobile this button sits directly
          beside the accent bet-slip bar; two different greens there would
          compete, and support is not the primary action on any screen.
          Offset clears the 54px docked nav plus the slip bar above it. */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[118px] xl:bottom-6 right-3 xl:right-6 z-30 grid place-items-center w-12 h-12 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-line-2)] text-[var(--color-ink)] hover:bg-[var(--color-elevated)] active:scale-95 transition-colors shadow-lg"
        aria-label="Support chat"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-[176px] xl:bottom-[84px] right-3 xl:right-6 z-40 w-[min(360px,calc(100vw-1.5rem))] h-[min(520px,64dvh)] card flex flex-col overflow-hidden animate-rise shadow-2xl">
          {/* header */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[var(--color-bg-2)] border-b border-[var(--color-line)]">
            <div className="relative grid place-items-center w-8 h-8 rounded-full bg-[var(--color-surface-3)] text-[var(--color-ink-dim)]">
              <MessageCircle size={16} />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg-2)]" />
            </div>
            <div>
              <div className="font-display font-bold text-[13.5px]">Plusebet Support</div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--color-accent)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /> Online · Replies instantly
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-[var(--color-ink-faint)] hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.from === "me"
                      ? "bg-[var(--color-surface-3)] border border-[var(--color-line-2)] text-[var(--color-ink)] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] max-w-[80%]"
                      : "bg-[var(--color-surface-2)] border border-[var(--color-line)] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] max-w-[85%] text-[var(--color-ink)]"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* quick replies */}
          <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="chip px-2.5 py-1 text-[10.5px]">
                {q}
              </button>
            ))}
          </div>

          {/* input */}
          <div className="p-3 border-t border-[var(--color-line)] flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Type a message…"
              aria-label="Message"
              className="flex-1 min-w-0 bg-[var(--color-surface-2)] border border-[var(--color-line)] rounded-[var(--radius-ctl)] px-3 py-2.5 text-[13px] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            {/* Send is the primary action inside this panel, so it earns the accent here. */}
            <button
              onClick={() => send(input)}
              aria-label="Send message"
              className="grid place-items-center w-10 h-10 rounded-[var(--radius-ctl)] btn-primary shrink-0 active:scale-95 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
