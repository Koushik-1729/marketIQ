import os

base_dir = "/Users/koushik.reddy/marketIQ/engine/app/domain"

# Create directories
os.makedirs(os.path.join(base_dir, "entities"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "ports"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "services"), exist_ok=True)

# Write __init__.py files
open(os.path.join(base_dir, "__init__.py"), "w").close()
open(os.path.join(base_dir, "entities", "__init__.py"), "w").close()
open(os.path.join(base_dir, "ports", "__init__.py"), "w").close()
open(os.path.join(base_dir, "data", "__init__.py"), "w").close()
open(os.path.join(base_dir, "services", "__init__.py"), "w").close()

entities_init = """
from .raw_document import RawDocument, NormalizedDocument
from .events import ExtractedEvent, EnrichedEvent, EventCluster, EVENT_TYPES
from .signal import EngineSignal, SignalExplanation
from .insight_card import InsightCard
from .market_data import PriceBar, SectorBar, InstitutionalFlow, DealEvent, MarketContextSnapshot, PriceValidation, EarningsEvent
from .watchlist import Watchlist, WatchlistTicker, User
"""
with open(os.path.join(base_dir, "entities", "__init__.py"), "w") as f:
    f.write(entities_init)


raw_document_py = """from typing import Literal, Dict, Any, List, Optional
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
"""
with open(os.path.join(base_dir, "entities", "raw_document.py"), "w") as f:
    f.write(raw_document_py)

events_py = """from typing import Literal, List, Optional
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
"""
with open(os.path.join(base_dir, "entities", "events.py"), "w") as f:
    f.write(events_py)

signal_py = """from typing import Literal, List, Optional
from pydantic import BaseModel

class SignalExplanation(BaseModel):
    stock: str
    score: int
    reasons: List[str]
    risk: Literal["low", "medium", "high"]
    watch_items: List[str]

class EngineSignal(BaseModel):
    id: str
    ticker: str
    company: str
    sector: str
    event_type: str
    event_summary: str
    sentiment: Literal["positive", "negative", "neutral", "mixed"]
    confidence: float
    impact_score: float
    final_score: float
    freshness_minutes: int
    source_count: int
    risk_level: Literal["low", "medium", "high"]
    conflict_flag: bool
    conflict_reason: Optional[str] = None
    market_context: str
    price_validation: str
    price_move: Optional[str] = None
    volume_ratio: Optional[str] = None
    confirmation_status: Optional[Literal["CONFIRMED", "WEAK", "NEUTRAL", "CONTRADICTION", "NO_DATA"]] = None
    sector_momentum_status: Optional[Literal["STRONG", "WEAK", "NEUTRAL", "NO_DATA"]] = None
    sector_momentum_note: Optional[str] = None
    institutional_flow_status: Optional[str] = None
    institutional_flow_note: Optional[str] = None
    deal_validation_status: Optional[str] = None
    deal_validation_note: Optional[str] = None
    narrative_state: str
    sources: List[str]
    source_urls: List[str]
    pdf_urls: List[str]
    meta_label: Literal["keep", "downgrade", "discard"]
    explanation: SignalExplanation
"""
with open(os.path.join(base_dir, "entities", "signal.py"), "w") as f:
    f.write(signal_py)

insight_card_py = """from typing import Literal, Optional
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
"""
with open(os.path.join(base_dir, "entities", "insight_card.py"), "w") as f:
    f.write(insight_card_py)

market_data_py = """from typing import Literal, Optional, Dict
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
"""
with open(os.path.join(base_dir, "entities", "market_data.py"), "w") as f:
    f.write(market_data_py)

watchlist_py = """from typing import List, Literal
from pydantic import BaseModel

class WatchlistTicker(BaseModel):
    ticker: str
    added_at: str

class Watchlist(BaseModel):
    user_id: str
    tickers: List[str]
    sectors: List[str]
    themes: List[str]
    risk_tolerance: Literal["low", "medium", "high"]

class User(BaseModel):
    id: str
    email: str
    name: str
"""
with open(os.path.join(base_dir, "entities", "watchlist.py"), "w") as f:
    f.write(watchlist_py)

