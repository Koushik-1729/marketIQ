"""
SQLAlchemy repository implementation for PriceBar and SectorBar.
"""
from __future__ import annotations

from typing import Sequence
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.market_data import PriceBar, SectorBar
from app.domain.ports.repositories import PriceBarRepository, SectorBarRepository


class PostgresPriceBarRepository(PriceBarRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, bars: Sequence[PriceBar]) -> None:
        if not bars:
            return
        for b in bars:
            await self.session.execute(
                text("""
                INSERT INTO price_bars (id, ticker, timestamp, open, high, low, close, volume, interval, source, "createdAt")
                VALUES (:id, :ticker, NOW(), :open, :high, :low, :close, :volume, :interval, :source, NOW())
                ON CONFLICT (id) DO NOTHING;
                """),
                {
                    "id": b.id,
                    "ticker": b.ticker,
                    "open": b.open,
                    "high": b.high,
                    "low": b.low,
                    "close": b.close,
                    "volume": b.volume,
                    "interval": b.interval,
                    "source": b.source,
                },
            )
        await self.session.flush()

    async def find_by_ticker_and_interval(self, ticker: str, interval: str, limit: int = 100) -> list[PriceBar]:
        res = await self.session.execute(
            text('SELECT * FROM price_bars WHERE ticker = :ticker AND interval = :interval ORDER BY timestamp DESC LIMIT :limit'),
            {"ticker": ticker, "interval": interval, "limit": limit},
        )
        rows = res.mappings().all()
        return [
            PriceBar(
                id=r["id"],
                ticker=r["ticker"],
                timestamp=r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"]),
                open=r["open"],
                high=r["high"],
                low=r["low"],
                close=r["close"],
                volume=r["volume"],
                interval=r["interval"],
                source=r["source"],
            )
            for r in rows
        ]

    async def find_latest(self, ticker: str) -> PriceBar | None:
        bars = await self.find_by_ticker_and_interval(ticker, "1d", limit=1)
        return bars[0] if bars else None


class PostgresSectorBarRepository(SectorBarRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, bars: Sequence[SectorBar]) -> None:
        if not bars:
            return
        for b in bars:
            await self.session.execute(
                text("""
                INSERT INTO sector_bars (id, sector, timestamp, close, "changePercent", "relativeStrength", "momentumScore", source, "createdAt")
                VALUES (:id, :sector, NOW(), :close, :changePercent, :relativeStrength, :momentumScore, :source, NOW())
                ON CONFLICT (id) DO NOTHING;
                """),
                {
                    "id": b.id,
                    "sector": b.sector,
                    "close": b.close,
                    "changePercent": b.change_percent,
                    "relativeStrength": b.relative_strength,
                    "momentumScore": b.momentum_score,
                    "source": b.source,
                },
            )
        await self.session.flush()

    async def get_latest_for_all_sectors(self) -> dict[str, SectorBar]:
        res = await self.session.execute(
            text("""
            SELECT DISTINCT ON (sector) *
            FROM sector_bars
            ORDER BY sector, timestamp DESC;
            """)
        )
        rows = res.mappings().all()
        result = {}
        for r in rows:
            result[r["sector"]] = SectorBar(
                id=r["id"],
                sector=r["sector"],
                timestamp=r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"]),
                close=r["close"],
                change_percent=r["changePercent"],
                relative_strength=r["relativeStrength"],
                momentum_score=r["momentumScore"],
                source=r["source"],
            )
        return result
