import { InsightCardType as PrismaInsightCardType, SignalSentiment } from "@prisma/client";
import type { InsightCard, InsightCardSentiment, InsightCardType } from "@/domain/entities/insight-card";
import type { InsightCardQuery, InsightCardRepositoryPort } from "@/domain/ports/insight-card-repository";
import { prisma } from "@/lib/prisma";

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function toPrismaCardType(type: InsightCardType): PrismaInsightCardType {
  return PrismaInsightCardType[type];
}

function toPrismaSentiment(sentiment: InsightCardSentiment): SignalSentiment {
  return SignalSentiment[sentiment];
}

function fromPrismaRecord(record: {
  id: string;
  signalId: string | null;
  ticker: string;
  companyName: string;
  cardType: PrismaInsightCardType;
  headline: string;
  summary: string;
  sentiment: SignalSentiment;
  confidence: number;
  rating: number;
  impactScore: number;
  source: string;
  sourceUrl: string | null;
  pdfUrl: string | null;
  publishedAt: Date;
  createdAt: Date;
}): InsightCard {
  return {
    id: record.id,
    signalId: record.signalId,
    ticker: record.ticker,
    companyName: record.companyName,
    cardType: record.cardType as InsightCardType,
    headline: record.headline,
    summary: record.summary,
    sentiment: record.sentiment as InsightCardSentiment,
    confidence: record.confidence,
    rating: record.rating,
    impactScore: record.impactScore,
    source: record.source,
    sourceUrl: record.sourceUrl,
    pdfUrl: record.pdfUrl,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class PostgresInsightCardRepository implements InsightCardRepositoryPort {
  async create(card: InsightCard): Promise<InsightCard> {
    const record = await prisma.insightCard.create({
      data: {
        id: card.id,
        signalId: card.signalId,
        ticker: card.ticker,
        companyName: card.companyName,
        cardType: toPrismaCardType(card.cardType),
        headline: card.headline,
        summary: card.summary,
        sentiment: toPrismaSentiment(card.sentiment),
        confidence: card.confidence,
        rating: card.rating,
        impactScore: card.impactScore,
        source: card.source,
        sourceUrl: card.sourceUrl,
        pdfUrl: card.pdfUrl,
        publishedAt: card.publishedAt
      }
    });

    return fromPrismaRecord(record);
  }

  async findLatest(filters: InsightCardQuery): Promise<InsightCard[]> {
    const limit = filters.limit ?? 20;

    const records = await prisma.insightCard.findMany({
      where: {
        ...(filters.ticker ? { ticker: filters.ticker } : {}),
        ...(filters.type ? { cardType: toPrismaCardType(filters.type) } : {}),
        ...(filters.sentiment ? { sentiment: toPrismaSentiment(filters.sentiment) } : {})
      },
      // Rank by impact score first (high alpha events float to top),
      // then by publication time for recency within same score band.
      orderBy: [{ impactScore: "desc" }, { publishedAt: "desc" }],
      take: limit
    });

    return records.map(fromPrismaRecord);
  }

  async findByTicker(ticker: string): Promise<InsightCard[]> {
    const records = await prisma.insightCard.findMany({
      where: { ticker },
      orderBy: [{ impactScore: "desc" }, { publishedAt: "desc" }],
      take: 50
    });

    return records.map(fromPrismaRecord);
  }

  async findByType(type: InsightCardType): Promise<InsightCard[]> {
    const records = await prisma.insightCard.findMany({
      where: { cardType: toPrismaCardType(type) },
      orderBy: [{ impactScore: "desc" }, { publishedAt: "desc" }],
      take: 50
    });

    return records.map(fromPrismaRecord);
  }

  async existsBySignalId(signalId: string): Promise<boolean> {
    const count = await prisma.insightCard.count({
      where: { signalId }
    });

    return count > 0;
  }
}
