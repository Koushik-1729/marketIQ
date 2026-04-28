import type { IngestionSummary, SourceIngestionStatus } from "@/application/dto/ingestion-summary";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { RawDocument } from "@/domain/entities/raw-document";
import { filterStockRelevantDocuments } from "@/domain/services/filter-stock-relevant-documents";
import { normalizeDocuments } from "@/domain/services/normalize-documents";
import { simpleHash } from "@/lib/hash";

export async function ingestRawDocuments(): Promise<IngestionSummary> {
  const startedAt = new Date().toISOString();
  const recentDocuments = await engineRuntime.rawDocumentRepository.findRecent(500);
  const recentTitleHashes = new Set(
    normalizeDocuments(recentDocuments).map((document) => document.titleHash)
  );
  const batchUrlHashes = new Set<string>();
  const batchTitleHashes = new Set<string>();
  const sourceStatuses: SourceIngestionStatus[] = [];
  const documentsToPersist: RawDocument[] = [];
  let fetchedDocuments = 0;
  let filteredOutDocuments = 0;
  let skippedDocuments = 0;

  for (const source of engineRuntime.sourceRegistry) {
    try {
      const fetched = await fetchWithRetry(() => source.adapter.fetchLatest(), 2);
      fetchedDocuments += fetched.length;
      const filtered = filterStockRelevantDocuments(fetched);
      filteredOutDocuments += filtered.filteredOut.length;
      let persisted = 0;
      let skipped = 0;
      let filteredOut = filtered.filteredOut.length;

      for (const document of filtered.kept) {
        const urlHash = document.urlHash;
        const titleHash = simpleHash(document.title.toLowerCase().trim());
        const alreadySeenByUrl =
          batchUrlHashes.has(urlHash) ||
          (await engineRuntime.rawDocumentRepository.existsByUrlHash(urlHash));
        const alreadySeenByTitle =
          batchTitleHashes.has(titleHash) || recentTitleHashes.has(titleHash);

        if (alreadySeenByUrl || alreadySeenByTitle) {
          skipped += 1;
          skippedDocuments += 1;
          continue;
        }

        batchUrlHashes.add(urlHash);
        batchTitleHashes.add(titleHash);
        documentsToPersist.push(document);
        persisted += 1;
      }

        sourceStatuses.push({
          sourceName: source.sourceName,
          fetched: fetched.length,
          filteredOut,
          persisted,
          skipped,
          status: skipped > 0 ? "partial" : "success",
        error: null
      });
    } catch (error) {
        sourceStatuses.push({
          sourceName: source.sourceName,
          fetched: 0,
          filteredOut: 0,
          persisted: 0,
          skipped: 0,
          status: "failed",
        error: error instanceof Error ? error.message : "Unknown ingestion error"
      });
    }
  }

  await engineRuntime.rawDocumentRepository.saveMany(documentsToPersist);

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    fetchedDocuments,
    filteredOutDocuments,
    persistedDocuments: documentsToPersist.length,
    skippedDocuments,
    sourceStatuses
  };
}

async function fetchWithRetry<T>(task: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
