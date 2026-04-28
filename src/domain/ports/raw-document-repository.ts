import type { RawDocument } from "@/domain/entities/raw-document";

export interface RawDocumentRepositoryPort {
  saveMany(documents: RawDocument[]): Promise<RawDocument[]>;
  findRecent(limit?: number): Promise<RawDocument[]>;
  existsByUrlHash(urlHash: string): Promise<boolean>;
}
