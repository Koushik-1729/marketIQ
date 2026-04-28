import "dotenv/config";
import { runAllJobsOnce } from "../src/application/jobs/run-all-jobs-once";

async function main() {
  const result = await runAllJobsOnce();
  console.info(
    JSON.stringify(
      {
        ingestion: result.ingestion.jobRun.status,
        signalEngine: result.signalEngine.jobRun.status,
        report: result.report.jobRun.status
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[jobs] run once failed", error);
  process.exit(1);
});
