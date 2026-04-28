export type SourceIngestionStatus = {
  sourceName: string;
  fetched: number;
  filteredOut: number;
  persisted: number;
  skipped: number;
  status: "success" | "partial" | "failed";
  error: string | null;
};

export type IngestionSummary = {
  startedAt: string;
  completedAt: string;
  fetchedDocuments: number;
  filteredOutDocuments: number;
  persistedDocuments: number;
  skippedDocuments: number;
  sourceStatuses: SourceIngestionStatus[];
};