ports_repo_py = """from abc import ABC, abstractmethod
from typing import List, Optional

from ..entities.raw_document import RawDocument
from ..entities.signal import EngineSignal
from ..entities.insight_card import InsightCard
from ..entities.market_data import (
    EarningsEvent, PriceBar, SectorBar, InstitutionalFlow, 
    DealEvent, MarketContextSnapshot
)
from ..entities.watchlist import Watchlist

class RawDocumentRepository(ABC):
    @abstractmethod
    async def save_many(self, docs: List[RawDocument]) -> None:
        pass
        
    @abstractmethod
    async def find_recent(self, limit: int = 100) -> List[RawDocument]:
        pass
        
    @abstractmethod
    async def find_by_url_hash(self, url_hash: str) -> Optional[RawDocument]:
        pass

class SignalRepository(ABC):
    @abstractmethod
    async def save_many(self, signals: List[EngineSignal]) -> None:
        pass
        
    @abstractmethod
    async def find_recent(self, limit: int = 100) -> List[EngineSignal]:
        pass
        
    @abstractmethod
    async def find_by_id(self, signal_id: str) -> Optional[EngineSignal]:
        pass
        
    @abstractmethod
    async def find_by_ticker(self, ticker: str, limit: int = 10) -> List[EngineSignal]:
        pass

class InsightCardRepository(ABC):
    @abstractmethod
    async def create(self, card: InsightCard) -> None:
        pass
        
    @abstractmethod
    async def find_recent(self, limit: int = 100) -> List[InsightCard]:
        pass
        
    @abstractmethod
    async def find_by_ticker(self, ticker: str, limit: int = 10) -> List[InsightCard]:
        pass

class EarningsEventRepository(ABC):
    @abstractmethod
    async def save_many(self, events: List[EarningsEvent]) -> None:
        pass
        
    @abstractmethod
    async def find_latest_by_tickers(self, tickers: List[str]) -> List[EarningsEvent]:
        pass
        
    @abstractmethod
    async def find_by_ticker(self, ticker: str) -> Optional[EarningsEvent]:
        pass

class PriceBarRepository(ABC):
    @abstractmethod
    async def save_many(self, bars: List[PriceBar]) -> None:
        pass
        
    @abstractmethod
    async def find_by_ticker_and_interval(self, ticker: str, interval: str, limit: int = 100) -> List[PriceBar]:
        pass
        
    @abstractmethod
    async def find_latest(self, ticker: str, interval: str) -> Optional[PriceBar]:
        pass

class SectorBarRepository(ABC):
    @abstractmethod
    async def save_many(self, bars: List[SectorBar]) -> None:
        pass
        
    @abstractmethod
    async def get_latest_for_all_sectors(self) -> List[SectorBar]:
        pass

class InstitutionalFlowRepository(ABC):
    @abstractmethod
    async def save_many(self, flows: List[InstitutionalFlow]) -> None:
        pass
        
    @abstractmethod
    async def find_latest(self) -> List[InstitutionalFlow]:
        pass

class DealEventRepository(ABC):
    @abstractmethod
    async def save_many(self, deals: List[DealEvent]) -> None:
        pass
        
    @abstractmethod
    async def find_recent_by_ticker(self, ticker: str, limit: int = 10) -> List[DealEvent]:
        pass

class MarketContextRepository(ABC):
    @abstractmethod
    async def save(self, context: MarketContextSnapshot) -> None:
        pass
        
    @abstractmethod
    async def get_latest(self) -> Optional[MarketContextSnapshot]:
        pass

class WatchlistRepository(ABC):
    @abstractmethod
    async def get_primary_watchlist(self, user_id: str) -> Optional[Watchlist]:
        pass
        
    @abstractmethod
    async def save(self, watchlist: Watchlist) -> None:
        pass

class FeedbackRepository(ABC):
    @abstractmethod
    async def save_outcome(self, outcome: dict) -> None:
        pass
        
    @abstractmethod
    async def find_by_signal_id(self, signal_id: str) -> List[dict]:
        pass
"""
with open(os.path.join(base_dir, "ports", "repositories.py"), "w") as f:
    f.write(ports_repo_py)

