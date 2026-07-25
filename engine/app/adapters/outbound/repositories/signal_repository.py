"""
SQLAlchemy repository implementation for EngineSignal.
Communicates with the existing PostgreSQL database schema.
"""
from __future__ import annotations

from typing import Sequence
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import json
import structlog


from app.domain.entities.signal import EngineSignal, SignalExplanation
from app.domain.ports.repositories import SignalRepository

log = structlog.get_logger(__name__)


class PostgresSignalRepository(SignalRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, signals: Sequence[EngineSignal]) -> None:
        if not signals:
            return

        for sig in signals:
            await self.session.execute(
                text("""
                INSERT INTO "EngineSignal" (id, ticker, score, confidence, sentiment, "riskLevel", "createdAt", "clusterHash")
                VALUES (:id, :ticker, :score, :confidence, :sentiment, :riskLevel, NOW(), :clusterHash)
                ON CONFLICT (id) DO UPDATE SET
                    score = EXCLUDED.score,
                    confidence = EXCLUDED.confidence;
                """),
                {
                    "id": sig.id,
                    "ticker": sig.ticker,
                    "score": sig.finalScore,
                    "confidence": sig.confidence,
                    "sentiment": sig.sentiment,
                    "riskLevel": sig.riskLevel,
                    "clusterHash": sig.id,
                },
            )

            if sig.explanation:
                await self.session.execute(
                    text("""
                    INSERT INTO "SignalExplanation" (id, "signalId", reasons, summary, "createdAt")
                    VALUES (:id, :signalId, CAST(:reasons AS jsonb), :summary, NOW())
                    ON CONFLICT ("signalId") DO UPDATE SET summary = EXCLUDED.summary;

                    """),
                    {
                        "id": f"exp_{sig.id}",
                        "signalId": sig.id,
                        "reasons": json.dumps(sig.explanation.reasons),
                        "summary": ". ".join(sig.explanation.reasons) if sig.explanation.reasons else sig.eventSummary,
                    },

                )
        await self.session.flush()

    async def find_recent(self, limit: int = 50) -> list[EngineSignal]:
        res = await self.session.execute(
            text("""
            SELECT s.id, s.ticker, s.score, s.confidence, s.sentiment, s."riskLevel", s."createdAt",
                   e.summary, e.reasons
            FROM "EngineSignal" s
            LEFT JOIN "SignalExplanation" e ON e."signalId" = s.id
            ORDER BY s."createdAt" DESC
            LIMIT :limit;
            """),
            {"limit": limit},
        )
        rows = res.mappings().all()
        signals = []
        for r in rows:
            reasons = r["reasons"] if r["reasons"] else [r["summary"] or "Engine Signal"]
            if isinstance(reasons, str):
                reasons = [reasons]

            explanation = SignalExplanation(
                stock=r["ticker"],
                score=r["score"],
                reasons=reasons,
                risk=r["riskLevel"] or "medium",
                watchItems=[]
            )

            signals.append(
                EngineSignal(
                    id=r["id"],
                    ticker=r["ticker"],
                    company=r["ticker"],
                    sector="General",
                    eventType="earnings",
                    eventSummary=r["summary"] or "Live Market Signal",
                    sentiment=r["sentiment"] or "neutral",
                    confidence=r["confidence"] or 0.8,
                    impactScore=r["score"] or 64.0,
                    finalScore=r["score"] or 64.0,
                    riskLevel=r["riskLevel"] or "medium",
                    explanation=explanation,
                )
            )
        return signals

    async def find_by_ticker(self, ticker: str, limit: int = 20) -> list[EngineSignal]:
        res = await self.session.execute(
            text("""
            SELECT s.id, s.ticker, s.score, s.confidence, s.sentiment, s."riskLevel", s."createdAt",
                   e.summary, e.reasons
            FROM "EngineSignal" s
            LEFT JOIN "SignalExplanation" e ON e."signalId" = s.id
            WHERE s.ticker = :ticker
            ORDER BY s."createdAt" DESC
            LIMIT :limit;
            """),
            {"ticker": ticker, "limit": limit},
        )
        rows = res.mappings().all()
        signals = []
        for r in rows:
            reasons = r["reasons"] if r["reasons"] else [r["summary"] or "Engine Signal"]
            if isinstance(reasons, str):
                reasons = [reasons]

            explanation = SignalExplanation(
                stock=r["ticker"],
                score=r["score"],
                reasons=reasons,
                risk=r["riskLevel"] or "medium",
                watchItems=[]
            )

            signals.append(
                EngineSignal(
                    id=r["id"],
                    ticker=r["ticker"],
                    company=r["ticker"],
                    sector="General",
                    eventType="earnings",
                    eventSummary=r["summary"] or "Live Market Signal",
                    sentiment=r["sentiment"] or "neutral",
                    confidence=r["confidence"] or 0.8,
                    impactScore=r["score"] or 64.0,
                    finalScore=r["score"] or 64.0,
                    riskLevel=r["riskLevel"] or "medium",
                    explanation=explanation,
                )
            )
        return signals

    async def find_by_id(self, signal_id: str) -> EngineSignal | None:
        signals = await self.find_recent(limit=100)
        for s in signals:
            if s.id == signal_id:
                return s
        return None
