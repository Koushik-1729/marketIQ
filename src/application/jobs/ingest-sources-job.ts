import { ingestRawDocuments } from "@/application/use-cases/ingest-raw-documents";
import { jobNames } from "@/application/jobs/job-names";
import { runTrackedJob } from "@/application/jobs/job-runner";

export async function ingestSourcesJob() {
  return runTrackedJob(jobNames.ingestSources, async () => ingestRawDocuments());
}