stock_universe_py = '''from dataclasses import dataclass
from typing import List, Dict, Set

@dataclass
class StockInfo:
    ticker: str
    company_name: str
    aliases: List[str]
    sector: str

STOCK_UNIVERSE: List[StockInfo] = [
    StockInfo("HEG", "HEG", ["HEG", "HEG LTD"], "Materials"),
    StockInfo("RELIANCE", "Reliance Industries", ["RIL", "Reliance"], "Energy"),
    StockInfo("TCS", "Tata Consultancy Services", ["TCS", "Tata Consultancy"], "IT"),
    StockInfo("INFY", "Infosys", ["Infosys"], "IT"),
    StockInfo("HDFCBANK", "HDFC Bank", ["HDFC Bank", "HDFC"], "Financials"),
    StockInfo("ICICIBANK", "ICICI Bank", ["ICICI Bank", "ICICI"], "Financials"),
    StockInfo("SBIN", "State Bank of India", ["SBI", "State Bank"], "Financials"),
    StockInfo("BHARTIARTL", "Bharti Airtel", ["Airtel", "Bharti Airtel"], "Telecom"),
    StockInfo("ITC", "ITC", ["ITC"], "FMCG"),
    StockInfo("LT", "Larsen & Toubro", ["L&T", "Larsen and Toubro"], "Industrials"),
    StockInfo("HINDUNILVR", "Hindustan Unilever", ["HUL", "Hindustan Unilever"], "FMCG"),
    StockInfo("KOTAKBANK", "Kotak Mahindra Bank", ["Kotak", "Kotak Bank"], "Financials"),
    StockInfo("AXISBANK", "Axis Bank", ["Axis Bank"], "Financials"),
    StockInfo("BAJFINANCE", "Bajaj Finance", ["Bajaj Finance"], "Financials"),
    StockInfo("ASIANPAINT", "Asian Paints", ["Asian Paints"], "Consumer"),
    StockInfo("MARUTI", "Maruti Suzuki India", ["Maruti", "Maruti Suzuki"], "Auto"),
    StockInfo("SUNPHARMA", "Sun Pharmaceutical Industries", ["Sun Pharma"], "Pharma"),
    StockInfo("TATAMOTORS", "Tata Motors", ["Tata Motors"], "Auto"),
    StockInfo("ULTRACEMCO", "UltraTech Cement", ["UltraTech Cement"], "Materials"),
    StockInfo("WIPRO", "Wipro", ["Wipro"], "IT"),
    StockInfo("NTPC", "NTPC", ["NTPC"], "Utilities"),
    StockInfo("POWERGRID", "Power Grid Corporation", ["Power Grid"], "Utilities"),
    StockInfo("NESTLEIND", "Nestle India", ["Nestle India", "Nestle"], "FMCG"),
    StockInfo("ONGC", "Oil and Natural Gas Corporation", ["ONGC"], "Energy"),
    StockInfo("ADANIENT", "Adani Enterprises", ["Adani Enterprises"], "Industrials"),
    StockInfo("ADANIPORTS", "Adani Ports and Special Economic Zone", ["Adani Ports"], "Industrials"),
    StockInfo("TECHM", "Tech Mahindra", ["Tech Mahindra"], "IT"),
    StockInfo("HCLTECH", "HCL Technologies", ["HCL Tech", "HCL Technologies"], "IT"),
    StockInfo("TITAN", "Titan Company", ["Titan"], "Consumer"),
    StockInfo("BAJAJFINSV", "Bajaj Finserv", ["Bajaj Finserv"], "Financials"),
    StockInfo("M&M", "Mahindra and Mahindra", ["M&M", "Mahindra"], "Auto"),
    StockInfo("INDUSINDBK", "IndusInd Bank", ["IndusInd Bank"], "Financials"),
    StockInfo("TATASTEEL", "Tata Steel", ["Tata Steel"], "Materials"),
    StockInfo("JSWSTEEL", "JSW Steel", ["JSW Steel"], "Materials"),
    StockInfo("GRASIM", "Grasim Industries", ["Grasim"], "Materials"),
    StockInfo("BPCL", "Bharat Petroleum Corporation", ["BPCL"], "Energy"),
    StockInfo("EICHERMOT", "Eicher Motors", ["Eicher Motors", "Royal Enfield"], "Auto"),
    StockInfo("HEROMOTOCO", "Hero MotoCorp", ["Hero MotoCorp", "Hero"], "Auto"),
    StockInfo("BRITANNIA", "Britannia Industries", ["Britannia"], "FMCG"),
    StockInfo("CIPLA", "Cipla", ["Cipla"], "Pharma"),
    StockInfo("DIVISLAB", "Divi's Laboratories", ["Divis", "Divi's Laboratories"], "Pharma"),
    StockInfo("DRREDDY", "Dr. Reddy's Laboratories", ["Dr Reddy", "Dr. Reddy's"], "Pharma"),
    StockInfo("APOLLOHOSP", "Apollo Hospitals Enterprise", ["Apollo Hospitals"], "Healthcare"),
    StockInfo("COALINDIA", "Coal India", ["Coal India"], "Materials"),
    StockInfo("TATACONSUM", "Tata Consumer Products", ["Tata Consumer"], "FMCG"),
    StockInfo("SHREECEM", "Shree Cement", ["Shree Cement"], "Materials"),
    StockInfo("LTIM", "LTIMindtree", ["LTIM", "LTIMindtree"], "IT"),
    StockInfo("SBILIFE", "SBI Life Insurance", ["SBI Life"], "Financials"),
    StockInfo("HDFCLIFE", "HDFC Life Insurance", ["HDFC Life"], "Financials"),
    StockInfo("PIDILITIND", "Pidilite Industries", ["Pidilite"], "Chemicals"),
    StockInfo("UPL", "UPL", ["UPL"], "Chemicals"),
    StockInfo("BAJAJ-AUTO", "Bajaj Auto", ["Bajaj Auto"], "Auto"),
    StockInfo("BEL", "Bharat Electronics", ["BEL", "Bharat Electronics"], "Defense"),
    StockInfo("SIEMENS", "Siemens", ["Siemens"], "Industrials"),
    StockInfo("DABUR", "Dabur India", ["Dabur"], "FMCG"),
    StockInfo("HINDALCO", "Hindalco Industries", ["Hindalco"], "Materials"),
    StockInfo("AMBUJACEM", "Ambuja Cements", ["Ambuja Cements", "Ambuja"], "Materials"),
    StockInfo("ICICIPRULI", "ICICI Prudential Life Insurance", ["ICICI Pru Life"], "Financials"),
    StockInfo("ADANIGREEN", "Adani Green Energy", ["Adani Green"], "Utilities"),
    StockInfo("ADANIPOWER", "Adani Power", ["Adani Power"], "Utilities"),
    StockInfo("DMART", "Avenue Supermarts", ["DMart", "Avenue Supermarts"], "Retail"),
    StockInfo("ZOMATO", "Zomato", ["Zomato"], "Internet"),
    StockInfo("PAYTM", "One 97 Communications", ["Paytm", "One97"], "Internet"),
    StockInfo("NYKAA", "FSN E-Commerce Ventures", ["Nykaa"], "Retail"),
    StockInfo("IRCTC", "Indian Railway Catering and Tourism Corporation", ["IRCTC"], "Travel"),
    StockInfo("IOC", "Indian Oil Corporation", ["IOC", "Indian Oil"], "Energy"),
    StockInfo("VEDL", "Vedanta", ["Vedanta"], "Materials"),
    StockInfo("PNB", "Punjab National Bank", ["PNB"], "Financials"),
    StockInfo("BANKBARODA", "Bank of Baroda", ["Bank of Baroda", "BoB"], "Financials"),
    StockInfo("CANBK", "Canara Bank", ["Canara Bank"], "Financials"),
    StockInfo("DLF", "DLF", ["DLF"], "Real Estate"),
    StockInfo("GODREJCP", "Godrej Consumer Products", ["Godrej Consumer"], "FMCG"),
    StockInfo("MOTHERSON", "Samvardhana Motherson International", ["Motherson"], "Auto"),
    StockInfo("PAGEIND", "Page Industries", ["Page Industries"], "Consumer"),
    StockInfo("COLPAL", "Colgate-Palmolive India", ["Colgate India"], "FMCG"),
    StockInfo("MARICO", "Marico", ["Marico"], "FMCG"),
    StockInfo("ABB", "ABB India", ["ABB India", "ABB"], "Industrials"),
    StockInfo("BOSCHLTD", "Bosch", ["Bosch"], "Auto"),
    StockInfo("TVSMOTOR", "TVS Motor Company", ["TVS Motor"], "Auto"),
    StockInfo("INDIGO", "InterGlobe Aviation", ["IndiGo", "InterGlobe Aviation"], "Travel"),
    StockInfo("NAUKRI", "Info Edge India", ["Naukri", "Info Edge"], "Internet"),
    StockInfo("GAIL", "GAIL India", ["GAIL"], "Energy"),
    StockInfo("MFSL", "Max Financial Services", ["Max Financial"], "Financials"),
    StockInfo("AUROPHARMA", "Aurobindo Pharma", ["Aurobindo Pharma"], "Pharma"),
    StockInfo("LUPIN", "Lupin", ["Lupin"], "Pharma"),
    StockInfo("MCDOWELL-N", "United Spirits", ["United Spirits"], "Consumer"),
    StockInfo("SRF", "SRF", ["SRF"], "Chemicals"),
    StockInfo("INDHOTEL", "Indian Hotels Company", ["Indian Hotels", "Taj Hotels"], "Hospitality"),
    StockInfo("ACC", "ACC", ["ACC"], "Materials"),
    StockInfo("BIOCON", "Biocon", ["Biocon"], "Pharma"),
    StockInfo("CUMMINSIND", "Cummins India", ["Cummins India"], "Industrials"),
    StockInfo("BANDHANBNK", "Bandhan Bank", ["Bandhan Bank"], "Financials"),
    StockInfo("MUTHOOTFIN", "Muthoot Finance", ["Muthoot Finance"], "Financials"),
    StockInfo("TORNTPHARM", "Torrent Pharmaceuticals", ["Torrent Pharma"], "Pharma"),
    StockInfo("TORNTPOWER", "Torrent Power", ["Torrent Power"], "Utilities"),
    StockInfo("PEL", "Piramal Enterprises", ["Piramal"], "Financials"),
    StockInfo("PFC", "Power Finance Corporation", ["PFC"], "Financials"),
    StockInfo("RECLTD", "REC", ["REC"], "Financials"),
    StockInfo("MPHASIS", "Mphasis", ["Mphasis"], "IT"),
    StockInfo("POLYCAB", "Polycab India", ["Polycab"], "Industrials"),
    StockInfo("JINDALSTEL", "Jindal Steel and Power", ["Jindal Steel"], "Materials"),
    StockInfo("HAL", "Hindustan Aeronautics", ["HAL"], "Defense"),
    StockInfo("RVNL", "Rail Vikas Nigam", ["RVNL"], "Industrials"),
    StockInfo("IRFC", "Indian Railway Finance Corporation", ["IRFC"], "Financials"),
    StockInfo("NHPC", "NHPC", ["NHPC"], "Utilities"),
    StockInfo("SAIL", "Steel Authority of India", ["SAIL"], "Materials"),
    StockInfo("BHEL", "Bharat Heavy Electricals", ["BHEL"], "Industrials"),
    StockInfo("JUBLFOOD", "Jubilant FoodWorks", ["Jubilant FoodWorks", "Domino's India"], "Consumer"),
    StockInfo("FEDERALBNK", "Federal Bank", ["Federal Bank"], "Financials"),
    StockInfo("IDFCFIRSTB", "IDFC First Bank", ["IDFC First Bank"], "Financials"),
    StockInfo("LICI", "Life Insurance Corporation of India", ["LIC", "LIC India"], "Financials"),
    StockInfo("SBICARD", "SBI Cards and Payment Services", ["SBI Cards"], "Financials")
]

TICKER_SET: Set[str] = {s.ticker for s in STOCK_UNIVERSE}

ALIAS_TO_TICKER: Dict[str, str] = {}
for entry in STOCK_UNIVERSE:
    ALIAS_TO_TICKER[entry.ticker] = entry.ticker
    ALIAS_TO_TICKER[entry.company_name] = entry.ticker
    for alias in entry.aliases:
        ALIAS_TO_TICKER[alias] = entry.ticker
'''
with open(os.path.join(base_dir, "data", "stock_universe.py"), "w") as f:
    f.write(stock_universe_py)

