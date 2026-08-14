"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatMoneyWithCurrency } from "@/lib/format-money";

interface WinCongratsProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  verifyCode?: string;
  ticketId: string;
  /** Called when the user taps "Details" — dismiss splash, reveal ticket. */
  onDetails?: () => void;
}

const COUNT_MS = 900;

/**
 * Counts the payout up from zero on open.
 *
 * The number is the whole point of this screen, and a figure that animates
 * into place holds the eye far longer than one that is simply present. Eased
 * out so it decelerates into the final value rather than stopping dead.
 *
 * Honours prefers-reduced-motion by landing on the real figure immediately —
 * the amount is information, not decoration, so it must never be withheld.
 */
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(run ? 0 : target);

  useEffect(() => {
    if (!run) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // A zero duration rather than an early setValue: it reaches the final
    // figure on the first frame without a synchronous setState in the effect
    // body, which would cascade a render.
    const duration = reduced || target <= 0 ? 0 : COUNT_MS;

    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = duration === 0 ? 1 : Math.min(1, (t - start) / duration);
      if (p < 1) {
        setValue(target * (1 - Math.pow(1 - p, 3)));
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target); // land exactly, never on a rounding artefact
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return value;
}

/**
 * "YOU WON" celebration splash.
 *
 * Choreography — pop-in with an overshoot, staggered entrances, a slow ray
 * burst behind the trophy — is modelled on the reference casino's big-win
 * popup, but written from scratch here: that implementation ships as a
 * minified third-party bundle driving proprietary sprite sheets off their CDN,
 * none of which is ours to reuse.
 *
 * Colours are untouched from the previous version on purpose. This is the one
 * genuinely dark surface left in the light theme, and deliberately so: a
 * blackout makes the trophy and the figure carry the screen.
 */
export function WinCongrats({
  open,
  onClose,
  amount,
  currency = "GHS",
  verifyCode,
  ticketId,
  onDetails,
}: WinCongratsProps) {
  const shown = useCountUp(amount, open);

  // Escape to dismiss — this covers the viewport, so it needs a keyboard exit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const shareWin = () => {
    void navigator.share
      ?.({
        title: "Betlixx — Won!",
        text: `Just won ${formatMoneyWithCurrency(amount, currency)} on Betlixx (ticket ${ticketId})`,
      })
      .catch(() => {});
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`You won ${formatMoneyWithCurrency(amount, currency)}`}
      className="fixed inset-0 z-[80] flex flex-col items-center px-5 sm:px-6 bg-black/92 win-fade"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors z-10"
      >
        <X className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Headline + amount. Staggered so the eye lands on the words first and
          the figure second, while it is still counting. */}
      <div className="mt-16 sm:mt-20 text-center">
        <p
          className="text-5xl sm:text-6xl font-display font-extrabold text-white tracking-tight drop-shadow-lg win-pop"
          style={{ animationDelay: "60ms" }}
        >
          YOU WON
        </p>
        <p
          className="mt-2 num text-3xl sm:text-4xl font-bold text-white drop-shadow-md win-pop"
          style={{ animationDelay: "200ms" }}
        >
          {formatMoneyWithCurrency(shown, currency)}
        </p>
      </div>

      {/* Trophy, over a slow ray burst and a breathing glow. Both are purely
          decorative and sit behind the image, so they never intercept a tap. */}
      <div className="relative flex-1 w-full mt-1 sm:mt-2 min-h-0">
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center pointer-events-none overflow-hidden"
        >
          <div
            className="win-rays w-[150%] aspect-square max-w-none opacity-[0.16]"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,200,0,0.9) 0deg 6deg, transparent 6deg 18deg)",
              maskImage:
                "radial-gradient(circle, #000 18%, rgba(0,0,0,0.35) 45%, transparent 68%)",
              WebkitMaskImage:
                "radial-gradient(circle, #000 18%, rgba(0,0,0,0.35) 45%, transparent 68%)",
            }}
          />
          <div
            className="win-glow absolute w-[62%] aspect-square rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,200,0,0.34) 0%, transparent 68%)",
            }}
          />
        </div>

        <div
          className="relative w-full h-full win-pop"
          style={{ animationDelay: "120ms" }}
        >
          <Image
            src="/won_trophy_image.png"
            alt=""
            aria-hidden
            fill
            priority
            sizes="(min-width: 640px) 480px, 90vw"
            className="object-contain drop-shadow-[0_0_50px_rgba(255,200,0,0.55)]"
          />
        </div>
      </div>

      {verifyCode && (
        <p
          className="mt-1 text-sm sm:text-base text-white text-center win-fade"
          style={{ animationDelay: "620ms" }}
        >
          <span className="font-medium text-white/80">Verify Code: </span>
          <span className="num font-bold tracking-wider">{verifyCode}</span>
        </p>
      )}

      <div
        className="mt-3 mb-3 w-full max-w-sm flex gap-3 win-fade"
        style={{ animationDelay: "720ms" }}
      >
        <button
          type="button"
          onClick={() => (onDetails ? onDetails() : onClose())}
          className="flex-1 h-12 rounded-xl border-2 border-[var(--color-emerald)] text-[var(--color-emerald)] bg-transparent hover:bg-[var(--color-emerald)]/10 font-display font-bold text-base transition-colors"
        >
          Details
        </button>
        <button
          type="button"
          onClick={shareWin}
          className="flex-1 h-12 rounded-xl bg-[var(--color-emerald)] hover:brightness-110 text-white font-display font-bold text-base transition"
        >
          Show Off
        </button>
      </div>
    </div>
  );
}
