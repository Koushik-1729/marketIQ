import { jobNames } from "@/application/jobs/job-names";
import { runTrackedJob } from "@/application/jobs/job-runner";
import { runSignalEngine } from "@/application/use-cases/run-signal-engine";

export async function runSignalEngineJob(options?: { performIngestion?: boolean }) {
  return runTrackedJob(
    jobNames.runSignalEngine,
    async () => runSignalEngine(options?.performIngestion ?? true),
    options
  );
}

export function startManualSignalEngineJob() {
  const startedAt = new Date().toISOString();

  const task = runSignalEngineJob({ performIngestion: true }).catch((error) => {
    console.error("[jobs] manual signal engine job failed", error);
  });

  return {
    status: "started" as const,
    startedAt,
    task
  };
}