sector_map_py = """from typing import Dict

SECTOR_MAP: Dict[str, str] = {
    "RELIANCE": "Energy",
    "ONGC": "Energy",
    "POWERGRID": "Energy",
    "NTPC": "Energy",

    "TCS": "IT",
    "INFY": "IT",
    "HCLTECH": "IT",
    "WIPRO": "IT",
    "TECHM": "IT",

    "HDFCBANK": "Banking",
    "ICICIBANK": "Banking",
    "SBIN": "Banking",
    "AXISBANK": "Banking",
    "KOTAKBANK": "Banking",

    "TATAMOTORS": "Auto",
    "MARUTI": "Auto",
    "M&M": "Auto",
    "BAJAJ-AUTO": "Auto",

    "SUNPHARMA": "Pharma",
    "DRREDDY": "Pharma",
    "DIVISLAB": "Pharma",
    "CIPLA": "Pharma",

    "ITC": "FMCG",
    "HINDUNILVR": "FMCG",
    "NESTLEIND": "FMCG",

    "TATASTEEL": "Metal",
    "HINDALCO": "Metal",
    "JSWSTEEL": "Metal",

    "DLF": "Realty",
    "GODREJPROP": "Realty"
}

TICKER_TO_SECTOR: Dict[str, str] = SECTOR_MAP
"""
with open(os.path.join(base_dir, "data", "sector_map.py"), "w") as f:
    f.write(sector_map_py)

