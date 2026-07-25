from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class EngineSignalModel(Base):
    __tablename__ = "EngineSignal"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    ticker: Mapped[str] = mapped_column(String, index=True)
    score: Mapped[float] = mapped_column(Float, index=True)
    confidence: Mapped[float] = mapped_column(Float)
    sentiment: Mapped[str] = mapped_column(String)  # positive, negative, neutral, mixed
    riskLevel: Mapped[str] = mapped_column(String)  # low, medium, high
    clusterHash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    explanation: Mapped[Optional[SignalExplanationModel]] = relationship(
        "SignalExplanationModel", back_populates="signal", cascade="all, delete-orphan", uselist=False
    )
    insight_cards: Mapped[List[InsightCardModel]] = relationship(
        "InsightCardModel", back_populates="signal"
    )

class SignalExplanationModel(Base):
    __tablename__ = "SignalExplanation"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    signalId: Mapped[str] = mapped_column(String, ForeignKey("EngineSignal.id", ondelete="CASCADE"), unique=True)
    reasons: Mapped[dict] = mapped_column(JSON)
    summary: Mapped[str] = mapped_column(Text)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    signal: Mapped[EngineSignalModel] = relationship("EngineSignalModel", back_populates="explanation")

class InsightCardModel(Base):
    __tablename__ = "insight_cards"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    signalId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("EngineSignal.id", ondelete="SET NULL"), nullable=True)
    ticker: Mapped[str] = mapped_column(String, index=True)
    companyName: Mapped[str] = mapped_column(String)
    cardType: Mapped[str] = mapped_column(String, index=True)
    headline: Mapped[str] = mapped_column(String)
    summary: Mapped[str] = mapped_column(Text)
    sentiment: Mapped[str] = mapped_column(String)
    confidence: Mapped[float] = mapped_column(Float)
    rating: Mapped[int] = mapped_column(Float)
    impactScore: Mapped[float] = mapped_column(Float, index=True)
    source: Mapped[str] = mapped_column(String)
    sourceUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pdfUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    publishedAt: Mapped[datetime] = mapped_column(DateTime, index=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    signal: Mapped[Optional[EngineSignalModel]] = relationship("EngineSignalModel", back_populates="insight_cards")
