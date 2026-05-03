import type { RawDocument } from "@/domain/entities/raw-document";
import type { SourceKind } from "@/domain/value-objects/source-kind";
import {
  buildDocumentId,
  deriveSourceReliabilityScore,
  extractLikelyTickers,
  simpleHash,
  stripMarkup,
  type RawPayloadFormat
} from "@/lib/source-utils";

type BuildRawDocumentInput = {
  sourceName: string;
  sourceKind: SourceKind;
  title: string;
  url: string;
  pdfUrl?: string;
  publishedAt?: string;
  content: string;
  rawPayload: string;
  rawPayloadFormat: RawPayloadFormat;
  tickersHint?: string[];
  metadata?: Record<string, unknown>;
};

export abstract class BaseHttpSourceAdapter {
  private readonly requestTimeoutMs = 5000;

  protected async fetchText(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(this.requestTimeoutMs),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; AI-Market-Signal-Engine/0.1; +https://example.local)",
        accept: "text/html,application/json,application/xml,text/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}`);
    }

    return response.text();
  }

  protected async fetchJson<T>(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(this.requestTimeoutMs),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; AI-Market-Signal-Engine/0.1; +https://example.local)",
        accept: "application/json,text/plain,*/*",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}`);
    }

    return (await response.json()) as T;
  }

  protected buildRawDocument(input: BuildRawDocumentInput): RawDocument {
    const publishedAt = input.publishedAt ?? new Date().toISOString();

    return {
      id: buildDocumentId(input.sourceName, input.url, publishedAt),
      sourceName: input.sourceName,
      sourceKind: input.sourceKind,
      sourceReliabilityScore: deriveSourceReliabilityScore(input.sourceName),
      urlHash: simpleHash(input.url),
      publishedAt,
      fetchedAt: new Date().toISOString(),
      title: input.title.trim(),
      url: input.url,
      pdfUrl: input.pdfUrl,
      content: stripMarkup(input.content),
      tickersHint:
        input.tickersHint && input.tickersHint.length > 0
          ? input.tickersHint
          : extractLikelyTickers(input.title + " " + input.content),
      rawPayload: input.rawPayload,
      rawPayloadFormat: input.rawPayloadFormat,
      metadata: input.metadata ?? {}
    };
  }
}
