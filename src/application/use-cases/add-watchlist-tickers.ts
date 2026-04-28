import { engineRuntime } from "@/application/runtime/engine-runtime";

export async function addWatchlistTickers(tickers: string[]) {
  return engineRuntime.watchlistRepository.addTickersToPrimaryWatchlist(tickers);
}
