import {
  EarningsSource as PrismaEarningsSource,
  FiscalQuarter as PrismaFiscalQuarter,
  GuidanceTone as PrismaGuidanceTone
} from "@prisma/client";
import type { EarningsEvent } from "@/domain/entities/earnings-event";
import type { EarningsEventRepositoryPort } from "@/domain/ports/earnings-event-repository";
import { prisma } from "@/lib/prisma";

function mapRecord(record: {
  id: string;
  ticker: string;
  companyName: string;
  earningsDate: Date;
  fiscalQuarter: PrismaFiscalQuarter;
  fiscalYear: number;
  estimatedEPS: number | null;
  actualEPS: number | null;
  epsSurprisePercent: number | null;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  revenueSurprisePercent: number | null;
  hasGuidance: boolean;
  guidanceTone: PrismaGuidanceTone;
  source: PrismaEarningsSource;
  sourceUrl: string;
  operatingProfit: number | null;
  operatingMargin: number | null;
  netProfit: number | null;
  createdAt: Date;
}): EarningsEvent {
  return {
    id: record.id,
    ticker: record.ticker,
    companyName: record.companyName,
    earningsDate: record.earningsDate.toISOString(),
    fiscalQuarter: record.fiscalQuarter,
    fiscalYear: record.fiscalYear,
    estimatedEPS: record.estimatedEPS,
    actualEPS: record.actualEPS,
    epsSurprisePercent: record.epsSurprisePercent,
    estimatedRevenue: record.estimatedRevenue,
    actualRevenue: record.actualRevenue,
    revenueSurprisePercent: record.revenueSurprisePercent,
    hasGuidance: record.hasGuidance,
    guidanceTone: record.guidanceTone,
    source: record.source,
    sourceUrl: record.sourceUrl,
    operatingProfit: record.operatingProfit,
    operatingMargin: record.operatingMargin,
    netProfit: record.netProfit,
    createdAt: record.createdAt.toISOString()
  };
}

export class PostgresEarningsEventRepository implements EarningsEventRepositoryPort {
  async saveMany(events: EarningsEvent[]) {
    const saved: EarningsEvent[] = [];

    for (const event of events) {
      const record = await prisma.earningsEvent.upsert({
        where: {
          ticker_sourceUrl: {
            ticker: event.ticker,
            sourceUrl: event.sourceUrl
          }
        },
        update: {
          companyName: event.companyName,
          earningsDate: new Date(event.earningsDate),
          fiscalQuarter: event.fiscalQuarter,
          fiscalYear: event.fiscalYear,
          estimatedEPS: event.estimatedEPS,
          actualEPS: event.actualEPS,
          epsSurprisePercent: event.epsSurprisePercent,
          estimatedRevenue: event.estimatedRevenue,
          actualRevenue: event.actualRevenue,
          revenueSurprisePercent: event.revenueSurprisePercent,
          hasGuidance: event.hasGuidance,
          guidanceTone: event.guidanceTone,
          source: event.source
        },
        create: {
          ticker: event.ticker,
          companyName: event.companyName,
          earningsDate: new Date(event.earningsDate),
          fiscalQuarter: event.fiscalQuarter,
          fiscalYear: event.fiscalYear,
          estimatedEPS: event.estimatedEPS,
          actualEPS: event.actualEPS,
          epsSurprisePercent: event.epsSurprisePercent,
          estimatedRevenue: event.estimatedRevenue,
          actualRevenue: event.actualRevenue,
          revenueSurprisePercent: event.revenueSurprisePercent,
          hasGuidance: event.hasGuidance,
          guidanceTone: event.guidanceTone,
          source: event.source,
          sourceUrl: event.sourceUrl
        }
      });

      saved.push(mapRecord(record));
    }

    return saved;
  }

  async findLatestByTickers(tickers: string[]) {
    if (tickers.length === 0) {
      return [];
    }

    const records = await prisma.earningsEvent.findMany({
      where: { ticker: { in: tickers } },
      orderBy: [{ earningsDate: "desc" }, { createdAt: "desc" }]
    });

    const latestByTicker = new Map<string, (typeof records)[number]>();

    for (const record of records) {
      if (!latestByTicker.has(record.ticker)) {
        latestByTicker.set(record.ticker, record);
      }
    }

    return Array.from(latestByTicker.values()).map(mapRecord);
  }

  async findRecent(limit = 10) {
    const records = await prisma.earningsEvent.findMany({
      orderBy: [{ earningsDate: "desc" }, { createdAt: "desc" }],
      take: limit
    });

    return records.map(mapRecord);
  }

  async findUpcoming(params?: { from?: string; to?: string; limit?: number }) {
    const from = params?.from ? new Date(params.from) : new Date();
    const to = params?.to ? new Date(params.to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const limit = params?.limit ?? 50;

    const records = await prisma.earningsEvent.findMany({
      where: {
        earningsDate: {
          gte: from,
          lte: to
        }
      },
      orderBy: [{ earningsDate: "asc" }, { createdAt: "desc" }],
      take: limit
    });

    return records.map(mapRecord);
  }

  async findHistoryByTicker(ticker: string, limit = 12) {
    const records = await prisma.earningsEvent.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: [{ earningsDate: "desc" }, { createdAt: "desc" }],
      take: limit
    });

    return records.map(mapRecord);
  }
}
