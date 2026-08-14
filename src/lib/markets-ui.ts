import type { MarketKey } from "@/lib/types";

/**
 * The market selector above the fixture list.
 *
 * Switching tab re-prices the whole board at once: every row's odds columns
 * show the chosen market, so a punter can scan a league on Over 2.5 without
 * opening a single match. The odds themselves are not new — deriveMarketBook
 * already computed them server-side; they were simply dropped on the way into
 * the UI shape, which only ever carried 1X2.
 *
 * `headers` doubles as the count of columns, which the row grid reads: 1X2 and
 * Double Chance have three outcomes, Over/Under and GG/NG only two.
 */
export interface MarketTab {
  key: MarketKey;
  /** Tab text. */
  label: string;
  /** Column headings, in order. Length drives the grid track count. */
  headers: string[];
  /** Market name written onto the bet slip. */
  slipLabel: string;
}

export const MARKET_TABS: MarketTab[] = [
  { key: "1x2", label: "1X2", headers: ["1", "X", "2"], slipLabel: "Match Result" },
  {
    key: "dc",
    label: "Double chance",
    headers: ["1X", "12", "X2"],
    slipLabel: "Double Chance",
  },
  {
    key: "ou25",
    label: "O/U 2.5",
    headers: ["Over", "Under"],
    slipLabel: "Over/Under 2.5",
  },
  {
    key: "btts",
    label: "GG/NG",
    headers: ["GG", "NG"],
    slipLabel: "Both Teams To Score",
  },
];

export function marketTab(key: MarketKey): MarketTab {
  return MARKET_TABS.find((t) => t.key === key) ?? MARKET_TABS[0];
}

/**
 * Grid track list for the odds columns, injected as a custom property.
 *
 * CSS `repeat()` will not take a custom property as its count — the integer
 * has to be a literal — so the whole track list is substituted instead. Two
 * outcomes get wider columns so the row doesn't leave a visible gap where the
 * third used to be.
 */
export function oddsTrack(columns: number): string {
  return columns === 2 ? "88px 88px" : "58px 58px 58px";
}