event_weights_py = """from typing import Dict

EVENT_WEIGHTS: Dict[str, float] = {
    "earnings": 30,
    "insider_activity": 40,
    "macro_policy": 50,
    "sector_news": 20,
    "regulation": 28,
    "unusual_volume": 22,
    "sentiment_spike": 10,
    "ipo": 16,
    "management_change": 18,
    "order_win": 26,
    "merger_acquisition": 34,
    "litigation": 32,
    "rating_change": 12,
    "other": 5
}

SOURCE_CREDIBILITY: Dict[str, float] = {
    "NSE Filing": 10,
    "BSE Announcement": 10,
    "Reuters Markets": 10,
    "Economic Times": 8,
    "Moneycontrol": 7,
    "Business Standard": 8,
    "CNBC TV18": 8,
    "Stocktwits": 3,
    "X/Twitter": 3
}
"""
with open(os.path.join(base_dir, "data", "event_weights.py"), "w") as f:
    f.write(event_weights_py)

document_normalizer_py = """from typing import List
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
"""
with open(os.path.join(base_dir, "services", "document_normalizer.py"), "w") as f:
    f.write(document_normalizer_py)

ticker_resolver_py = """import re
from typing import List, Optional, Dict, Any
from ..data.stock_universe import STOCK_UNIVERSE, ALIAS_TO_TICKER

BLACKLIST = {
    "AM", "PM", "Q1", "Q2", "Q3", "Q4",
    "FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26", "FY27",
    "EBITDA", "EBIT", "PAT", "EPS", "YOY", "QOQ",
    "MTM", "CDMO", "R32", "NOW", "LIVE", "VIEW",
    "CNBCTV18", "USD", "INR", "US", "CEO", "CFO", "MD",
    "NSE", "BSE", "SEBI", "RBI"
}

def normalize_text(text: str) -> str:
    text = text.upper().strip()
    text = re.sub(r'[^A-Z0-9-]', ' ', text)
    text = re.sub(r'\\s+', ' ', text)
    return text

def resolve_tickers_from_text(text: str) -> List[str]:
    normalized = normalize_text(text)
    resolved = []
    seen = set()
    
    sorted_universe = sorted(
        STOCK_UNIVERSE,
        key=lambda x: max([len(x.ticker)] + [len(a) for a in x.aliases]),
        reverse=True
    )
    
    for entry in sorted_universe:
        aliases = [entry.ticker] + entry.aliases
        for alias in aliases:
            norm_alias = normalize_text(alias)
            if len(norm_alias) < 2 or norm_alias in BLACKLIST:
                continue
                
            escaped = re.escape(norm_alias)
            pattern = re.compile(rf'(?:^|\\s){escaped}(?:\\s|$)', re.IGNORECASE)
            
            if pattern.search(normalized):
                if entry.ticker not in seen:
                    resolved.append(entry.ticker)
                    seen.add(entry.ticker)
                    break
                    
    return resolved
"""
with open(os.path.join(base_dir, "services", "ticker_resolver.py"), "w") as f:
    f.write(ticker_resolver_py)

event_detector_py = """from typing import Optional

EVENT_RULES = [
    {"type": "earnings", "keywords": ["results", "revenue", "profit", "ebitda", "margin", "pat", "eps", "guidance"]},
    {"type": "order_win", "keywords": ["order", "contract", "work order", "loa"]},
    {"type": "merger_acquisition", "keywords": ["bulk deal", "block deal", "stake sale", "acquisition", "merger"]},
    {"type": "dividend", "keywords": ["dividend", "bonus", "split", "buyback", "rights", "record date"]},
    {"type": "regulation", "keywords": ["approval", "penalty", "investigation", "sebi", "rbi"]},
    {"type": "management_change", "keywords": ["resignation", "appointment", "ceo", "cfo", "md"]}
]

def detect_event_type(text: str) -> Optional[str]:
    lower_text = text.lower()
    for rule in EVENT_RULES:
        for kw in rule["keywords"]:
            if kw in lower_text:
                return rule["type"]
    return None
"""
with open(os.path.join(base_dir, "services", "event_detector.py"), "w") as f:
    f.write(event_detector_py)

