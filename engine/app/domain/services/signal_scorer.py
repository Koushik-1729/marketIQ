import math
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
