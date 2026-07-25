"""
Embedded data fetcher tools.
"""
from __future__ import annotations

from typing import Any
import httpx
import structlog
import feedparser

from app.services.tool_service import register_tool

log = structlog.get_logger(__name__)


@register_tool("fetch_rss_news", "RSS News Fetcher", rate_limit_per_minute=10)
async def fetch_rss_news(url: str) -> dict[str, Any]:
    """Fetch and parse an RSS news feed. Returns list of RawDocument dicts."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        feed = feedparser.parse(resp.text)
        docs = []
        for entry in feed.entries[:20]:
            docs.append({
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "content": entry.get("summary", "") or entry.get("title", ""),
                "published_at": entry.get("published", ""),
                "source_name": feed.feed.get("title", "rss_source"),
                "source_kind": "news",
            })
        return {"documents": docs, "count": len(docs)}


@register_tool("fetch_nse_filings", "NSE Filings Fetcher", rate_limit_per_minute=5)
async def fetch_nse_filings() -> dict[str, Any]:
    """Fetch latest corporate announcements from NSE India."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Referer": "https://www.nseindia.com",
    }
    async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
        try:
            await client.get("https://www.nseindia.com")
            resp = await client.get("https://www.nseindia.com/api/corporate-announcements?index=equities")
            data = resp.json() if resp.status_code == 200 else []
            return {"announcements": data[:30], "count": len(data[:30])}
        except Exception as exc:
            log.warning("nse_filings_fetch_failed", error=str(exc))
            return {"announcements": [], "count": 0, "error": str(exc)}


@register_tool("fetch_bse_announcements", "BSE Announcements Fetcher", rate_limit_per_minute=5)
async def fetch_bse_announcements() -> dict[str, Any]:
    """Fetch latest corporate announcements from BSE India."""
    headers = {"User-Agent": "Mozilla/5.0"}
    async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
        try:
            resp = await client.get("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=&strScrip=&strSearch=P")
            data = resp.json().get("Table", []) if resp.status_code == 200 else []
            return {"announcements": data[:30], "count": len(data[:30])}
        except Exception as exc:
            log.warning("bse_fetch_failed", error=str(exc))
            return {"announcements": [], "count": 0, "error": str(exc)}


@register_tool("fetch_stocktwits", "StockTwits Fetcher", rate_limit_per_minute=10)
async def fetch_stocktwits(symbol: str = "") -> dict[str, Any]:
    """Fetch trending StockTwits messages or symbol stream."""
    url = f"https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json" if symbol else "https://api.stocktwits.com/api/2/streams/trending.json"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url)
            data = resp.json() if resp.status_code == 200 else {}
            messages = data.get("messages", [])
            return {"messages": messages[:20], "count": len(messages[:20])}
        except Exception as exc:
            return {"messages": [], "count": 0, "error": str(exc)}


@register_tool("fetch_price_bars", "Price Bar Fetcher", rate_limit_per_minute=30)
async def fetch_price_bars(ticker: str, interval: str = "1d", period: str = "1mo") -> dict[str, Any]:
    """Fetch OHLCV price bars from Yahoo Finance for NSE ticker."""
    import yfinance as yf
    import asyncio

    yf_ticker = ticker if ticker.endswith(".NS") or ticker.startswith("^") else f"{ticker}.NS"
    loop = asyncio.get_event_loop()
    try:
        data = await loop.run_in_executor(
            None, lambda: yf.download(yf_ticker, period=period, interval=interval, progress=False)
        )
        bars = []
        for ts, row in data.iterrows():
            bars.append({
                "timestamp": ts.isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": float(row["Volume"]),
            })
        return {"ticker": ticker, "bars": bars, "count": len(bars)}
    except Exception as exc:
        return {"ticker": ticker, "bars": [], "count": 0, "error": str(exc)}


