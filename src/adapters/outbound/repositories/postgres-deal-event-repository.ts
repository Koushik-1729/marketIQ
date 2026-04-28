import { prisma } from "@/lib/prisma";
import type { DealEvent, DealEventRepository, DealType } from "@/domain/ports/deal-event-repository";

export class PostgresDealEventRepository implements DealEventRepository {
  async saveMany(deals: Omit<DealEvent, "id" | "createdAt">[]): Promise<void> {
    if (deals.length === 0) return;

    await prisma.dealEvent.createMany({
      data: deals.map(d => ({
        ticker: d.ticker,
        companyName: d.companyName,
        dealType: d.dealType,
        buyerName: d.buyerName,
        sellerName: d.sellerName,
        quantity: d.quantity,
        price: d.price,
        dealValue: d.dealValue,
        dealDate: new Date(d.dealDate),
        source: d.source
      })),
      skipDuplicates: true
    });
  }

  async findLatest(limit: number = 50): Promise<DealEvent[]> {
    const records = await prisma.dealEvent.findMany({
      orderBy: { dealDate: "desc" },
      take: limit
    });
    return records.map(this.mapToDomain);
  }

  async findRecentByTicker(ticker: string, days: number = 7): Promise<DealEvent[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const records = await prisma.dealEvent.findMany({
      where: {
        ticker,
        dealDate: { gte: cutoff }
      },
      orderBy: { dealDate: "desc" }
    });

    return records.map(this.mapToDomain);
  }

  private mapToDomain(record: any): DealEvent {
    return {
      id: record.id,
      ticker: record.ticker,
      companyName: record.companyName,
      dealType: record.dealType as DealType,
      buyerName: record.buyerName,
      sellerName: record.sellerName,
      quantity: record.quantity,
      price: record.price,
      dealValue: record.dealValue,
      dealDate: record.dealDate.toISOString(),
      source: record.source,
      createdAt: record.createdAt.toISOString()
    };
  }
}
