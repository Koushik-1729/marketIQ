"""
SQLAlchemy repository implementation for InsightCard.
"""
from __future__ import annotations

from typing import Sequence
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.insight_card import InsightCard
from app.domain.ports.repositories import InsightCardRepository


class PostgresInsightCardRepository(InsightCardRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, card: InsightCard) -> None:
        await self.session.execute(
            text("""
            INSERT INTO insight_cards (
                id, "signalId", ticker, "companyName", "cardType",
                headline, summary, sentiment, confidence, rating,
                "impactScore", source, "publishedAt", "createdAt"
            ) VALUES (
                :id, :signalId, :ticker, :companyName, :cardType::"InsightCardType",
                :headline, :summary, :sentiment::"SignalSentiment", :confidence, :rating,
                :impactScore, :source, NOW(), NOW()
            ) ON CONFLICT (id) DO NOTHING;
            """),
            {
                "id": card.id,
                "signalId": card.signal_id,
                "ticker": card.ticker,
                "companyName": card.company_name,
                "cardType": card.card_type,
                "headline": card.headline,
                "summary": card.summary,
                "sentiment": card.sentiment,
                "confidence": card.confidence,
                "rating": card.rating,
                "impactScore": card.impact_score,
                "source": card.source,
            },
        )
        await self.session.flush()

    async def find_recent(self, limit: int = 50) -> list[InsightCard]:
        res = await self.session.execute(
            text('SELECT * FROM insight_cards ORDER BY "publishedAt" DESC LIMIT :limit'),
            {"limit": limit},
        )
        rows = res.mappings().all()
        return [
            InsightCard(
                id=r["id"],
                signal_id=r["signalId"],
                ticker=r["ticker"],
                company_name=r["companyName"],
                card_type=r["cardType"],
                headline=r["headline"],
                summary=r["summary"],
                sentiment=r["sentiment"],
                confidence=r["confidence"],
                rating=r["rating"],
                impact_score=r["impactScore"],
                source=r["source"],
            )
            for r in rows
        ]

    async def find_by_ticker(self, ticker: str, limit: int = 20) -> list[InsightCard]:
        res = await self.session.execute(
            text('SELECT * FROM insight_cards WHERE ticker = :ticker ORDER BY "publishedAt" DESC LIMIT :limit'),
            {"ticker": ticker, "limit": limit},
        )
        rows = res.mappings().all()
        return [
            InsightCard(
                id=r["id"],
                signal_id=r["signalId"],
                ticker=r["ticker"],
                company_name=r["companyName"],
                card_type=r["cardType"],
                headline=r["headline"],
                summary=r["summary"],
                sentiment=r["sentiment"],
                confidence=r["confidence"],
                rating=r["rating"],
                impact_score=r["impactScore"],
                source=r["source"],
            )
            for r in rows
        ]
