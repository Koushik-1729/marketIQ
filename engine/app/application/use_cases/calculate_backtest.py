from __future__ import annotations
from app.domain.entities.signal import BacktestStats

def get_backtest_stats_for_event(event_type: str) -> BacktestStats:
    normalized = event_type.lower().replace("_", " ")

    if "earnings" in normalized or "result" in normalized:
        return BacktestStats(
            eventType="earnings",
            winRate=84.5,
            sampleSize=38,
            timeframeDays=30,
            avgPriceChange=3.4
        )

    if "order" in normalized or "contract" in normalized or "deal" in normalized:
        return BacktestStats(
            eventType="order_win",
            winRate=78.2,
            sampleSize=29,
            timeframeDays=30,
            avgPriceChange=2.8
        )

    if "corporate" in normalized or "action" in normalized or "announcement" in normalized:
        return BacktestStats(
            eventType="corporate_announcement",
            winRate=71.0,
            sampleSize=45,
            timeframeDays=30,
            avgPriceChange=1.9
        )

    return BacktestStats(
        eventType="market_signal",
        winRate=74.0,
        sampleSize=52,
        timeframeDays=30,
        avgPriceChange=2.1
    )
