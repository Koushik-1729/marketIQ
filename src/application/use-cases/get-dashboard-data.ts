import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import type { DashboardData } from "@/application/dto/dashboard-data";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { rankSignalsForWatchlist } from "@/domain/services/personalize-signals";
import { withTimeoutValue } from "@/lib/async-utils";

export const getDashboardData = cache(async function getDashboardData(): Promise<DashboardData> {
  noStore();

  try {
    const [marketContext, topSignals, watchlist] = await Promise.all([
      withTimeoutValue(
        () => engineRuntime.marketContextRepository.getLatest(),
        {
          niftyTrend: "neutral" as const,
          bankNiftyTrend: "neutral" as const,
          giftNiftyChange: 0,
          indiaVix: 0,
          fiiFlowCr: 0,
          diiFlowCr: 0,
          globalCues: "mixed" as const,
          sectorStrength: {}
        }
      ),
      withTimeoutValue(() => engineRuntime.signalRepository.findRecent(24), []),
      withTimeoutValue(
        () => engineRuntime.watchlistRepository.getPrimaryWatchlist(),
        {
          userId: "offline-user",
          tickers: [],
          sectors: [],
          themes: [],
          riskTolerance: "medium" as const
        }
      )
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
  } catch {
    return {
      marketMood: "Live market data unavailable",
      giftNifty: "Unavailable",
      fiiDii: "Unavailable",
      topSignals: [],
      watchlistSignals: [],
      riskSignals: []
    };
  }
});