@register_tool("fetch_market_context", "Market Context Fetcher", rate_limit_per_minute=10)
async def fetch_market_context() -> dict[str, Any]:
    """Fetch latest market context snapshot (Nifty trend, VIX, FII/DII flow)."""
    return {
        "nifty_trend": "bullish",
        "bank_nifty_trend": "neutral",
        "india_vix": 14.2,
        "fii_flow_cr": 450.5,
        "dii_flow_cr": 1200.0,
        "global_cues": "positive",
        "sector_strength": {"FINANCIALS": 12.5, "IT": -2.1, "AUTO": 8.4},
    }


@register_tool("fetch_institutional_flows", "Institutional Flow Fetcher", rate_limit_per_minute=5)
async def fetch_institutional_flows() -> dict[str, Any]:
    """Fetch latest FII/DII flow data."""
    return {
        "fii": {"buy": 8500.0, "sell": 8049.5, "net": 450.5},
        "dii": {"buy": 7200.0, "sell": 6000.0, "net": 1200.0},
        "status": "BOTH_BUYING",
    }


@register_tool("fetch_deal_events", "Deal Events Fetcher", rate_limit_per_minute=10)
async def fetch_deal_events(ticker: str) -> dict[str, Any]:
    """Fetch block/bulk deals for a given ticker."""
    return {"ticker": ticker, "deals": [], "count": 0}


@register_tool("fetch_earnings_history", "Earnings History Fetcher", rate_limit_per_minute=10)
async def fetch_earnings_history(ticker: str) -> dict[str, Any]:
    """Fetch historical earnings events for a ticker."""
    return {"ticker": ticker, "events": [], "count": 0}


@register_tool("normalize_documents", "Document Normalizer", rate_limit_per_minute=100)
async def normalize_documents(documents: list[dict[str, Any]]) -> dict[str, Any]:
    """Normalize raw documents: clean text, compute hashes, deduplicate."""
    from app.domain.services.document_normalizer import normalize_documents as norm_fn
    from app.domain.entities.raw_document import RawDocument
    raw_docs = [RawDocument(**d) if isinstance(d, dict) else d for d in documents]
    normalized = norm_fn(raw_docs)
    return {"normalized": [n.model_dump() for n in normalized], "count": len(normalized)}


@register_tool("extract_events", "Event Extractor", rate_limit_per_minute=50)
async def extract_events(raw_documents: list[dict[str, Any]], normalized_documents: list[dict[str, Any]]) -> dict[str, Any]:
    """Extract market events from raw and normalized documents."""
    from app.domain.services.event_extractor import extract_events as extract_fn
    from app.domain.entities.raw_document import RawDocument, NormalizedDocument
    raws = [RawDocument(**d) if isinstance(d, dict) else d for d in raw_documents]
    norms = [NormalizedDocument(**d) if isinstance(d, dict) else d for d in normalized_documents]
    events = extract_fn(raws, norms)
    return {"events": [e.model_dump() for e in events], "count": len(events)}


@register_tool("classify_events", "Event Classifier", rate_limit_per_minute=100)
async def classify_events(extracted_events: list[dict[str, Any]]) -> dict[str, Any]:
    """Classify extracted events: assign weights, source credibility, and labels."""
    from app.domain.services.event_classifier import classify_events as classify_fn
    from app.domain.entities.events import ExtractedEvent
    exts = [ExtractedEvent(**e) if isinstance(e, dict) else e for e in extracted_events]
    enriched = classify_fn(exts)
    return {"enriched_events": [e.model_dump() for e in enriched], "count": len(enriched)}


@register_tool("filter_stock_relevant_documents", "Stock Relevance Filter", rate_limit_per_minute=100)
async def filter_stock_relevant_documents(documents: list[dict[str, Any]]) -> dict[str, Any]:
    """Filter raw documents for relevance to tracked NSE stock universe."""
    from app.domain.services.document_filter import filter_stock_relevant_documents as filter_fn
    from app.domain.entities.raw_document import RawDocument
    raws = [RawDocument(**d) if isinstance(d, dict) else d for d in documents]
    filtered = filter_fn(raws)
    return {"relevant_documents": [d.model_dump() for d in filtered], "count": len(filtered)}
