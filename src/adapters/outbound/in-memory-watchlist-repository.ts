import type { Watchlist } from "@/domain/entities/watchlist";
import type { WatchlistRepositoryPort } from "@/domain/ports/watchlist-repository";

export class InMemoryWatchlistRepositoryAdapter implements WatchlistRepositoryPort {
  private watchlist: Watchlist = {
    userId: "usr_demo",
    tickers: ["RELIANCE", "INFY", "HDFCBANK"],
    sectors: ["Financials", "IT"],
    themes: ["capital-expenditure"],
    riskTolerance: "medium" as const
  };

  async getPrimaryWatchlist(): Promise<Watchlist> {
    return this.watchlist;
  }

  async addTickersToPrimaryWatchlist(tickers: string[]): Promise<Watchlist> {
    this.watchlist = {
      ...this.watchlist,
      tickers: Array.from(new Set([...this.watchlist.tickers, ...tickers]))
    };

    return this.watchlist;
  }
}
