import { unstable_noStore as noStore } from "next/cache";
import type { DashboardData } from "@/application/dto/dashboard-data";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { rankSignalsForWatchlist } from "@/domain/services/personalize-signals";

export async function getDashboardData(): Promise<DashboardData> {
  noStore();

  try {
    const [marketContext, topSignals, watchlist] = await Promise.all([
      engineRuntime.marketContextRepository.getLatest(),
      engineRuntime.signalRepository.findRecent(24),
      engineRuntime.watchlistRepository.getPrimaryWatchlist()
    ]);

    const rankedWatchlistSignals = rankSignalsForWatchlist(topSignals, {
      tickers: watchlist.tickers,
      sectors: watchlist.sectors,
      themes: watchlist.themes
    }).map((entry) => entry.signal);

    return {
      marketMood: "Constructive with selective risk pockets",
      giftNifty: `${marketContext.giftNiftyChange > 0 ? "+" : ""}${marketContext.giftNiftyChange}`,
      fiiDii: `FII: ${marketContext.fiiFlowCr} Cr | DII: +${marketContext.diiFlowCr} Cr`,
      topSignals,
      watchlistSignals: rankedWatchlistSignals.slice(0, 6),
      riskSignals: topSignals.filter((signal) => signal.riskLevel === "high")
    };
  } catch (error) {
    console.error("[dashboard] failed to load persisted dashboard data", error);

    return {
      marketMood: "Data temporarily unavailable",
      giftNifty: "0.00",
      fiiDii: "FII: 0 Cr | DII: 0 Cr",
      topSignals: [],
      watchlistSignals: [],
      riskSignals: []
    };
  }
}
