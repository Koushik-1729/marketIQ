"""
SQLAlchemy repository implementation for EarningsEvent.
"""
from __future__ import annotations

from typing import Sequence
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.market_data import EarningsEvent
from app.domain.ports.repositories import EarningsEventRepository


class PostgresEarningsEventRepository(EarningsEventRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, events: Sequence[EarningsEvent]) -> None:
        if not events:
            return
        for ev in events:
            await self.session.execute(
                text("""
                INSERT INTO "EarningsEvent" (
                    id, ticker, "companyName", "earningsDate", "fiscalQuarter", "fiscalYear",
                    "estimatedEPS", "actualEPS", "epsSurprisePercent", "estimatedRevenue",
                    "actualRevenue", "revenueSurprisePercent", "hasGuidance", "guidanceTone",
                    source, "sourceUrl", "createdAt"
                ) VALUES (
                    :id, :ticker, :companyName, NOW(), :fiscalQuarter::"FiscalQuarter", :fiscalYear,
                    :estimatedEPS, :actualEPS, :epsSurprisePercent, :estimatedRevenue,
                    :actualRevenue, :revenueSurprisePercent, :hasGuidance, :guidanceTone::"GuidanceTone",
                    :source::"EarningsSource", :sourceUrl, NOW()
                ) ON CONFLICT (id) DO NOTHING;
                """),
                {
                    "id": ev.id,
                    "ticker": ev.ticker,
                    "companyName": ev.company_name,
                    "fiscalQuarter": ev.fiscal_quarter,
                    "fiscalYear": ev.fiscal_year,
                    "estimatedEPS": ev.estimated_eps,
                    "actualEPS": ev.actual_eps,
                    "epsSurprisePercent": ev.eps_surprise_percent,
                    "estimatedRevenue": ev.estimated_revenue,
                    "actualRevenue": ev.actual_revenue,
                    "revenueSurprisePercent": ev.revenue_surprise_percent,
                    "hasGuidance": ev.has_guidance,
                    "guidanceTone": ev.guidance_tone,
                    "source": ev.source,
                    "sourceUrl": ev.source_url,
                },
            )
        await self.session.flush()

    async def find_latest_by_tickers(self, tickers: list[str]) -> dict[str, EarningsEvent]:
        if not tickers:
            return {}
        res = await self.session.execute(
            text("""
            SELECT DISTINCT ON (ticker) *
            FROM "EarningsEvent"
            WHERE ticker = ANY(:tickers)
            ORDER BY ticker, "earningsDate" DESC;
            """),
            {"tickers": tickers},
        )
        rows = res.mappings().all()
        result = {}
        for r in rows:
            result[r["ticker"]] = EarningsEvent(
                id=r["id"],
                ticker=r["ticker"],
                company_name=r["companyName"],
                fiscal_quarter=r["fiscalQuarter"],
                fiscal_year=r["fiscalYear"],
                estimated_eps=r["estimatedEPS"],
                actual_eps=r["actualEPS"],
                eps_surprise_percent=r["epsSurprisePercent"],
                estimated_revenue=r["estimatedRevenue"],
                actual_revenue=r["actualRevenue"],
                revenue_surprise_percent=r["revenueSurprisePercent"],
                has_guidance=r["hasGuidance"],
                guidance_tone=r["guidanceTone"],
                source=r["source"],
                source_url=r["sourceUrl"],
            )
        return result

    async def find_by_ticker(self, ticker: str, limit: int = 10) -> list[EarningsEvent]:
        res = await self.session.execute(
            text('SELECT * FROM "EarningsEvent" WHERE ticker = :ticker ORDER BY "earningsDate" DESC LIMIT :limit'),
            {"ticker": ticker, "limit": limit},
        )
        rows = res.mappings().all()
        return [
            EarningsEvent(
                id=r["id"],
                ticker=r["ticker"],
                company_name=r["companyName"],
                fiscal_quarter=r["fiscalQuarter"],
                fiscal_year=r["fiscalYear"],
                estimated_eps=r["estimatedEPS"],
                actual_eps=r["actualEPS"],
                eps_surprise_percent=r["epsSurprisePercent"],
                estimated_revenue=r["estimatedRevenue"],
                actual_revenue=r["actualRevenue"],
                revenue_surprise_percent=r["revenueSurprisePercent"],
                has_guidance=r["hasGuidance"],
                guidance_tone=r["guidanceTone"],
                source=r["source"],
                source_url=r["sourceUrl"],
            )
            for r in rows
        ]
