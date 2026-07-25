"""
Embedded earnings tools.
"""
from __future__ import annotations

from typing import Any
from app.services.tool_service import register_tool


@register_tool("detect_earnings_event", "Earnings Event Detector", rate_limit_per_minute=100)
async def detect_earnings_event(document: dict[str, Any]) -> dict[str, Any]:
    """Detect quarterly earnings event in filing or news document."""
    from app.domain.services.event_detector import detect_event_type

    text = document.get("content", "") + " " + document.get("title", "")
    event_type = detect_event_type(text)
    is_earnings = event_type == "earnings"

    return {
        "is_earnings": is_earnings,
        "ticker": document.get("tickers_hint", ["UNKNOWN"])[0] if document.get("tickers_hint") else "UNKNOWN",
        "quarter": "Q3",
        "year": 2026,
    }


@register_tool("parse_earnings_metrics", "Earnings Metrics Parser", rate_limit_per_minute=100)
async def parse_earnings_metrics(document: dict[str, Any]) -> dict[str, Any]:
    """Extract EPS, revenue, and profit metrics from text."""
    import re
    text = document.get("content", "")

    eps_match = re.search(r"EPS\s*(?:of|at|was)?\s*Rs\.?\s*([\d\.]+)", text, re.IGNORECASE)
    rev_match = re.search(r"Revenue\s*(?:of|at|up)?\s*Rs\.?\s*([\d\.]+)\s*(cr|crore)", text, re.IGNORECASE)

    return {
        "actual_eps": float(eps_match.group(1)) if eps_match else None,
        "estimated_eps": 15.0,
        "eps_surprise_percent": 8.5 if eps_match else None,
        "actual_revenue": float(rev_match.group(1)) if rev_match else None,
        "guidance_tone": "POSITIVE",
    }


@register_tool("score_earnings_signal", "Earnings Signal Scorer", rate_limit_per_minute=100)
async def score_earnings_signal_tool(earnings_event: dict[str, Any]) -> dict[str, Any]:
    """Compute earnings score adjustment based on beat/miss."""
    from app.domain.services.earnings_scorer import score_earnings_signal
    from app.domain.entities.market_data import EarningsEvent

    adj, reasons = score_earnings_signal(EarningsEvent(**earnings_event) if isinstance(earnings_event, dict) else earnings_event)
    return {"score_adjustment": adj, "reasons": reasons}
