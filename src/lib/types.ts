export type Sport = {
  id: string;
  name: string;
  icon: string;
  count: number;
};

export type Market = {
  label: string; // e.g. "1", "X", "2"
  odds: number;
};

/** Markets offerable straight from a fixture row, via the selector above the list. */
export type MarketKey = "1x2" | "dc" | "ou25" | "btts";

export type MarketPick = {
  /** Stable id fragment. Combined with match id + market key to key a selection. */
  key: string; // "1" | "X" | "2" | "1X" | "O2.5" | "GG" …
  /** Column text on the button. */
  label: string;
  /** Human-readable pick for the bet slip, e.g. "Arsenal or Draw". */
  pick: string;
  odds: number;
};

/**
 * Per-match prices for each selectable market. Partial on purpose: the feed
 * does not quote every market on every fixture, and a row must still render
 * (with the cells disabled) when the chosen market is missing, or the columns
 * would stop lining up down the page.
 */
export type MarketBoard = Partial<Record<MarketKey, MarketPick[]>>;

export type Match = {
  id: string;
  league: string;
  leagueFlag: string;
  leagueFlagUrl?: string; // real flag image from the feed; emoji is the fallback
  country: string;
  sport: string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  homeColor: string;
  awayColor: string;
  homeLogo?: string; // real crest URL from the feed; falls back to initials badge
  awayLogo?: string;
  kickoff: string; // ISO-ish display string
  startTimeISO?: string; // full ISO kickoff timestamp, for the live second-clock
  live: boolean;
  minute?: number;
  halfTime?: boolean; // live match currently in the half-time break (show "HT")
  scoreHome?: number;
  scoreAway?: number;
  markets: Market[]; // 1 X 2
  /** Prices for every market the row selector can show. See MarketBoard. */
  board?: MarketBoard;
  marketCount: number;
  featured?: boolean;
  locked?: boolean; // betting closed (match started / live / admin-locked)
  lockLabel?: string; // short reason shown on the card, e.g. "Started"
};

export type Selection = {
  id: string; // matchId-market
  matchId: string;
  match: string; // "Arsenal vs Chelsea"
  market: string; // "Match Result"
  pick: string; // "Arsenal" / "Draw"
  odds: number;
};

export type Txn = {
  id: string;
  type: "deposit" | "withdrawal" | "winning" | "bet";
  method: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
};

export type Bet = {
  id: string;
  type: "single" | "multi";
  legs: { match: string; pick: string; odds: number; result: "won" | "lost" | "pending" }[];
  stake: number;
  totalOdds: number;
  potential: number;
  status: "won" | "lost" | "pending" | "cashout";
  date: string;
  currency?: string;
  verifyCode?: string; // 17-char ticket verification code (won-splash + ticket)
};
