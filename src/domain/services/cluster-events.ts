import type { EnrichedEvent } from "@/domain/entities/enriched-event";
import type { EventCluster } from "@/domain/entities/event-cluster";

export function clusterEvents(events: EnrichedEvent[]) {
  const buckets = new Map<string, EnrichedEvent[]>();

  for (const event of events) {
    const key = `${event.ticker}:${event.eventType}:${event.sentiment}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(event);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries()).map<EventCluster>(([key, grouped]) => {
    const [ticker, eventType, sentiment] = key.split(":");
    const first = grouped[0];
    const uniqueSources = Array.from(new Set(grouped.map((item) => item.sourceName)));

    return {
      id: `cluster_${ticker}_${eventType}_${grouped.length}`,
      ticker,
      company: first.company,
      sector: first.sector,
      eventType: eventType as EventCluster["eventType"],
      sentiment: sentiment as EventCluster["sentiment"],
      eventIds: grouped.map((item) => item.id),
      sourceNames: uniqueSources,
      sourceKinds: Array.from(new Set(grouped.map((item) => item.sourceKind))),
      summary: grouped[0].evidence[0],
      firstSeenAt: grouped
        .map((item) => item.eventAt)
        .sort()[0],
      lastSeenAt: grouped
        .map((item) => item.eventAt)
        .sort()
        .at(-1) ?? grouped[0].eventAt,
      confidence:
        grouped.reduce((total, item) => total + item.confidence, 0) / grouped.length,
      corroborationCount: uniqueSources.length,
      eventWeight:
        grouped.reduce((total, item) => total + item.eventWeight, 0) / grouped.length,
      averageSourceCredibility:
        grouped.reduce((total, item) => total + item.sourceCredibilityScore, 0) /
        grouped.length,
      rumorLikeCount: grouped.filter((item) => item.isRumorLike).length
    };
  });
}
