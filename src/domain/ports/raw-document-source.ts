import type { RawDocument } from "@/domain/entities/raw-document";

export interface RawDocumentSourcePort {
  fetchLatest(): Promise<RawDocument[]>;
}
