import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { jobNames } from "@/application/jobs/job-names";
import { runTrackedJob } from "@/application/jobs/job-runner";

export async function generateReportJob() {
  return runTrackedJob(jobNames.generateReport, async () => getLatestReport());
}
