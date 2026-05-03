import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { summarizeEarningsHistory } from "@/domain/services/summarize-earnings-history";
import { withTimeoutValue } from "@/lib/async-utils";

async function safeLatestSignal(ticker: string) {
  const signals = await withTimeoutValue(
    () => engineRuntime.signalRepository.findMany({
      ticker,
      limit: 1,
      sort: "latest"
    }),
    []
  );
  return signals[0] ?? null;
}

export const getEarningsHistory = cache(async function getEarningsHistory(ticker: string, limit = 8) {
  noStore();

  const normalizedTicker = ticker.toUpperCase();
  const [history, latestSignal] = await Promise.all([
    withTimeoutValue(
      () => engineRuntime.earningsEventRepository.findHistoryByTicker(normalizedTicker, limit),
      []
    ),
    safeLatestSignal(normalizedTicker)
  ]);

  return {
    ticker: normalizedTicker,
    companyName: history[0]?.companyName ?? normalizedTicker,
    summary: summarizeEarningsHistory(history),
    latestSignal: latestSignal
      ? {
          id: latestSignal.id,
          eventType: latestSignal.eventType,
          summary: latestSignal.eventSummary,
          sentiment: latestSignal.sentiment,
          confidence: latestSignal.confidence,
          score: latestSignal.finalScore
        }
      : null,
    events: history
  };
});
