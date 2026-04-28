import type { MarketContext } from "@/domain/entities/market-context";

export interface MarketContextRepositoryPort {
  getLatest(): Promise<MarketContext>;
}
