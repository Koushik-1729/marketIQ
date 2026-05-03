export type InsightCardType =
  | "EARNINGS"
  | "ORDER"
  | "ANNOUNCEMENT"
  | "DEAL"
  | "CORPORATE_ACTION"
  | "NEWS";

export type InsightCardSentiment = "positive" | "negative" | "neutral" | "mixed";

export type InsightCard = {
  id: string;
  /** null when built without a persisted EngineSignal (e.g., direct from DealEvent) */
  signalId: string | null;
  ticker: string;
  companyName: string;
  cardType: InsightCardType;
  headline: string;
  summary: string;
  sentiment: InsightCardSentiment;
  /** 0–1 float from EngineSignal.confidence */
  confidence: number;
  /** 1–5 star rating derived from impactScore */
  rating: number;
  /** 0–100 from EngineSignal.impactScore (pre-market-adjusted) */
  impactScore: number;
  source: string;
  sourceUrl: string | null;
  pdfUrl: string | null;
  publishedAt: Date;
  createdAt: Date;
};
