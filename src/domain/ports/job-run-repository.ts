import type { JobRun } from "@/domain/entities/job-run";

export interface JobRunRepositoryPort {
  createRunning(jobName: string, metadata?: Record<string, unknown>): Promise<JobRun>;
  markSuccess(
    id: string,
    metadata?: Record<string, unknown>
  ): Promise<JobRun>;
  markFailed(
    id: string,
    error: string,
    metadata?: Record<string, unknown>
  ): Promise<JobRun>;
}