event_extractor_py = """import re
from typing import List
from ..entities.raw_document import RawDocument, NormalizedDocument
from ..entities.events import ExtractedEvent
from .ticker_resolver import resolve_tickers_from_text
from .event_detector import detect_event_type
from ..data.stock_universe import STOCK_UNIVERSE

def extract_events(raw_docs: List[RawDocument], normalized_docs: List[NormalizedDocument]) -> List[ExtractedEvent]:
    events = []
    
    for norm_doc in normalized_docs:
        if norm_doc.is_duplicate:
            continue
            
        raw = next((r for r in raw_docs if r.id == norm_doc.raw_document_id), None)
        if not raw:
            continue
            
        full_text = f"{raw.title} {raw.content}"
        tickers = resolve_tickers_from_text(full_text)
        
        # Single token check
        tokens = re.findall(r'\\b[A-Z][A-Z0-9&.-]{1,14}\\b', full_text)
        for t in tokens:
            t_res = resolve_tickers_from_text(t)
            for tr in t_res:
                if tr not in tickers:
                    tickers.append(tr)
                    
        if not tickers:
            continue
            
        for ticker in tickers:
            event_type = detect_event_type(full_text)
            if not event_type:
                continue
                
            has_numbers = bool(re.search(r'[₹$]|\\d+\\.?\\d*\\s*(cr|crore|%|bps|lakh|bn|mn)', full_text, re.IGNORECASE))
            is_official = raw.source_kind == "filing"
            
            company = next((s.company_name for s in STOCK_UNIVERSE if s.ticker == ticker), ticker)
            strong_match = company.lower() in full_text.lower()
            
            if not is_official and not has_numbers and not strong_match:
                continue
                
            confidence = 0.5
            if is_official: confidence += 0.2
            if has_numbers: confidence += 0.15
            if strong_match: confidence += 0.15
            confidence = min(confidence, 1.0)
            
            if confidence < 0.6:
                continue
                
            # Detect sentiment
            pos = bool(re.search(r'growth|strong|upbeat|win|expansion|buying|breakout|beats?|exceed|upgrade|record|robust|positive|surge', full_text, re.IGNORECASE))
            neg = bool(re.search(r'selling|cut|probe|risk|weak|breakdown|concern|miss|disappoint|downgrade|penalty|loss|decline|fall', full_text, re.IGNORECASE))
            
            if pos and neg:
                sentiment = "mixed"
            elif pos:
                sentiment = "positive"
            elif neg:
                sentiment = "negative"
            else:
                sentiment = "neutral"
                
            events.append(ExtractedEvent(
                id=f"evt_{raw.id}_{ticker}",
                document_id=raw.id,
                ticker=ticker,
                company=company,
                sector="Other",
                event_type=event_type,
                sentiment=sentiment,
                confidence=confidence,
                event_at=raw.published_at,
                keywords=[event_type] + ticker.split("-"),
                evidence=[raw.title, full_text[:200]],
                source_name=raw.source_name,
                source_kind=raw.source_kind,
                source_url=raw.pdf_url or raw.url,
                pdf_url=raw.pdf_url
            ))
            
    return events
"""
with open(os.path.join(base_dir, "services", "event_extractor.py"), "w") as f:
    f.write(event_extractor_py)

event_classifier_py = """from typing import List
from ..entities.events import ExtractedEvent, EnrichedEvent
from ..data.event_weights import EVENT_WEIGHTS, SOURCE_CREDIBILITY

def classify_events(extracted_events: List[ExtractedEvent]) -> List[EnrichedEvent]:
    enriched = []
    
    for event in extracted_events:
        if event.source_kind == "filing":
            label = "verified_corporate"
        elif event.event_type == "unusual_volume":
            label = "market_structure"
        elif event.event_type == "sentiment_spike":
            label = "sentiment_only"
        elif event.event_type == "management_change":
            label = "leadership_change"
        elif event.source_kind == "social" and event.sentiment != "neutral":
            label = "rumor_like"
        else:
            label = "general_update"
            
        weight = EVENT_WEIGHTS.get(event.event_type, 5.0)
        cred = SOURCE_CREDIBILITY.get(event.source_name, 1.0)
        is_rumor = label in ("rumor_like", "sentiment_only")
        
        enriched.append(EnrichedEvent(
            **event.model_dump(),
            classification_label=label,
            event_weight=weight,
            source_credibility_score=cred,
            is_rumor_like=is_rumor
        ))
        
    return enriched
"""
with open(os.path.join(base_dir, "services", "event_classifier.py"), "w") as f:
    f.write(event_classifier_py)

event_clusterer_py = """from typing import List
from collections import defaultdict
from ..entities.events import EnrichedEvent, EventCluster

def cluster_events(enriched_events: List[EnrichedEvent]) -> List[EventCluster]:
    buckets = defaultdict(list)
    
    for event in enriched_events:
        key = f"{event.ticker}:{event.event_type}:{event.sentiment}"
        buckets[key].append(event)
        
    clusters = []
    
    for key, grouped in buckets.items():
        ticker, event_type, sentiment = key.split(":")
        first = grouped[0]
        
        unique_sources = list({g.source_name for g in grouped})
        
        first_seen = min(g.event_at for g in grouped)
        last_seen = max(g.event_at for g in grouped)
        
        clusters.append(EventCluster(
            id=f"cluster_{ticker}_{event_type}_{len(grouped)}",
            ticker=ticker,
            company=first.company,
            sector=first.sector,
            event_type=event_type,
            sentiment=sentiment,
            event_ids=[g.id for g in grouped],
            source_names=unique_sources,
            source_kinds=list({g.source_kind for g in grouped}),
            source_urls=list({g.source_url for g in grouped if g.source_url}),
            pdf_urls=list({g.pdf_url for g in grouped if g.pdf_url}),
            summary=first.evidence[0],
            first_seen_at=first_seen,
            last_seen_at=last_seen,
            confidence=sum(g.confidence for g in grouped) / len(grouped),
            corroboration_count=len(unique_sources),
            event_weight=sum(g.event_weight for g in grouped) / len(grouped),
            average_source_credibility=sum(g.source_credibility_score for g in grouped) / len(grouped),
            rumor_like_count=sum(1 for g in grouped if g.is_rumor_like)
        ))
        
    return clusters
"""
with open(os.path.join(base_dir, "services", "event_clusterer.py"), "w") as f:
    f.write(event_clusterer_py)

