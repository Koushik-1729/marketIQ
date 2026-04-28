import type { RawDocument } from "@/domain/entities/raw-document";

export type NormalizedDocument = {
  id: string;
  rawDocumentId: RawDocument["id"];
  canonicalTitle: string;
  canonicalContent: string;
  urlHash: string;
  titleHash: string;
  contentHash: string;
  isDuplicate: boolean;
};
