import type { MarketContext } from "@/domain/entities/market-context";
import type { MarketContextRepositoryPort } from "@/domain/ports/market-context-repository";
import { prisma } from "@/lib/prisma";

export class PostgresMarketContextRepository
  implements MarketContextRepositoryPort
{
  async getLatest(): Promise<MarketContext> {
    const record = await prisma.marketContextSnapshot.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return {
        niftyTrend: "neutral",
        bankNiftyTrend: "neutral",
        giftNiftyChange: 0,
        indiaVix: 0,
        fiiFlowCr: 0,
        diiFlowCr: 0,
        globalCues: "mixed",
        sectorStrength: {}
      };
    }

    return {
      niftyTrend: record.niftyTrend as MarketContext["niftyTrend"],
      bankNiftyTrend: record.bankNiftyTrend as MarketContext["bankNiftyTrend"],
      giftNiftyChange: record.giftNiftyChange,
      indiaVix: record.indiaVix,
      fiiFlowCr: record.fiiFlowCr,
      diiFlowCr: record.diiFlowCr,
      globalCues: record.globalCues as MarketContext["globalCues"],
      sectorStrength:
        typeof record.sectorStrength === "object" && record.sectorStrength !== null
          ? (record.sectorStrength as Record<string, number>)
          : {}
    };
  }
}
