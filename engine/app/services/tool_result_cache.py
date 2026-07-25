"""
Redis-based tool result cache and rate limiter.
"""
from __future__ import annotations

import json
from typing import Any
import structlog

from app.db.redis import redis_client

log = structlog.get_logger(__name__)

_CACHE_ALLOWLIST: frozenset[str] = frozenset({
    "fetch_nse_filings",
    "fetch_bse_announcements",
    "fetch_price_bars",
    "fetch_earnings_history",
    "fetch_institutional_flows",
    "fetch_deal_events",
    "query_historical_signals",
    "query_feedback_outcomes",
})

_CACHE_TTL: dict[str, int] = {
    "fetch_price_bars": 900,          # 15 min
    "fetch_nse_filings": 3_600,       # 1 h
    "fetch_bse_announcements": 3_600,
    "fetch_earnings_history": 86_400, # 24 h
    "fetch_institutional_flows": 3_600,
    "fetch_deal_events": 1_800,
    "query_historical_signals": 86_400,
    "query_feedback_outcomes": 86_400,
}


def _cache_key(tool_id: str, params: dict) -> str:
    import hashlib
    fingerprint = hashlib.sha256(
        json.dumps({tool_id: params}, sort_keys=True, default=str).encode()
    ).hexdigest()[:16]
    return f"toolcache:{tool_id}:p:{fingerprint}"


async def tool_result_cache_get(tool_id: str, params: dict) -> Any | None:
    if tool_id not in _CACHE_ALLOWLIST:
        return None
    try:
        from app.db.redis import redis_client
        if redis_client is None:
            return None
        raw = await redis_client.get(_cache_key(tool_id, params))
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def tool_result_cache_set(tool_id: str, params: dict, output: Any) -> None:
    if tool_id not in _CACHE_ALLOWLIST:
        return
    ttl = _CACHE_TTL.get(tool_id, 900)
    try:
        from app.db.redis import redis_client
        if redis_client is None:
            return
        await redis_client.set(
            _cache_key(tool_id, params),
            json.dumps(output, default=str),
            ex=ttl,
        )
    except Exception:
        pass


async def check_rate_limit(tool_id: str, rpm: int) -> bool:
    """Returns True if call is allowed under RPM limit. Fail-open on Redis error."""
    try:
        from app.db.redis import redis_client
        if redis_client is None:
            return True
        key = f"toolrl:{tool_id}:rpm"
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, 60)
        return count <= rpm
    except Exception as exc:
        log.warning("rate_limit_check_failed", tool_id=tool_id, error=str(exc))
        return True
