import { Prisma } from "@prisma/client";
import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentRepositoryPort } from "@/domain/ports/raw-document-repository";
import { prisma } from "@/lib/prisma";
import {
  deriveSourceReliabilityScore,
  extractLikelyTickers
} from "@/lib/source-utils";

function inferSourceKind(sourceName: string): RawDocument["sourceKind"] {
  const normalized = sourceName.toLowerCase();

  if (normalized.includes("filing") || normalized.includes("announcement")) {
    return "filing";
  }

  if (normalized.includes("stocktwits") || normalized.includes("twitter")) {
    return "social";
  }

  if (normalized.includes("tradingview") || normalized.includes("market")) {
    return "market_data";
  }

  return "news";
}

export class PostgresRawDocumentRepository implements RawDocumentRepositoryPort {
  async saveMany(documents: RawDocument[]) {
    for (const document of documents) {
      const rawData = {
        payload: document.rawPayload,
        format: document.rawPayloadFormat,
        tickersHint: document.tickersHint,
        metadata: document.metadata,
        sourceReliabilityScore: document.sourceReliabilityScore
      } as Prisma.InputJsonValue;

      await prisma.rawDocument.upsert({
        where: { id: document.id },
        update: {
          source: document.sourceName,
          url: document.url,
          title: document.title,
          content: document.content,
          rawData,
          rawPayloadFormat: document.rawPayloadFormat,
          urlHash: document.urlHash,
          publishedAt: new Date(document.publishedAt),
          fetchedAt: new Date(document.fetchedAt)
        },
        create: {
          id: document.id,
          source: document.sourceName,
          url: document.url,
          title: document.title,
          content: document.content,
          rawData,
          rawPayloadFormat: document.rawPayloadFormat,
          urlHash: document.urlHash,
          publishedAt: new Date(document.publishedAt),
          fetchedAt: new Date(document.fetchedAt)
        }
      });
    }

    return documents;
  }

  async findRecent(limit = 100) {
    const records = await prisma.rawDocument.findMany({
      orderBy: { fetchedAt: "desc" },
      take: limit
    });

    return records.map<RawDocument>((record) => ({
      id: record.id,
      sourceName: record.source,
      sourceKind: inferSourceKind(record.source),
      sourceReliabilityScore: (() => {
        const value = record.rawData as { sourceReliabilityScore?: unknown } | null;
        return typeof value?.sourceReliabilityScore === "number"
          ? value.sourceReliabilityScore
          : deriveSourceReliabilityScore(record.source);
      })(),
      urlHash: record.urlHash,
      publishedAt: record.publishedAt.toISOString(),
      fetchedAt: record.fetchedAt.toISOString(),
      title: record.title,
      url: record.url,
      content: record.content,
      tickersHint: (() => {
        const value = record.rawData as { tickersHint?: unknown } | null;
        if (Array.isArray(value?.tickersHint)) {
          return value.tickersHint.filter((item): item is string => typeof item === "string");
        }

        return extractLikelyTickers(`${record.title} ${record.content}`);
      })(),
      rawPayload: (() => {
        const value = record.rawData as { payload?: unknown } | null;
        return value?.payload ? String(value.payload) : JSON.stringify(record.rawData);
      })(),
      rawPayloadFormat: record.rawPayloadFormat as RawDocument["rawPayloadFormat"],
      metadata: (() => {
        const value = record.rawData as { metadata?: unknown } | null;
        return typeof value?.metadata === "object" && value.metadata !== null
          ? (value.metadata as RawDocument["metadata"])
          : {};
      })()
    }));
  }

  async existsByUrlHash(urlHash: string) {
    const record = await prisma.rawDocument.findUnique({
      where: { urlHash },
      select: { id: true }
    });

    return Boolean(record);
  }
}
