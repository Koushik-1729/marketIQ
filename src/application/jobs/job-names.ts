export const jobNames = {
  ingestSources: "ingest-sources",
  runSignalEngine: "run-signal-engine",
  generateReport: "generate-report"
} as const;

export type JobName = (typeof jobNames)[keyof typeof jobNames];
