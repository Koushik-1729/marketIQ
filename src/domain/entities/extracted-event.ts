export type ExtractedEvent = {
  id: string;
  documentId: string;
  ticker: string;
  company: string;
  sector: string;
  eventType:
    | "earnings"
    | "insider_activity"
    | "macro_policy"
    | "sector_news"
    | "regulation"
    | "unusual_volume"
    | "sentiment_spike"
    | "ipo"
    | "management_change"
    | "order_win"
    | "merger_acquisition"
    | "litigation"
    | "rating_change"
    | "other";
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  eventAt: string;
  keywords: string[];
  evidence: string[];
  sourceName: string;
  sourceKind: string;
};
