import { prisma } from "@/lib/prisma";
import type { InstitutionalFlow, InstitutionalFlowRepository, MarketSegment, InvestorType } from "@/domain/ports/institutional-flow-repository";

export class PostgresInstitutionalFlowRepository implements InstitutionalFlowRepository {
  async saveMany(flows: Omit<InstitutionalFlow, "id" | "createdAt">[]): Promise<void> {
    if (flows.length === 0) return;

    await prisma.institutionalFlow.createMany({
      data: flows.map(f => ({
        date: new Date(f.date),
        investorType: f.investorType,
        marketSegment: f.marketSegment,
        buyValue: f.buyValue,
        sellValue: f.sellValue,
        netValue: f.netValue,
        source: f.source
      })),
      skipDuplicates: true
    });
  }

  async findLatest(segment: MarketSegment = "EQUITY"): Promise<InstitutionalFlow[]> {
    // We want the latest FII and DII records for the given segment.
    // Instead of complex group by, we can just fetch top 2 sorted by date if they are ingested together,
    // or fetch the absolute latest date and get records for that date.
    const latestRecord = await prisma.institutionalFlow.findFirst({
      where: { marketSegment: segment },
      orderBy: { date: "desc" }
    });

    if (!latestRecord) return [];

    const latestDate = latestRecord.date;
    const records = await prisma.institutionalFlow.findMany({
      where: {
        date: latestDate,
        marketSegment: segment
      }
    });

    return records.map(this.mapToDomain);
  }

  async findRecent(days: number, segment: MarketSegment = "EQUITY"): Promise<InstitutionalFlow[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const records = await prisma.institutionalFlow.findMany({
      where: {
        marketSegment: segment,
        date: { gte: cutoff }
      },
      orderBy: { date: "desc" }
    });

    return records.map(this.mapToDomain);
  }

  private mapToDomain(record: any): InstitutionalFlow {
    return {
      id: record.id,
      date: record.date.toISOString(),
      investorType: record.investorType as InvestorType,
      marketSegment: record.marketSegment as MarketSegment,
      buyValue: record.buyValue,
      sellValue: record.sellValue,
      netValue: record.netValue,
      source: record.source,
      createdAt: record.createdAt.toISOString()
    };
  }
}
