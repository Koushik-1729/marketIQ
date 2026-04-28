export type JobRun = {
  id: string;
  jobName: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
};
