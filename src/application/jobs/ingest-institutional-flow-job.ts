import { engineRuntime } from "@/application/runtime/engine-runtime";
import { fetchInstitutionalFlows } from "@/adapters/inbound/sources/institutional-flow-source";

export async function ingestInstitutionalFlowJob() {
  console.info("[ingest-institutional-flow-job] Starting institutional flow ingestion");

  const job = await engineRuntime.jobRunRepository.createRunning("ingest-institutional-flow");
  const runId = job.id;

  try {
    const flows = await fetchInstitutionalFlows();

    if (flows.length > 0) {
      await engineRuntime.institutionalFlowRepository.saveMany(flows);
      console.info(`[ingest-institutional-flow-job] Saved ${flows.length} institutional flow records`);
    } else {
      console.info("[ingest-institutional-flow-job] No data fetched. Graceful fallback.");
    }

    await engineRuntime.jobRunRepository.markSuccess(runId);
  } catch (error) {
    console.error("[ingest-institutional-flow-job] Failed", error);
    await engineRuntime.jobRunRepository.markFailed(runId, error instanceof Error ? error.message : "Unknown error");
  }
}
