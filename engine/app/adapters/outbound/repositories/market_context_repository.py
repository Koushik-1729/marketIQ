"""
SQLAlchemy repository implementation for MarketContextSnapshot, InstitutionalFlow, and DealEvent.
"""
from __future__ import annotations

from typing import Sequence
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.market_data import MarketContextSnapshot, InstitutionalFlow, DealEvent
from app.domain.ports.repositories import MarketContextRepository, InstitutionalFlowRepository, DealEventRepository


class PostgresMarketContextRepository(MarketContextRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, snapshot: MarketContextSnapshot) -> None:
        await self.session.execute(
            text("""
            INSERT INTO "MarketContextSnapshot" (
                id, "niftyTrend", "bankNiftyTrend", "giftNiftyChange", "indiaVix",
                "fiiFlowCr", "diiFlowCr", "globalCues", "sectorStrength", "createdAt"
            ) VALUES (
                :id, :niftyTrend, :bankNiftyTrend, :giftNiftyChange, :indiaVix,
                :fiiFlowCr, :diiFlowCr, :globalCues, :sectorStrength::jsonb, NOW()
            );
            """),
            {
                "id": snapshot.id,
                "niftyTrend": snapshot.nifty_trend,
                "bankNiftyTrend": snapshot.bank_nifty_trend,
                "giftNiftyChange": snapshot.gift_nifty_change,
                "indiaVix": snapshot.india_vix,
                "fiiFlowCr": snapshot.fii_flow_cr,
                "diiFlowCr": snapshot.dii_flow_cr,
                "globalCues": snapshot.global_cues,
                "sectorStrength": json.dumps(snapshot.sector_strength),
            },
        )
        await self.session.flush()

    async def get_latest(self) -> MarketContextSnapshot | None:
        res = await self.session.execute(
            text('SELECT * FROM "MarketContextSnapshot" ORDER BY "createdAt" DESC LIMIT 1')
        )
        r = res.mappings().first()
        if not r:
            return None
        return MarketContextSnapshot(
            id=r["id"],
            nifty_trend=r["niftyTrend"],
            bank_nifty_trend=r["bankNiftyTrend"],
            gift_nifty_change=r["giftNiftyChange"],
            india_vix=r["indiaVix"],
            fii_flow_cr=r["fiiFlowCr"],
            dii_flow_cr=r["diiFlowCr"],
            global_cues=r["globalCues"],
            sector_strength=r["sectorStrength"] if isinstance(r["sectorStrength"], dict) else json.loads(r["sectorStrength"] or "{}"),
        )


class PostgresInstitutionalFlowRepository(InstitutionalFlowRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, flows: Sequence[InstitutionalFlow]) -> None:
        if not flows:
            return
        for f in flows:
            await self.session.execute(
                text("""
                INSERT INTO institutional_flows (
                    id, date, "investorType", "marketSegment", "buyValue", "sellValue", "netValue", source, "createdAt"
                ) VALUES (
                    :id, NOW(), :investorType, :marketSegment, :buyValue, :sellValue, :netValue, :source, NOW()
                ) ON CONFLICT (id) DO NOTHING;
                """),
                {
                    "id": f.id,
                    "investorType": f.investor_type,
                    "marketSegment": f.market_segment,
                    "buyValue": f.buy_value,
                    "sellValue": f.sell_value,
                    "netValue": f.net_value,
                    "source": f.source,
                },
            )
        await self.session.flush()

    async def find_latest(self, market_segment: str = "EQUITY") -> list[InstitutionalFlow]:
        res = await self.session.execute(
            text('SELECT * FROM institutional_flows WHERE "marketSegment" = :segment ORDER BY date DESC LIMIT 2'),
            {"segment": market_segment},
        )
        rows = res.mappings().all()
        return [
            InstitutionalFlow(
                id=r["id"],
                date=r["date"].isoformat() if hasattr(r["date"], "isoformat") else str(r["date"]),
                investor_type=r["investorType"],
                market_segment=r["marketSegment"],
                buy_value=r["buyValue"],
                sell_value=r["sellValue"],
                net_value=r["netValue"],
                source=r["source"],
            )
            for r in rows
        ]


class PostgresDealEventRepository(DealEventRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_many(self, deals: Sequence[DealEvent]) -> None:
        if not deals:
            return
        for d in deals:
            await self.session.execute(
                text("""
                INSERT INTO deal_events (
                    id, ticker, "companyName", "dealType", "buyerName", "sellerName", quantity, price, "dealValue", "dealDate", source, "createdAt"
                ) VALUES (
                    :id, :ticker, :companyName, :dealType, :buyerName, :sellerName, :quantity, :price, :dealValue, NOW(), :source, NOW()
                ) ON CONFLICT (id) DO NOTHING;
                """),
                {
                    "id": d.id,
                    "ticker": d.ticker,
                    "companyName": d.company_name,
                    "dealType": d.deal_type,
                    "buyerName": d.buyer_name,
                    "sellerName": d.seller_name,
                    "quantity": d.quantity,
                    "price": d.price,
                    "dealValue": d.deal_value,
                    "source": d.source,
                },
            )
        await self.session.flush()

    async def find_recent_by_ticker(self, ticker: str, days: int = 7) -> list[DealEvent]:
        res = await self.session.execute(
            text('SELECT * FROM deal_events WHERE ticker = :ticker ORDER BY "dealDate" DESC LIMIT 20'),
            {"ticker": ticker},
        )
        rows = res.mappings().all()
        return [
            DealEvent(
                id=r["id"],
                ticker=r["ticker"],
                company_name=r["companyName"],
                deal_type=r["dealType"],
                buyer_name=r["buyerName"],
                seller_name=r["sellerName"],
                quantity=r["quantity"],
                price=r["price"],
                deal_value=r["dealValue"],
                deal_date=r["dealDate"].isoformat() if hasattr(r["dealDate"], "isoformat") else str(r["dealDate"]),
                source=r["source"],
            )
            for r in rows
        ]
