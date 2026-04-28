import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { JobName } from "@/application/jobs/job-names";
import type { JobRun } from "@/domain/entities/job-run";

export async function runTrackedJob<T>(
  jobName: JobName,
  task: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ jobRun: JobRun; result: T }> {
  const jobRun = await engineRuntime.jobRunRepository.createRunning(jobName, metadata);

  try {
    const result = await task();
    const completed = await engineRuntime.jobRunRepository.markSuccess(jobRun.id, {
      ...metadata,
      completed: true
    });

    return {
      jobRun: completed,
      result
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job failure";
    const failed = await engineRuntime.jobRunRepository.markFailed(jobRun.id, message, metadata);
    throw Object.assign(error instanceof Error ? error : new Error(message), {
      jobRun: failed
    });
  }
}
