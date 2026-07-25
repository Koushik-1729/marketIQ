from typing import Literal, Optional, Dict
from datetime import datetime
from pydantic import BaseModel

class PriceBar(BaseModel):
    id: str
    ticker: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    interval: str
    source: str
    created_at: datetime

class SectorBar(BaseModel):
    id: str
    sector: str
    timestamp: datetime
    close: float
    change_percent: float
    relative_strength: float
    momentum_score: float
    source: str
    created_at: datetime

InvestorType = Literal["FII", "DII"]
MarketSegment = Literal["EQUITY", "DEBT", "FNO"]

class InstitutionalFlow(BaseModel):
    id: str
    date: datetime
    investor_type: InvestorType
    market_segment: MarketSegment
    buy_value: float
    sell_value: float
    net_value: float
    source: str
    created_at: datetime

DealType = Literal["BLOCK", "BULK"]

class DealEvent(BaseModel):
    id: str
    ticker: str
    company_name: str
    deal_type: DealType
    buyer_name: Optional[str] = None
    seller_name: Optional[str] = None
    quantity: float
    price: float
    deal_value: float
    deal_date: datetime
    source: str
    created_at: datetime

class MarketContextSnapshot(BaseModel):
    nifty_trend: Literal["bull", "neutral", "bear"]
    bank_nifty_trend: Literal["bull", "neutral", "bear"]
    gift_nifty_change: float
    india_vix: float
    fii_flow_cr: float
    dii_flow_cr: float
    global_cues: Literal["positive", "mixed", "negative"]
    sector_strength: Dict[str, float]

class PriceValidation(BaseModel):
    ticker: str
    price_change_percent: float
    volume_ratio: float
    volume_score: float
    volatility: float
    momentum_persistence: bool
    confirmation_status: Literal["CONFIRMED", "WEAK", "NEUTRAL", "CONTRADICTION", "NO_DATA"]
    note: str

FiscalQuarter = Literal["Q1", "Q2", "Q3", "Q4"]
GuidanceTone = Literal["POSITIVE", "NEUTRAL", "NEGATIVE", "UNKNOWN"]
EarningsSource = Literal["NSE", "BSE"]

class EarningsEvent(BaseModel):
    id: Optional[str] = None
    ticker: str
    company_name: str
    earnings_date: datetime
    fiscal_quarter: FiscalQuarter
    fiscal_year: int
    estimated_eps: Optional[float] = None
    actual_eps: Optional[float] = None
    eps_surprise_percent: Optional[float] = None
    estimated_revenue: Optional[float] = None
    actual_revenue: Optional[float] = None
    revenue_surprise_percent: Optional[float] = None
    has_guidance: bool
    guidance_tone: GuidanceTone
    source: EarningsSource
    source_url: str
    operating_profit: Optional[float] = None
    operating_margin: Optional[float] = None
    net_profit: Optional[float] = None
    created_at: Optional[datetime] = None
