import { prisma } from "@/lib/prisma";
import type { SectorBar, SectorBarRepository } from "@/domain/ports/sector-bar-repository";
import { SECTOR_INDEX_MAPPING } from "@/domain/data/sector-map";

export class PostgresSectorBarRepository implements SectorBarRepository {
  async saveMany(bars: Omit<SectorBar, "id" | "createdAt">[]): Promise<void> {
    if (bars.length === 0) return;

    await prisma.sectorBar.createMany({
      data: bars.map((b) => ({
        sector: b.sector,
        timestamp: new Date(b.timestamp),
        close: b.close,
        changePercent: b.changePercent,
        relativeStrength: b.relativeStrength,
        momentumScore: b.momentumScore,
        source: b.source
      })),
      skipDuplicates: true
    });
  }

  async findRecentBySector(sector: string, limit: number = 50): Promise<SectorBar[]> {
    const records = await prisma.sectorBar.findMany({
      where: { sector },
      orderBy: { timestamp: "desc" },
      take: limit
    });

    return records.map(this.mapToDomain);
  }

  async getLatestForAllSectors(): Promise<SectorBar[]> {
    const sectors = Object.keys(SECTOR_INDEX_MAPPING);
    const results: SectorBar[] = [];

    // Simple loop for each sector to get the latest bar
    for (const sector of sectors) {
      const record = await prisma.sectorBar.findFirst({
        where: { sector },
        orderBy: { timestamp: "desc" }
      });
      if (record) {
        results.push(this.mapToDomain(record));
      }
    }

    return results;
  }

  private mapToDomain(record: any): SectorBar {
    return {
      id: record.id,
      sector: record.sector,
      timestamp: record.timestamp.toISOString(),
      close: record.close,
      changePercent: record.changePercent,
      relativeStrength: record.relativeStrength,
      momentumScore: record.momentumScore,
      source: record.source,
      createdAt: record.createdAt.toISOString()
    };
  }
}
