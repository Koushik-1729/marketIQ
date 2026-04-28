import type { SourceKind } from "@/domain/value-objects/source-kind";
import type { RawPayloadFormat } from "@/lib/source-utils";

export type RawDocumentMetadata = {
  announcementType?: string;
  category?: string;
  eventTimestamp?: string;
  companyName?: string;
  earningsCandidate?: boolean;
  sentiment?: string;
  mentionCountSpike?: number;
  trendingScore?: number;
  [key: string]: unknown;
};

export type RawDocument = {
  id: string;
  sourceName: string;
  sourceKind: SourceKind;
  sourceReliabilityScore: number;
  urlHash: string;
  publishedAt: string;
  fetchedAt: string;
  title: string;
  url: string;
  content: string;
  tickersHint: string[];
  rawPayload: string;
  rawPayloadFormat: RawPayloadFormat;
  metadata: RawDocumentMetadata;
};
