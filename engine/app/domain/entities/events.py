from typing import Literal, List, Optional
from datetime import datetime
from pydantic import BaseModel

EVENT_TYPES = [
    "earnings", "merger_acquisition", "management_change", "regulatory", 
    "product_launch", "contract_win", "debt_restructuring", "insider_trading", 
    "dividend", "buyback", "litigation", "macro_policy", "sector_rotation", "generic"
]

EventType = Literal[
    "earnings", "insider_activity", "macro_policy", "sector_news", "regulation", 
    "unusual_volume", "sentiment_spike", "ipo", "management_change", "order_win", 
    "merger_acquisition", "litigation", "rating_change", "other"
]

Sentiment = Literal["positive", "negative", "neutral", "mixed"]

class ExtractedEvent(BaseModel):
    id: str
    document_id: str
    ticker: str
    company: str
    sector: str
    event_type: EventType
    sentiment: Sentiment
    confidence: float
    event_at: datetime
    keywords: List[str]
    evidence: List[str]
    source_name: str
    source_kind: str
    source_url: str
    pdf_url: Optional[str] = None

class EnrichedEvent(ExtractedEvent):
    classification_label: Literal[
        "verified_corporate", "market_structure", "sentiment_only", 
        "leadership_change", "rumor_like", "general_update"
    ]
    event_weight: float
    source_credibility_score: float
    is_rumor_like: bool

class EventCluster(BaseModel):
    id: str
    ticker: str
    company: str
    sector: str
    event_type: EventType
    sentiment: Sentiment
    event_ids: List[str]
    source_names: List[str]
    source_kinds: List[str]
    source_urls: List[str]
    pdf_urls: List[str]
    summary: str
    first_seen_at: datetime
    last_seen_at: datetime
    confidence: float
    corroboration_count: int
    event_weight: float
    average_source_credibility: float
    rumor_like_count: int
