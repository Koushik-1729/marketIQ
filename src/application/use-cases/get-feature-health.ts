import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { getPrimaryWatchlist } from "@/application/use-cases/get-primary-watchlist";
import { getInsiderRadar } from "@/application/use-cases/get-insider-radar";
import { getUpcomingEarnings } from "@/application/use-cases/get-upcoming-earnings";
import { withTimeoutValue } from "@/lib/async-utils";

async function probe<T>(label: string, loader: () => Promise<T>) {
  try {
    const data = await loader();
    return {
      status: "ok" as const,
      data
    };
  } catch (error) {
    return {
      status: "degraded" as const,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export const getFeatureHealth = cache(async function getFeatureHealth() {
  noStore();

  const [report, watchlist, upcomingEarnings, insiderRadar, sectorBars, flows, deals, signals] =
    await Promise.all([
      probe("latest report", () => getLatestReport()),
      probe("primary watchlist", () => getPrimaryWatchlist()),
      probe("upcoming earnings", () => getUpcomingEarnings({ limit: 10 })),
      probe("insider radar", () => getInsiderRadar({ limit: 10 })),
      probe("sector bars", () => withTimeoutValue(() => engineRuntime.sectorBarRepository.getLatestForAllSectors(), [])),
      probe(
        "institutional flows",
        () => withTimeoutValue(() => engineRuntime.institutionalFlowRepository.findLatest("EQUITY"), [])
      ),
      probe("deal events", () => withTimeoutValue(() => engineRuntime.dealEventRepository.findLatest(10), [])),
      probe("signals", () => withTimeoutValue(() => engineRuntime.signalRepository.findRecent(25), []))
    ]);

  return {
    generatedAt: new Date().toISOString(),
    services: {
      latestReport: {
        status: report.status,
        topSignals: report.data?.topSignals.length ?? 0
      },
      watchlist: {
        status: watchlist.status,
        tickers: watchlist.data?.tickers.length ?? 0
      },
      earningsCalendar: {
        status: upcomingEarnings.status,
        upcomingCount: upcomingEarnings.data?.length ?? 0
      },
      insiderRadar: {
        status: insiderRadar.status,
        itemCount: insiderRadar.data?.items.length ?? 0
      },
      sectorMomentum: {
        status: sectorBars.status,
        sectorCount: sectorBars.data?.length ?? 0
      },
      institutionalFlows: {
        status: flows.status,
        itemCount: flows.data?.length ?? 0
      },
      dealFlow: {
        status: deals.status,
        itemCount: deals.data?.length ?? 0
      },
      signalStore: {
        status: signals.status,
        itemCount: signals.data?.length ?? 0
      }
    }
  };
});
