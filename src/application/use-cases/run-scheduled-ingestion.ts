import { ingestRawDocuments } from "@/application/use-cases/ingest-raw-documents";
import { runSignalEngine } from "@/application/use-cases/run-signal-engine";
import type { ScheduledJob } from "@/adapters/inbound/schedulers/ingestion-schedule";

export async function runScheduledIngestion(job: ScheduledJob["jobId"]) {
  const ingestionSummary = await ingestRawDocuments();

  if (job === "closing_summary_ingestion") {
    return {
      job,
      ingestionSummary,
      signalRun: await runSignalEngine(false)
    };
  }

  return {
    job,
    ingestionSummary,
    signalRun: await runSignalEngine(false)
  };
}
