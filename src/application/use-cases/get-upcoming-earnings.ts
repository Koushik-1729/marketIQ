import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { EarningsEvent } from "@/domain/entities/earnings-event";
import { withTimeoutValue } from "@/lib/async-utils";

type UpcomingEarningsQuery = {
  from?: string;
  to?: string;
  limit?: number;
};

async function safeSignalsByTicker(limit: number) {
  const signals = await withTimeoutValue(() => engineRuntime.signalRepository.findRecent(limit), []);
  return new Map(signals.map(signal => [signal.ticker.toUpperCase(), signal]));
}

export const getUpcomingEarnings = cache(async function getUpcomingEarnings(
  query: UpcomingEarningsQuery = {}
) {
  noStore();

  const upcoming: EarningsEvent[] = await withTimeoutValue(
    () => engineRuntime.earningsEventRepository.findUpcoming(query),
    []
  );
  const signalsByTicker = await safeSignalsByTicker(Math.max((query.limit ?? 25) * 4, 50));

  return upcoming.map(event => {
    const linkedSignal = signalsByTicker.get(event.ticker.toUpperCase());

    return {
      ticker: event.ticker,
      companyName: event.companyName,
      earningsDate: event.earningsDate,
      fiscalQuarter: event.fiscalQuarter,
      fiscalYear: event.fiscalYear,
      source: event.source,
      sourceUrl: event.sourceUrl,
      guidanceTone: event.guidanceTone,
      signal: linkedSignal
        ? {
            id: linkedSignal.id,
            eventType: linkedSignal.eventType,
            summary: linkedSignal.eventSummary,
            sentiment: linkedSignal.sentiment,
            confidence: linkedSignal.confidence,
            score: linkedSignal.finalScore
          }
        : null
      };
  });
});
