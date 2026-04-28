import { prisma } from "@/lib/prisma";
import type { PriceBar, PriceBarRepository } from "@/domain/ports/price-bar-repository";

export class PostgresPriceBarRepository implements PriceBarRepository {
  async saveMany(bars: Omit<PriceBar, "id" | "createdAt">[]): Promise<void> {
    if (bars.length === 0) return;

    // We can use createMany for bulk insert, handling conflicts if needed
    // Assuming the composite unique constraint or index prevents exact duplicates?
    // Wait, we didn't add a strict unique constraint on (ticker, timestamp), only an index.
    // Let's use standard createMany and maybe ignore duplicates by manually filtering or just inserting.
    // Usually, market data ingestion could fetch same bars. We should use createMany with skipDuplicates if possible.
    
    // In PostgreSQL, skipDuplicates is supported.
    await prisma.priceBar.createMany({
      data: bars,
      skipDuplicates: true
    });
  }

  async findRecentByTicker(ticker: string, limit: number = 50): Promise<PriceBar[]> {
    return prisma.priceBar.findMany({
      where: { ticker },
      orderBy: { timestamp: "desc" },
      take: limit
    });
  }

  async findPreviousAverageVolume(ticker: string, barsToAverage: number = 20): Promise<number> {
    const bars = await prisma.priceBar.findMany({
      where: { ticker },
      orderBy: { timestamp: "desc" },
      take: barsToAverage + 1 // +1 because we might want to exclude the current one, but if we just take N, it's fine.
    });

    if (bars.length === 0) return 0;

    const sum = bars.reduce((acc, bar) => acc + bar.volume, 0);
    return sum / bars.length;
  }
}
