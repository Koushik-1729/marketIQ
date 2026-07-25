from typing import Literal, Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class RawDocument(BaseModel):
    id: str
    source_name: str
    source_kind: Literal["filing", "news", "social", "price", "flow", "deals"]
    source_reliability_score: float
    url_hash: str
    published_at: datetime
    fetched_at: datetime
    title: str
    url: str
    pdf_url: Optional[str] = None
    content: str
    tickers_hint: List[str]
    raw_payload: str
    raw_payload_format: str
    metadata: Dict[str, Any]

class NormalizedDocument(BaseModel):
    id: str
    raw_document_id: str
    canonical_title: str
    canonical_content: str
    url_hash: str
    title_hash: str
    content_hash: str
    is_duplicate: bool
