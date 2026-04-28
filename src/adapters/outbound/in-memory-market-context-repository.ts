import type { MarketContext } from "@/domain/entities/market-context";
import type { MarketContextRepositoryPort } from "@/domain/ports/market-context-repository";

export class InMemoryMarketContextRepositoryAdapter
  implements MarketContextRepositoryPort
{
  async getLatest(): Promise<MarketContext> {
    return {
      niftyTrend: "bull" as const,
      bankNiftyTrend: "neutral" as const,
      giftNiftyChange: 114,
      indiaVix: 12.8,
      fiiFlowCr: -642,
      diiFlowCr: 1228,
      globalCues: "positive" as const,
      sectorStrength: {
        Energy: 3.4,
        Financials: -0.8,
        IT: 0.5,
        Auto: 2.1
      }
    };
  }
}
