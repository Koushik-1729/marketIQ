from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel

InsightCardType = Literal["EARNINGS", "ORDER", "ANNOUNCEMENT", "DEAL", "CORPORATE_ACTION", "NEWS"]
InsightCardSentiment = Literal["positive", "negative", "neutral", "mixed"]

class InsightCard(BaseModel):
    id: str
    signal_id: Optional[str] = None
    ticker: str
    company_name: str
    card_type: InsightCardType
    headline: str
    summary: str
    sentiment: InsightCardSentiment
    confidence: float
    rating: float
    impact_score: float
    source: str
    source_url: Optional[str] = None
    pdf_url: Optional[str] = None
    published_at: datetime
    created_at: datetime
