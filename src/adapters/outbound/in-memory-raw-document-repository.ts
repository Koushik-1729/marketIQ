import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentRepositoryPort } from "@/domain/ports/raw-document-repository";

export class InMemoryRawDocumentRepositoryAdapter
  implements RawDocumentRepositoryPort
{
  private readonly documents = new Map<string, RawDocument>();

  async saveMany(documents: RawDocument[]) {
    for (const document of documents) {
      this.documents.set(document.id, document);
    }

    return documents;
  }

  async findRecent(limit = 100) {
    return Array.from(this.documents.values())
      .sort((left, right) => right.fetchedAt.localeCompare(left.fetchedAt))
      .slice(0, limit);
  }

  async existsByUrlHash(urlHash: string) {
    return Array.from(this.documents.values()).some(
      (document) => document.urlHash === urlHash
    );
  }
}
