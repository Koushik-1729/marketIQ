import type { EnrichedEvent } from "@/domain/entities/enriched-event";
import type { ExtractedEvent } from "@/domain/entities/extracted-event";

export const EVENT_WEIGHTS: Record<ExtractedEvent["eventType"], number> = {
  earnings: 30,
  insider_activity: 40,
  macro_policy: 50,
  sector_news: 20,
  regulation: 28,
  unusual_volume: 22,
  sentiment_spike: 10,
  ipo: 16,
  management_change: 18,
  order_win: 26,
  merger_acquisition: 34,
  litigation: 32,
  rating_change: 12,
  other: 5
};

export const SOURCE_CREDIBILITY: Record<string, number> = {
  "NSE Filing": 10,
  "BSE Announcement": 10,
  "Reuters Markets": 10,
  "Economic Times": 8,
  Moneycontrol: 7,
  "Business Standard": 8,
  "CNBC TV18": 8,
  Stocktwits: 3,
  "X/Twitter": 3
};

function inferClassification(event: ExtractedEvent): EnrichedEvent["classificationLabel"] {
  if (event.sourceKind === "filing") return "verified_corporate";
  if (event.eventType === "unusual_volume") return "market_structure";
  if (event.eventType === "sentiment_spike") return "sentiment_only";
  if (event.eventType === "management_change") return "leadership_change";
  if (event.sourceKind === "social" && event.sentiment !== "neutral") return "rumor_like";
  return "general_update";
}

export function classifyEvents(events: ExtractedEvent[]) {
  return events.map<EnrichedEvent>((event) => {
    const classificationLabel = inferClassification(event);
    const sourceCredibilityScore = SOURCE_CREDIBILITY[event.sourceName] ?? 1;
    const isRumorLike =
      classificationLabel === "rumor_like" || classificationLabel === "sentiment_only";

    return {
      ...event,
      classificationLabel,
      eventWeight: EVENT_WEIGHTS[event.eventType],
      sourceCredibilityScore,
      isRumorLike
    };
  });
}
