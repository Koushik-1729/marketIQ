import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import type { LatestReport } from "@/application/dto/latest-report";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { getDashboardData } from "@/application/use-cases/get-dashboard-data";
import { getPrimaryWatchlist } from "@/application/use-cases/get-primary-watchlist";
import { validateInstitutionalFlow } from "@/domain/services/validate-institutional-flow";
import { rankReportSignals } from "@/domain/services/rank-report-signals";
import { buildPremarketReport } from "@/domain/services/build-premarket-report";
import type { EarningsEvent } from "@/domain/entities/earnings-event";
import type { SectorBar } from "@/domain/ports/sector-bar-repository";
import type { DealEvent } from "@/domain/ports/deal-event-repository";
import type { InstitutionalFlow } from "@/domain/ports/institutional-flow-repository";
import { withTimeout } from "@/lib/async-utils";

export const getLatestReport = cache(async function getLatestReport(): Promise<LatestReport> {
  noStore();
  const [dashboardResult, earningsResult, sectorsResult, flowsResult, dealsResult, watchlistResult] =
    await Promise.all([
      withTimeout(() => getDashboardData(), {
        marketMood: "Live market data unavailable",
        giftNifty: "Unavailable",
        fiiDii: "Unavailable",
        topSignals: [],
        watchlistSignals: [],
        riskSignals: []
      }),
      withTimeout<EarningsEvent[]>(
        () => engineRuntime.earningsEventRepository.findRecent(5),
        []
      ),
      withTimeout<SectorBar[]>(
        () => engineRuntime.sectorBarRepository.getLatestForAllSectors(),
        []
      ),
      withTimeout<InstitutionalFlow[]>(
        () => engineRuntime.institutionalFlowRepository.findLatest("EQUITY"),
        []
      ),
      withTimeout<DealEvent[]>(() => engineRuntime.dealEventRepository.findLatest(10), []),
      withTimeout(() => getPrimaryWatchlist(), {
        userId: "offline-user",
        tickers: [],
        sectors: [],
        themes: [],
        riskTolerance: "medium" as const
      })
    ]);

  const dashboard = dashboardResult.data;
  const recentEarningsEvents = earningsResult.data;
  const latestSectorBars = sectorsResult.data;
  const latestFlows = flowsResult.data;
  const latestDeals = dealsResult.data;
  const watchlist = watchlistResult.data;
  const dataStatus =
    dashboardResult.ok && (earningsResult.ok || sectorsResult.ok || flowsResult.ok || dealsResult.ok)
      ? "live"
      : "degraded";
  
  const flowValidation = validateInstitutionalFlow(latestFlows);

  // Pool all signals from the dashboard (Top + Risk + Watchlist) to rank them globally
  const allSignalsMap = new Map();
  [...dashboard.topSignals, ...dashboard.riskSignals, ...dashboard.watchlistSignals].forEach(s => {
    if (!allSignalsMap.has(s.ticker)) {
      allSignalsMap.set(s.ticker, s);
    }
  });
  
  const allUniqueSignals = Array.from(allSignalsMap.values());
  const rankedSignals = rankReportSignals(allUniqueSignals);

  // Format Earnings
  const earningsEventsFormatted = recentEarningsEvents.map((event) => {
    const linkedSignal = dashboard.topSignals.find(
      (signal) => signal.ticker === event.ticker
    );
    return {
      ticker: event.ticker,
      companyName: event.companyName,
      fiscalQuarter: event.fiscalQuarter,
      fiscalYear: event.fiscalYear,
      score: linkedSignal?.finalScore ?? linkedSignal?.impactScore ?? 40,
      summary: [
        `${event.fiscalQuarter} results announced`,
        event.epsSurprisePercent !== null
          ? `${event.epsSurprisePercent >= 0 ? "positive" : "negative"} EPS surprise`
          : event.actualEPS !== null
            ? `${event.actualEPS >= 0 ? "positive" : "negative"} EPS print`
            : "metrics pending",
        "high source reliability"
      ].join(" · "),
      source: event.source,
      guidanceTone: event.guidanceTone
    };
  });

  // Format Sectors
  const sectorMomentumFormatted = latestSectorBars.map((bar) => {
    let status = "Neutral";
    if (bar.relativeStrength > 0.5) status = "Strong";
    if (bar.relativeStrength < -0.5) status = "Weak";
    return {
      sector: bar.sector,
      status
    };
  });

  // Format Deals
  const recentDealsFormatted = latestDeals.map(deal => {
    let impact = "Neutral";
    if (deal.buyerName) impact = "Bullish";
    if (deal.sellerName) impact = "Bearish";
    if (deal.buyerName && deal.sellerName) impact = "Neutral (Rotation)";
    
    return {
      ticker: deal.ticker,
      dealType: deal.dealType,
      buyer: deal.buyerName ?? "Unknown",
      seller: deal.sellerName ?? "Unknown",
      value: deal.dealValue,
      signalImpact: impact
    };
  });

  // Build the premarket report
  const premarketSections = buildPremarketReport(
    dashboard.marketMood,
    rankedSignals,
    watchlist?.tickers || [],
    earningsEventsFormatted,
    sectorMomentumFormatted,
    {
      fiiNet: flowValidation.fiiNet,
      diiNet: flowValidation.diiNet,
      combinedNet: flowValidation.combinedNet,
      status: flowValidation.status
    },
    recentDealsFormatted
  );

  return {
    generatedAt: new Date().toISOString(),
    dataStatus,
    giftNifty: dashboard.giftNifty,
    fiiDii: dashboard.fiiDii,
    topSignals: dashboard.topSignals,
    riskSignals: dashboard.riskSignals,
    groupedSignals: {
      highAttention: dashboard.topSignals.slice(0, 5),
      riskEvents: dashboard.riskSignals,
      watchlistFocus: dashboard.watchlistSignals
    },
    priceValidatedSignals: dashboard.topSignals.map((s) => ({
      ticker: s.ticker,
      score: s.finalScore,
      priceMove: s.priceMove ?? "N/A",
      volumeRatio: s.volumeRatio ?? "N/A",
      confirmation: s.confirmationStatus ?? "NO_DATA",
      explanation: s.priceValidation
    })),
    ...premarketSections
  };
});
