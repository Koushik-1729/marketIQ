import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { EngineSignal } from "@/domain/entities/engine-signal";
import { withTimeoutValue } from "@/lib/async-utils";

type InsiderRadarQuery = {
  ticker?: string;
  limit?: number;
};

function looksLikeInsiderSignal(summary: string, eventType: string) {
  if (eventType === "insider_activity") {
    return true;
  }

  return /insider|promoter|stake|pledge|shareholding/i.test(summary);
}

function inferDirection(summary: string, sentiment: string) {
  const text = summary.toLowerCase();

  if (/buy|increase|raised stake|accumulated/.test(text)) return "buying";
  if (/sell|trimmed stake|offload|reduced stake/.test(text)) return "selling";
  if (sentiment === "positive") return "buying";
  if (sentiment === "negative") return "selling";
  return "watch";
}

async function safeDealsForTicker(ticker: string) {
  return withTimeoutValue(() => engineRuntime.dealEventRepository.findRecentByTicker(ticker, 30), []);
}

export const getInsiderRadar = cache(async function getInsiderRadar(
  query: InsiderRadarQuery = {}
) {
  noStore();

  const recentSignals: EngineSignal[] = await withTimeoutValue(
    () => engineRuntime.signalRepository.findRecent(
      Math.max((query.limit ?? 25) * 4, 100)
    ),
    []
  );
  const filteredSignals = recentSignals.filter(signal => {
    if (!looksLikeInsiderSignal(signal.eventSummary, signal.eventType)) {
      return false;
    }

    if (query.ticker && signal.ticker.toUpperCase() !== query.ticker.toUpperCase()) {
      return false;
    }

    return true;
  });

  const rankedSignals = filteredSignals
    .sort((left, right) => {
      if (right.finalScore !== left.finalScore) {
        return right.finalScore - left.finalScore;
      }

      return right.confidence - left.confidence;
    })
    .slice(0, query.limit ?? 25);

  const items = await Promise.all(
    rankedSignals.map(async signal => {
      const recentDeals = await safeDealsForTicker(signal.ticker);
      const latestDeal = recentDeals[0] ?? null;

      return {
        signalId: signal.id,
        ticker: signal.ticker,
        companyName: signal.company,
        eventType: signal.eventType,
        summary: signal.eventSummary,
        direction: inferDirection(signal.eventSummary, signal.sentiment),
        sentiment: signal.sentiment,
        confidence: signal.confidence,
        score: signal.finalScore,
        riskLevel: signal.riskLevel,
        supportingDeal: latestDeal
          ? {
              dealType: latestDeal.dealType,
              dealValue: latestDeal.dealValue,
              buyerName: latestDeal.buyerName,
              sellerName: latestDeal.sellerName,
              dealDate: latestDeal.dealDate
            }
          : null,
        reasons: signal.explanation.reasons
      };
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items
  };
});
