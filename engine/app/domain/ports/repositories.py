from abc import ABC, abstractmethod
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
