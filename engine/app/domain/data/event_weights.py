from typing import Dict

EVENT_WEIGHTS: Dict[str, float] = {
    "earnings": 30,
    "insider_activity": 40,
    "macro_policy": 50,
    "sector_news": 20,
    "regulation": 28,
    "unusual_volume": 22,
    "sentiment_spike": 10,
    "ipo": 16,
    "management_change": 18,
    "order_win": 26,
    "merger_acquisition": 34,
    "litigation": 32,
    "rating_change": 12,
    "other": 5
}

SOURCE_CREDIBILITY: Dict[str, float] = {
    "NSE Filing": 10,
    "BSE Announcement": 10,
    "Reuters Markets": 10,
    "Economic Times": 8,
    "Moneycontrol": 7,
    "Business Standard": 8,
    "CNBC TV18": 8,
    "Stocktwits": 3,
    "X/Twitter": 3
}
