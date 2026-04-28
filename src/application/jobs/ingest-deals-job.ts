import { engineRuntime } from "@/application/runtime/engine-runtime";
import { fetchBlockBulkDeals } from "@/adapters/inbound/sources/block-bulk-deal-source";

export async function ingestDealsJob() {
  console.info("[ingest-deals-job] Starting block/bulk deals ingestion");

  const job = await engineRuntime.jobRunRepository.createRunning("ingest-deals");
  const runId = job.id;

  try {
    const deals = await fetchBlockBulkDeals();

    if (deals.length > 0) {
      await engineRuntime.dealEventRepository.saveMany(deals);
      console.info(`[ingest-deals-job] Saved ${deals.length} deal records`);
    } else {
      console.info("[ingest-deals-job] No data fetched. Graceful fallback.");
    }

    await engineRuntime.jobRunRepository.markSuccess(runId);
  } catch (error) {
    console.error("[ingest-deals-job] Failed", error);
    await engineRuntime.jobRunRepository.markFailed(runId, error instanceof Error ? error.message : "Unknown error");
  }
}
