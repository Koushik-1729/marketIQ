import type { ExtractedEvent } from "@/domain/entities/extracted-event";

export type EnrichedEvent = ExtractedEvent & {
  classificationLabel:
    | "verified_corporate"
    | "market_structure"
    | "sentiment_only"
    | "leadership_change"
    | "rumor_like"
    | "general_update";
  eventWeight: number;
  sourceCredibilityScore: number;
  isRumorLike: boolean;
};
