import { create } from "zustand";
import type { Selection } from "./types";

/**
 * Legs struck per match in the last day, behind the fixture list's flame.
 * Kept in a store rather than threaded through the list so a row can read it
 * without every intermediate component having to carry it. One fetch per page
 * view: `load` is a no-op once it has run, and the counts move slowly enough
 * that a stale flame costs nothing.
 */
type PopularState = {
  counts: Record<string, number>;
  status: "idle" | "loading" | "ready";
  load: () => Promise<void>;
};

export const usePopular = create<PopularState>((set, get) => ({
  counts: {},
  status: "idle",
  load: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const res = await fetch("/api/matches/popular");
      const data = (await res.json()) as { counts?: Record<string, number> };
      set({ counts: data.counts ?? {}, status: "ready" });
    } catch {
      // A flame that never lights is better than a list that fails to render.
      set({ status: "ready" });
    }
  },
}));

/** Legs on a match before it counts as hot — below this it's just noise. */
export const HOT_LEG_THRESHOLD = 3;

type SlipState = {
  selections: Selection[];
  stake: number;
  mobileOpen: boolean;
  add: (s: Selection) => void;
  remove: (id: string) => void;
  toggle: (s: Selection) => void;
  clear: () => void;
  setStake: (n: number) => void;
  setMobileOpen: (b: boolean) => void;
  has: (id: string) => boolean;
};

export const useSlip = create<SlipState>((set, get) => ({
  selections: [],
  stake: 50,
  mobileOpen: false,
  add: (s) =>
    set((st) =>
      st.selections.some((x) => x.id === s.id)
        ? st
        : { selections: [...st.selections, s] },
    ),
  remove: (id) =>
    set((st) => ({ selections: st.selections.filter((x) => x.id !== id) })),
  toggle: (s) =>
    set((st) =>
      st.selections.some((x) => x.id === s.id)
        ? { selections: st.selections.filter((x) => x.id !== s.id) }
        : { selections: [...st.selections, s] },
    ),
  clear: () => set({ selections: [] }),
  setStake: (n) => set({ stake: Math.max(0, n) }),
  setMobileOpen: (b) => set({ mobileOpen: b }),
  has: (id) => get().selections.some((x) => x.id === id),
}));

export const totalOdds = (sels: Selection[]) =>
  sels.reduce((acc, s) => acc * s.odds, 1);