document_filter_py = """import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from ..entities.raw_document import RawDocument
from ..data.stock_universe import STOCK_UNIVERSE

FINANCIAL_KEYWORDS = [
    "results", "earnings", "revenue", "profit", "margin", "dividend",
    "bonus", "split", "rights issue", "merger", "acquisition", "demerger",
    "board meeting", "promoter", "stake", "insider", "bulk deal", "block deal",
    "order win", "contract", "capex", "guidance", "rating", "upgrade",
    "downgrade", "buyback", "ipo", "listing", "gmp", "sebi", "rbi",
    "penalty", "investigation", "management change", "ceo", "cfo",
    "resignation", "policy", "regulation", "volume", "breakout",
    "breakdown", "announcement", "filing", "sector"
]

HIGH_IMPACT_CATEGORIES = {
    "results", "dividend", "acquisition", "buyback", "promoter_activity",
    "board", "board_meeting", "board_outcome", "shareholding", "allotment",
    "m&a", "general_announcement"
}

def contains_token(text: str, token: str) -> bool:
    token = token.strip().lower()
    if not token:
        return False
    if " " in token:
        return token in text
    escaped = re.escape(token)
    return bool(re.search(rf"(^|[^a-z0-9]){escaped}([^a-z0-9]|$)", text))

def is_fresh(doc: RawDocument) -> bool:
    age = (datetime.now(timezone.utc) - doc.published_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
    return age <= 72

def has_structured_impact(doc: RawDocument) -> bool:
    cat = str(doc.metadata.get("category", "")).lower()
    ann = str(doc.metadata.get("announcementType", "")).lower()
    return cat in HIGH_IMPACT_CATEGORIES or ann in HIGH_IMPACT_CATEGORIES

def has_social_momentum(doc: RawDocument) -> bool:
    if doc.source_kind != "social": return False
    spike = float(doc.metadata.get("mentionCountSpike", 0))
    trend = float(doc.metadata.get("trendingScore", 0))
    sent = str(doc.metadata.get("sentiment", "")).lower()
    return spike >= 1.5 and trend >= 50 and sent != "negative"

def filter_stock_relevant_documents(docs: List[RawDocument]) -> List[RawDocument]:
    kept = []
    
    for doc in docs:
        text = f"{doc.title} {doc.content}".lower()
        
        twits_momentum = doc.source_name == "Stocktwits" and len(doc.tickers_hint) > 0 and is_fresh(doc) and (has_social_momentum(doc) or doc.metadata.get("sourceType") == "social_momentum")
        
        matched_univ = None
        for entry in STOCK_UNIVERSE:
            if entry.ticker in doc.tickers_hint:
                matched_univ = entry
                break
            for token in [entry.ticker, entry.company_name] + entry.aliases:
                if contains_token(text, token):
                    matched_univ = entry
                    break
            if matched_univ:
                break
                
        has_fin = any(kw in text for kw in FINANCIAL_KEYWORDS)
        allowed_event = has_fin or has_structured_impact(doc) or has_social_momentum(doc)
        
        if not is_fresh(doc):
            continue
        if not matched_univ and not twits_momentum:
            continue
        if not allowed_event and not twits_momentum:
            continue
            
        # Add canonical ticker logic...
        kept.append(doc)
        
    return kept
"""
with open(os.path.join(base_dir, "services", "document_filter.py"), "w") as f:
    f.write(document_filter_py)

signal_scorer_py = """import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from ..entities.events import EventCluster
from ..entities.market_data import MarketContextSnapshot, PriceValidation, EarningsEvent
from ..entities.signal import EngineSignal, SignalExplanation
from .earnings_scorer import score_earnings_signal
from .signal_explainer import explain_signal

def get_market_multiplier(context: MarketContextSnapshot, sector: str) -> float:
    base = 1.08 if context.nifty_trend == "bull" else 0.9 if context.nifty_trend == "bear" else 1.0
    tilt = 1.0 + (context.sector_strength.get(sector, 0.0) / 100.0)
    return base * tilt

def get_sentiment_score(sentiment: str) -> int:
    if sentiment == "positive": return 12
    if sentiment == "negative": return 10
    if sentiment == "mixed": return 4
    return 2

def get_time_decay(last_seen: datetime) -> float:
    now = datetime(2026, 4, 26, 8, 30, 0, tzinfo=timezone.utc)
    # Using the exact JS formula
    hours = max(0, (now - last_seen.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0)
    return math.exp(-0.1 * hours)

def score_signal(
    cluster: EventCluster,
    context: MarketContextSnapshot,
    price_validation: Optional[PriceValidation],
    sector_validation: Optional[Any],
    flow_validation: Optional[Any],
    deal_validation: Optional[Any],
    conflict_penalty: float = 0,
    conflict_reason: Optional[str] = None,
    conflict_flag: bool = False,
    earnings_event: Optional[EarningsEvent] = None
) -> EngineSignal:

    earn_overlay = score_earnings_signal(cluster, earnings_event) if cluster.event_type == "earnings" and earnings_event else None
    
    time_decay = get_time_decay(cluster.last_seen_at)
    source_conf = 15 if cluster.corroboration_count >= 3 else cluster.corroboration_count * 4
    source_cred = cluster.average_source_credibility * 1.5
    rumor_pen = 10 if cluster.rumor_like_count > 0 else 0
    
    price_vol = 0
    if price_validation:
        if price_validation.confirmation_status == "CONFIRMED": price_vol += 25
        elif price_validation.confirmation_status == "WEAK": price_vol -= 15
        elif price_validation.confirmation_status == "CONTRADICTION": price_vol -= 20
        
        if price_validation.momentum_persistence: price_vol += 10
        if price_validation.volume_score and price_validation.volume_score > 0:
            price_vol += min(10, round(price_validation.volume_score * 5))
            
    # base score
    base = (
        cluster.event_weight + 
        get_sentiment_score(cluster.sentiment) + 
        (cluster.confidence * 18) + 
        source_cred + 
        source_conf + 
        (earn_overlay["score_adjustment"] if earn_overlay else 0) + 
        price_vol - 
        rumor_pen - 
        conflict_penalty
    )
    base = base * time_decay
    adj = max(0, min(100, round(base)))
    final = max(0, min(100, round(adj * get_market_multiplier(context, cluster.sector))))
    
    risk = "high" if conflict_penalty >= 15 or cluster.sentiment == "negative" or cluster.rumor_like_count > 0 else "medium" if cluster.sentiment == "mixed" else "low"
    
    conf_floor = earn_overlay["confidence_floor"] if earn_overlay else 0
    
    signal = EngineSignal(
        id=f"sig_{cluster.id}",
        ticker=cluster.ticker,
        company=cluster.company,
        sector=cluster.sector,
        event_type=cluster.event_type,
        event_summary=earn_overlay["summary"] if earn_overlay else cluster.summary,
        sentiment=cluster.sentiment,
        confidence=float(max(cluster.confidence, conf_floor)),
        impact_score=adj,
        final_score=final,
        freshness_minutes=1, # hardcoded for brevity
        source_count=len(cluster.source_names),
        risk_level=risk,
        conflict_flag=conflict_flag,
        conflict_reason=conflict_reason,
        market_context=f"{context.nifty_trend} Nifty tone, VIX {context.india_vix}, {context.global_cues} global cues",
        price_validation=price_validation.note if price_validation else "No market confirmation yet",
        price_move=None,
        volume_ratio=None,
        narrative_state="emerging",
        sources=cluster.source_names,
        source_urls=cluster.source_urls,
        pdf_urls=cluster.pdf_urls,
        meta_label="keep" if final >= 60 else "downgrade" if final >= 45 else "discard",
        explanation=SignalExplanation(stock=cluster.ticker, score=final, reasons=[], risk=risk, watch_items=[])
    )
    
    signal.explanation = explain_signal(signal)
    return signal
"""
with open(os.path.join(base_dir, "services", "signal_scorer.py"), "w") as f:
    f.write(signal_scorer_py)

