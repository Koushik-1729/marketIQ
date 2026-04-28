import type { ExtractedEvent } from "@/domain/entities/extracted-event";

export type EventCluster = {
  id: string;
  ticker: string;
  company: string;
  sector: string;
  eventType: ExtractedEvent["eventType"];
  sentiment: ExtractedEvent["sentiment"];
  eventIds: string[];
  sourceNames: string[];
  sourceKinds: string[];
  summary: string;
  firstSeenAt: string;
  lastSeenAt: string;
  confidence: number;
  corroborationCount: number;
  eventWeight: number;
  averageSourceCredibility: number;
  rumorLikeCount: number;
};
