"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on app load so the site is installable as a PWA
 * (Add to Home Screen → standalone app). Push opt-in reuses the same worker via
 * goal-alerts-toggle; registering here is idempotent (browser dedupes by URL).
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort — never block the app */
      });
    }
  }, []);
  return null;
}
