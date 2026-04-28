import type { NormalizedDocument } from "@/domain/entities/normalized-document";
import type { RawDocument } from "@/domain/entities/raw-document";
import { simpleHash } from "@/lib/hash";

function compactText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeDocuments(rawDocuments: RawDocument[]) {
  const seenHashes = new Set<string>();

  return rawDocuments.map<NormalizedDocument>((document) => {
    const canonicalTitle = compactText(document.title);
    const canonicalContent = compactText(document.content);
    const urlHash = simpleHash(document.url);
    const titleHash = simpleHash(canonicalTitle);
    const contentHash = simpleHash(canonicalContent.slice(0, 400));
    const duplicateKey = `${titleHash}:${contentHash}`;
    const isDuplicate = seenHashes.has(duplicateKey);

    seenHashes.add(duplicateKey);

    return {
      id: `norm_${document.id}`,
      rawDocumentId: document.id,
      canonicalTitle,
      canonicalContent,
      urlHash,
      titleHash,
      contentHash,
      isDuplicate
    };
  });
}
