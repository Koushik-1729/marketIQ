import type { EarningsEvent } from "@/domain/entities/earnings-event";

export interface EarningsEventRepositoryPort {
  saveMany(events: EarningsEvent[]): Promise<EarningsEvent[]>;
  findLatestByTickers(tickers: string[]): Promise<EarningsEvent[]>;
  findRecent(limit?: number): Promise<EarningsEvent[]>;
}
