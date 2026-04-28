export type Watchlist = {
  userId: string;
  tickers: string[];
  sectors: string[];
  themes: string[];
  riskTolerance: "low" | "medium" | "high";
};
