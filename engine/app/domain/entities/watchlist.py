from typing import List, Literal
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
