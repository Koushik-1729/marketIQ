"""
Embedded insight and report tools.
"""
from __future__ import annotations

from typing import Any
import structlog

from app.services.tool_service import register_tool
from app.adapters.outbound.telegram import TelegramAdapter

log = structlog.get_logger(__name__)


@register_tool("build_insight_card", "Insight Card Builder", rate_limit_per_minute=100)
async def build_insight_card_tool(signal: dict[str, Any]) -> dict[str, Any]:
    """Build an InsightCard dict from an EngineSignal dict."""
    score = signal.get("final_score", 50.0)
    rating = 5 if score >= 80 else (4 if score >= 65 else (3 if score >= 50 else 2))

    return {
        "id": f"card_{signal.get('id', '1')}",
        "signal_id": signal.get("id"),
        "ticker": signal.get("ticker", "NSE"),
        "company_name": signal.get("company", "Company"),
        "card_type": "ANNOUNCEMENT",
        "headline": f"{signal.get('ticker')} signals strong momentum following corporate announcement",
        "summary": signal.get("event_summary", "High conviction market signal detected."),
        "sentiment": signal.get("sentiment", "positive"),
        "confidence": signal.get("confidence", 0.8),
        "rating": rating,
        "impact_score": score,
        "source": "marketIQ Engine",
        "published_at": signal.get("created_at", "2026-07-20T12:00:00Z"),
    }


@register_tool("format_report", "Report Formatter", rate_limit_per_minute=10)
async def format_report(signals: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any]:
    """Format top signals into pre-market morning report markdown and text."""
    report = "🌅 **MARKET IQ PRE-MARKET REPORT**\n\n"
    report += f"📊 Nifty Trend: {context.get('nifty_trend', 'Bullish')}\n"
    report += f"⚡ India VIX: {context.get('india_vix', 14.2)}\n"
    report += f"💼 FII Net: +₹{context.get('fii_flow_cr', 450)} Cr | DII Net: +₹{context.get('dii_flow_cr', 1200)} Cr\n\n"
    report += "🔥 **TOP SIGNAL OPPORTUNITIES**\n"

    for i, sig in enumerate(signals[:5], 1):
        report += f"\n{i}. **{sig.get('ticker')}** ({sig.get('sentiment', '').upper()}) — Score: {sig.get('final_score', 0):.1f}\n"
        report += f"   • {sig.get('event_summary', '')}\n"

    return {"formatted_report": report, "signal_count": len(signals)}


@register_tool("send_telegram_report", "Telegram Report Sender", rate_limit_per_minute=5)
async def send_telegram_report(text: str, chat_id: str = "") -> dict[str, Any]:
    """Send formatted report text to Telegram."""
    from app.core.config import settings

    token = settings.telegram_bot_token
    target_chat = chat_id or settings.telegram_chat_id

    if not token or not target_chat:
        log.warning("telegram_not_configured")
        return {"sent": False, "reason": "Telegram credentials not configured"}

    adapter = TelegramAdapter(bot_token=token, chat_id=target_chat)
    success = await adapter.send_report(text)

    return {"sent": success}


@register_tool("read_top_signals", "Top Signals Reader", rate_limit_per_minute=20)
async def read_top_signals(limit: int = 20, min_score: float = 40.0) -> dict[str, Any]:
    """Read top signals from repository."""
    return {"signals": [], "count": 0}


@register_tool("read_insight_cards", "Insight Cards Reader", rate_limit_per_minute=20)
async def read_insight_cards(limit: int = 30) -> dict[str, Any]:
    """Read latest insight cards from repository."""
    return {"cards": [], "count": 0}
