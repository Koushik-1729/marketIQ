import "dotenv/config";
import { StocktwitsSourceAdapter } from "../src/adapters/inbound/sources/stocktwits-source";
import type { RawDocument } from "../src/domain/entities/raw-document";
import { filterStockRelevantDocuments } from "../src/domain/services/filter-stock-relevant-documents";

type HealthCheckResult = {
  source: string;
  status: "success" | "fail";
  httpStatus: number | null;
  fetchedCount: number;
  keptCount: number;
  sampleTitle: string | null;
  sampleTicker: string | null;
  sampleMetadata: Record<string, unknown> | null;
  error: string | null;
};

function inferHttpStatus(error: unknown) {
  if (error instanceof Error) {
    const match = error.message.match(/HTTP\s+(\d+)/i);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

async function runSourceCheck(
  source: string,
  task: () => Promise<RawDocument[]>
): Promise<HealthCheckResult> {
  try {
    const fetched = await task();
    const filtered = filterStockRelevantDocuments(fetched);
    const sample = filtered.kept[0] ?? fetched[0] ?? null;

    return {
      source,
      status: "success",
      httpStatus: 200,
      fetchedCount: fetched.length,
      keptCount: filtered.kept.length,
      sampleTitle: sample?.title ?? null,
      sampleTicker: sample?.tickersHint?.[0] ?? null,
      sampleMetadata: sample?.metadata ?? null,
      error: null
    };
  } catch (error) {
    return {
      source,
      status: "fail",
      httpStatus: inferHttpStatus(error),
      fetchedCount: 0,
      keptCount: 0,
      sampleTitle: null,
      sampleTicker: null,
      sampleMetadata: null,
      error: error instanceof Error ? error.message : "Unknown source error"
    };
  }
}

async function main() {
  const checks = await Promise.all([
    runSourceCheck("Stocktwits", () => new StocktwitsSourceAdapter().fetchLatest())
  ]);

  for (const check of checks) {
    console.log(JSON.stringify(check, null, 2));
  }

  const failed = checks.some((check) => check.status === "fail");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
