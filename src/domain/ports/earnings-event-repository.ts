import type { EarningsEvent } from "@/domain/entities/earnings-event";

export interface EarningsEventRepositoryPort {
  saveMany(events: EarningsEvent[]): Promise<EarningsEvent[]>;
  findLatestByTickers(tickers: string[]): Promise<EarningsEvent[]>;
  findRecent(limit?: number): Promise<EarningsEvent[]>;
  findUpcoming(params?: {
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<EarningsEvent[]>;
  findHistoryByTicker(ticker: string, limit?: number): Promise<EarningsEvent[]>;
}
