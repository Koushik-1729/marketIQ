import { RiskLevel, SignalSentiment } from "@prisma/client";
import type { EngineSignal } from "@/domain/entities/engine-signal";
import type { SignalQuery, SignalRepositoryPort } from "@/domain/ports/signal-repository";
import { prisma } from "@/lib/prisma";

function inferEventType(summary: string): EngineSignal["eventType"] {
  const text = summary.toLowerCase();

  if (/earnings|results|eps|revenue/.test(text)) return "earnings";
  if (/insider|promoter|stake/.test(text)) return "insider_activity";
  if (/management_change|ceo|cfo|resignation/.test(text)) return "management_change";
  if (/ipo|listing/.test(text)) return "ipo";
  if (/order|contract/.test(text)) return "order_win";
  if (/merger|acquisition/.test(text)) return "merger_acquisition";
  if (/regulation|sebi|rbi/.test(text)) return "regulation";
  if (/volume|breakout|breakdown/.test(text)) return "unusual_volume";

  return "other";
}

function mapRecordToSignal(record: {
  id: string;
  ticker: string;
  score: number;
  confidence: number;
  sentiment: SignalSentiment;
  riskLevel: RiskLevel;
  explanation: { summary: string; reasons: unknown } | null;
}): EngineSignal {
  const summary = record.explanation?.summary ?? "Persisted signal";

  return {
    id: record.id,
    ticker: record.ticker,
    company: record.ticker,
    sector: "Unknown",
    eventType: inferEventType(summary),
    eventSummary: summary,
    sentiment: record.sentiment,
    confidence: record.confidence,
    impactScore: record.score,
    finalScore: record.score,
    freshnessMinutes: 0,
    sourceCount: 0,
    riskLevel: record.riskLevel,
    conflictFlag: false,
    conflictReason: null,
    marketContext: "Persisted signal",
    priceValidation: "Persisted signal",
    narrativeState: "persisted",
    sources: [],
    metaLabel: "keep" as const,
    explanation: {
      stock: record.ticker,
      score: record.score,
      reasons: Array.isArray(record.explanation?.reasons)
        ? (record.explanation?.reasons as string[])
        : [],
      risk: record.riskLevel,
      watchItems: []
    }
  };
}

function toPrismaSentiment(
  sentiment: EngineSignal["sentiment"]
): SignalSentiment {
  return SignalSentiment[sentiment];
}

function toPrismaRiskLevel(riskLevel: EngineSignal["riskLevel"]): RiskLevel {
  return RiskLevel[riskLevel];
}

export class PostgresSignalRepository implements SignalRepositoryPort {
  async saveMany(signals: EngineSignal[]) {
    for (const signal of signals) {
      await prisma.engineSignal.upsert({
        where: { id: signal.id },
        update: {
          ticker: signal.ticker,
          score: signal.finalScore,
          confidence: signal.confidence,
          sentiment: toPrismaSentiment(signal.sentiment),
          riskLevel: toPrismaRiskLevel(signal.riskLevel),
          explanation: {
            upsert: {
              update: {
                reasons: signal.explanation.reasons,
                summary: signal.explanation.reasons.join(". ")
              },
              create: {
                reasons: signal.explanation.reasons,
                summary: signal.explanation.reasons.join(". ")
              }
            }
          }
        },
        create: {
          id: signal.id,
          ticker: signal.ticker,
          score: signal.finalScore,
          confidence: signal.confidence,
          sentiment: toPrismaSentiment(signal.sentiment),
          riskLevel: toPrismaRiskLevel(signal.riskLevel),
          explanation: {
            create: {
              reasons: signal.explanation.reasons,
              summary: signal.explanation.reasons.join(". ")
            }
          }
        }
      });
    }

    return signals;
  }

  async findRecent(limit = 100) {
    const records = await prisma.engineSignal.findMany({
      include: { explanation: true },
      orderBy: [{ createdAt: "desc" }, { score: "desc" }],
      take: limit
    });

    return records.map(mapRecordToSignal);
  }

  async findMany(query: SignalQuery): Promise<EngineSignal[]> {
    const orderBy =
      query.sort === "score_desc"
        ? [{ score: "desc" as const }]
        : query.sort === "score_asc"
          ? [{ score: "asc" as const }]
          : [{ createdAt: "desc" as const }, { score: "desc" as const }];

    const records = await prisma.engineSignal.findMany({
      where: {
        ...(query.ticker ? { ticker: query.ticker } : {}),
        ...(typeof query.minScore === "number" ? { score: { gte: query.minScore } } : {})
      },
      include: { explanation: true },
      orderBy,
      skip: query.skip ?? 0,
      take: query.limit ?? 20
    });

    return records.map(mapRecordToSignal);
  }

  async findById(id: string): Promise<EngineSignal | null> {
    const record = await prisma.engineSignal.findUnique({
      where: { id },
      include: { explanation: true }
    });

    if (!record) {
      return null;
    }

    return mapRecordToSignal(record);
  }
}
