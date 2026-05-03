import type { InsightCard, InsightCardSentiment, InsightCardType } from "@/domain/entities/insight-card";

export type InsightCardQuery = {
  type?: InsightCardType;
  ticker?: string;
  sentiment?: InsightCardSentiment;
  limit?: number;
};

export interface InsightCardRepositoryPort {
  create(card: InsightCard): Promise<InsightCard>;
  findLatest(filters: InsightCardQuery): Promise<InsightCard[]>;
  findByTicker(ticker: string): Promise<InsightCard[]>;
  findByType(type: InsightCardType): Promise<InsightCard[]>;
  existsBySignalId(signalId: string): Promise<boolean>;
}
