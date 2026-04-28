import { generateReportJob } from "@/application/jobs/generate-report-job";
import { ingestSourcesJob } from "@/application/jobs/ingest-sources-job";
import { runSignalEngineJob } from "@/application/jobs/run-signal-engine-job";

export async function runAllJobsOnce() {
  const ingestion = await ingestSourcesJob();
  const signalEngine = await runSignalEngineJob({ performIngestion: false });
  const report = await generateReportJob();

  return {
    ingestion,
    signalEngine,
    report
  };
}
