from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class SourceCitation(BaseModel):
    quote: str
    sourceTitle: str
    sourceUrl: Optional[str] = None
    pdfUrl: Optional[str] = None
    publishedAt: str
    credibilityScore: Optional[float] = 0.92

class BacktestStats(BaseModel):
    winRate: float
    sampleSize: int
    timeframeDays: int
    avgPriceChange: float
    eventType: str

class SignalExplanation(BaseModel):
    stock: str
    score: float
    reasons: List[str] = Field(default_factory=list)
    risk: str = "medium"
    watchItems: List[str] = Field(default_factory=list)

class EngineSignal(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    ticker: str
    company: str
    sector: str = "Unknown"
    eventType: str = Field("earnings", alias="event_type")
    eventSummary: str = Field("Live Market Signal", alias="event_summary")
    sentiment: str = "neutral"
    confidence: float = 0.8
    impactScore: float = Field(64.0, alias="impact_score")
    finalScore: float = Field(64.0, alias="final_score")
    freshnessMinutes: int = 0
    sourceCount: int = 1
    riskLevel: str = Field("medium", alias="risk_level")
    conflictFlag: bool = False
    conflictReason: Optional[str] = None
    marketContext: str = "Live signal"
    priceValidation: str = "Live signal"
    narrativeState: str = "persisted"
    sources: List[str] = Field(default_factory=list)
    sourceUrls: List[str] = Field(default_factory=list)
    pdfUrls: List[str] = Field(default_factory=list)
    metaLabel: str = "keep"
    explanation: Optional[SignalExplanation] = None
    citation: Optional[SourceCitation] = None
    backtestStats: Optional[BacktestStats] = None