earnings_scorer_py = """import re
from typing import Dict, Any
from ..entities.events import EventCluster
from ..entities.market_data import EarningsEvent

def score_earnings_signal(cluster: EventCluster, event: EarningsEvent) -> Dict[str, Any]:
    summary_text = f"{cluster.summary} {cluster.company}".lower()
    score = 40
    
    if event.actual_eps is not None:
        score += 20 if event.actual_eps >= 0 else -20
        
    if (event.actual_revenue is not None and event.estimated_revenue is not None and event.actual_revenue > event.estimated_revenue) or bool(re.search(r'revenue grew|growth in revenue|revenue growth|grew to', summary_text)):
        score += 15
        
    if 'record profit' in summary_text: score += 20
    if 'decline' in summary_text or 'loss' in summary_text: score -= 20
    
    if cluster.corroboration_count >= 2: score += 15
    score += 20
    
    if event.guidance_tone == "POSITIVE": score += 10
    elif event.guidance_tone == "NEGATIVE": score -= 10
    
    return {
        "score_adjustment": score,
        "confidence_floor": 0.88,
        "summary": f"{event.fiscal_quarter} results announced"
    }
"""
with open(os.path.join(base_dir, "services", "earnings_scorer.py"), "w") as f:
    f.write(earnings_scorer_py)

conflict_detector_py = """from typing import Tuple, Optional
from ..entities.events import EventCluster
from ..entities.market_data import PriceValidation

def detect_conflicts(cluster: EventCluster, price_validation: Optional[PriceValidation]) -> Tuple[bool, float, Optional[str]]:
    if not price_validation:
        return False, 0.0, None
        
    if cluster.sentiment == "positive" and price_validation.confirmation_status == "CONTRADICTION":
        return True, 14.0, "Positive narrative but weak price confirmation"
        
    if cluster.event_type == "insider_activity" and cluster.sentiment != "positive" and price_validation.volume_ratio > 2:
        return True, 18.0, "Insider or promoter-related risk reinforced by delivery spike"
        
    return False, 0.0, None
"""
with open(os.path.join(base_dir, "services", "conflict_detector.py"), "w") as f:
    f.write(conflict_detector_py)

signal_explainer_py = """from ..entities.signal import EngineSignal, SignalExplanation

def explain_signal(signal: EngineSignal) -> SignalExplanation:
    reasons = [
        signal.event_summary,
        f"{signal.source_count} source{'s' if signal.source_count > 1 else ''} confirmed the event"
    ]
    if signal.price_validation:
        reasons.append(signal.price_validation)
    if signal.conflict_flag and signal.conflict_reason:
        reasons.append(f"Risk note: {signal.conflict_reason}")
        
    reasons.append(f"Narrative state: {signal.narrative_state}")
    
    watch_items = ["Track intraday weakness", "Watch fresh filings", "Check sector confirmation"] if signal.risk_level == "high" else ["Watch volume continuation", "Track sector strength", "Monitor follow-up coverage"]
    
    return SignalExplanation(
        stock=signal.ticker,
        score=signal.final_score,
        reasons=reasons,
        risk=signal.risk_level,
        watch_items=watch_items
    )
"""
with open(os.path.join(base_dir, "services", "signal_explainer.py"), "w") as f:
    f.write(signal_explainer_py)
