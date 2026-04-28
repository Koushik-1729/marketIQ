import type { Watchlist } from "@/domain/entities/watchlist";

export interface WatchlistRepositoryPort {
  getPrimaryWatchlist(): Promise<Watchlist>;
  addTickersToPrimaryWatchlist(tickers: string[]): Promise<Watchlist>;
}
