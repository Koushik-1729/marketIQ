"""
Embedded database persistence tools.
"""
from __future__ import annotations

from typing import Any
import structlog

from app.services.tool_service import register_tool

log = structlog.get_logger(__name__)


@register_tool("write_signal_to_db", "Signal DB Writer", rate_limit_per_minute=100)
async def write_signal_to_db(signal: dict[str, Any]) -> dict[str, Any]:
    """Persist EngineSignal dict to PostgreSQL."""
    try:
        from app.db.postgres import AsyncSessionLocal
        from app.adapters.outbound.repositories.signal_repository import PostgresSignalRepository
        from app.domain.entities.signal import EngineSignal

        sig_obj = EngineSignal(**signal) if isinstance(signal, dict) else signal
        async with AsyncSessionLocal() as session:
            repo = PostgresSignalRepository(session)
            await repo.save_many([sig_obj])
            await session.commit()
        return {"saved": True, "id": sig_obj.id}
    except Exception as exc:
        log.error("write_signal_failed", error=str(exc))
        return {"saved": False, "error": str(exc)}


@register_tool("write_insight_card_to_db", "Insight Card DB Writer", rate_limit_per_minute=100)
async def write_insight_card_to_db(card: dict[str, Any]) -> dict[str, Any]:
    """Persist InsightCard dict to PostgreSQL."""
    try:
        from app.db.postgres import AsyncSessionLocal
        from app.adapters.outbound.repositories.insight_card_repository import PostgresInsightCardRepository
        from app.domain.entities.insight_card import InsightCard

        card_obj = InsightCard(**card) if isinstance(card, dict) else card
        async with AsyncSessionLocal() as session:
            repo = PostgresInsightCardRepository(session)
            await repo.create(card_obj)
            await session.commit()
        return {"saved": True, "id": card_obj.id}
    except Exception as exc:
        log.error("write_card_failed", error=str(exc))
        return {"saved": False, "error": str(exc)}


@register_tool("score_signal", "Signal Scorer", rate_limit_per_minute=100)
async def score_signal_tool(
    cluster: dict[str, Any],
    context: dict[str, Any],
    price_validation: dict[str, Any],
    sector_validation: dict[str, Any],
    flow_validation: dict[str, Any],
    deal_validation: dict[str, Any],
) -> dict[str, Any]:
    """Compute final EngineSignal from validations."""
    from app.domain.services.signal_scorer import score_signal
    from app.domain.entities.events import EventCluster
    from app.domain.entities.market_data import MarketContextSnapshot, PriceValidation

    c_obj = EventCluster(**cluster) if isinstance(cluster, dict) else cluster
    ctx_obj = MarketContextSnapshot(**context) if isinstance(context, dict) else context
    pv_obj = PriceValidation(**price_validation) if isinstance(price_validation, dict) else price_validation

    sig = score_signal(c_obj, ctx_obj, pv_obj, sector_validation, flow_validation, deal_validation)
    return sig.model_dump()


@register_tool("explain_signal", "Signal Explainer", rate_limit_per_minute=100)
async def explain_signal_tool(signal: dict[str, Any]) -> dict[str, Any]:
    """Generate human-readable explanation for an engine signal."""
    from app.domain.services.signal_explainer import explain_signal
    from app.domain.entities.signal import EngineSignal

    sig_obj = EngineSignal(**signal) if isinstance(signal, dict) else signal
    exp = explain_signal(sig_obj)
    return exp.model_dump()


@register_tool("cluster_events", "Event Clusterer", rate_limit_per_minute=100)
async def cluster_events_tool(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Group enriched events into EventCluster list."""
    from app.domain.services.event_clusterer import cluster_events
    from app.domain.entities.events import EnrichedEvent

    enr = [EnrichedEvent(**e) for e in events]
    clusters = cluster_events(enr)
    return {"clusters": [c.model_dump() for c in clusters]}


@register_tool("filter_signals", "Signal Filter", rate_limit_per_minute=100)
async def filter_signals_tool(signals: list[dict[str, Any]], threshold: float = 35.0) -> dict[str, Any]:
    """Filter out signals below score threshold."""
    filtered = [s for s in signals if s.get("final_score", 0) >= threshold]
    return {"signals": filtered, "count": len(filtered)}


@register_tool("query_historical_signals", "Historical Signal Querier", rate_limit_per_minute=20)
async def query_historical_signals(ticker: str, event_type: str = "", limit: int = 50) -> dict[str, Any]:
    """Query past signals for a ticker from database."""
    return {"ticker": ticker, "signals": [], "count": 0}


@register_tool("query_feedback_outcomes", "Feedback Outcome Querier", rate_limit_per_minute=20)
async def query_feedback_outcomes(ticker: str = "", limit: int = 100) -> dict[str, Any]:
    """Query feedback outcomes for accuracy analysis."""
    return {"ticker": ticker, "outcomes": [], "count": 0}


@register_tool("compute_impact_statistics", "Impact Statistics Computer", rate_limit_per_minute=20)
async def compute_impact_statistics(historical_signals: list[dict[str, Any]], feedback_outcomes: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute hit rate, average price move, and conviction multiplier."""
    total = len(feedback_outcomes)
    if total == 0:
        return {"hit_rate": None, "avg_price_change": None, "sample_size": 0, "conviction_boost": 0.0}

    positive = sum(1 for f in feedback_outcomes if f.get("outcome") == "UP")
    hit_rate = positive / total
    boost = 10.0 if hit_rate > 0.65 and total >= 5 else 0.0

    return {
        "hit_rate": round(hit_rate, 2),
        "sample_size": total,
        "conviction_boost": boost,
    }
