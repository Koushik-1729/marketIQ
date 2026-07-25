from typing import List
import hashlib
from ..entities.raw_document import RawDocument, NormalizedDocument

def simple_hash(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def compact_text(input_text: str) -> str:
    return ' '.join(input_text.lower().split())

def normalize_documents(raw_docs: List[RawDocument]) -> List[NormalizedDocument]:
    seen_hashes = set()
    normalized = []
    
    for doc in raw_docs:
        canonical_title = compact_text(doc.title)
        canonical_content = compact_text(doc.content)
        
        url_hash = simple_hash(doc.url)
        title_hash = simple_hash(canonical_title)
        content_hash = simple_hash(canonical_content[:400])
        
        duplicate_key = f"{title_hash}:{content_hash}"
        is_duplicate = duplicate_key in seen_hashes
        seen_hashes.add(duplicate_key)
        
        normalized.append(NormalizedDocument(
            id=f"norm_{doc.id}",
            raw_document_id=doc.id,
            canonical_title=canonical_title,
            canonical_content=canonical_content,
            url_hash=url_hash,
            title_hash=title_hash,
            content_hash=content_hash,
            is_duplicate=is_duplicate
        ))
        
    return normalized
