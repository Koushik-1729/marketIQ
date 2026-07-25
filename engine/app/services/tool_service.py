"""
Tool service — central tool registry and execution engine.

Every tool call in the agent MUST go through execute_tool().
This enforces: skill-based auth, rate-limiting, Redis cache, and dispatch.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any, Callable

import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Registry types
# ---------------------------------------------------------------------------

@dataclass
class ToolRegistration:
    tool_id: str
    display_name: str
    description: str
    fn: Callable
    rate_limit_per_minute: int = 60
    is_async: bool = False
    cache_ttl: int = 0  # 0 = not cached


@dataclass
class ToolCallResult:
    success: bool
    output: Any = None
    error: str | None = None
    cached: bool = False


TOOL_REGISTRY: dict[str, ToolRegistration] = {}

# Tools always available regardless of active skill
UNIVERSAL_TOOLS: frozenset[str] = frozenset({"load_skill", "final_answer"})


# ---------------------------------------------------------------------------
# Registration decorator
# ---------------------------------------------------------------------------

def register_tool(
    tool_id: str,
    display_name: str,
    rate_limit_per_minute: int = 60,
    cache_ttl: int = 0,
):
    """Decorator to register a function as a tool in the global TOOL_REGISTRY."""

    def decorator(fn: Callable) -> Callable:
        TOOL_REGISTRY[tool_id] = ToolRegistration(
            tool_id=tool_id,
            display_name=display_name,
            description=(fn.__doc__ or "").strip(),
            fn=fn,
            rate_limit_per_minute=rate_limit_per_minute,
            is_async=asyncio.iscoroutinefunction(fn),
            cache_ttl=cache_ttl,
        )
        return fn

    return decorator


# ---------------------------------------------------------------------------
# Rate limiting (Redis fixed-window)
# ---------------------------------------------------------------------------

async def _check_rate_limit(tool_id: str, rpm: int) -> bool:
    """Returns True if call is allowed, False if rate-limited. Fail-open on Redis error."""
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
        return True  # fail-open


# ---------------------------------------------------------------------------
# Tool result cache (Redis)
# ---------------------------------------------------------------------------

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
    fingerprint = hashlib.sha256(
        json.dumps({tool_id: params}, sort_keys=True, default=str).encode()
    ).hexdigest()[:16]
    return f"toolcache:{tool_id}:p:{fingerprint}"


async def _cache_get(tool_id: str, params: dict) -> Any | None:
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


async def _cache_set(tool_id: str, params: dict, output: Any) -> None:
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


# ---------------------------------------------------------------------------
# Central execute_tool
# ---------------------------------------------------------------------------

async def execute_tool(
    tool_id: str,
    params: dict,
    active_skills: list[str] | None = None,
) -> ToolCallResult:
    """
    Single entry point for all tool execution.
    Pipeline: auth → rate-limit → cache-get → dispatch → cache-set → return.
    """
    # 1. Auth
    if active_skills is not None:
        from app.services.skill_service import active_skill_tool_ids
        allowed = active_skill_tool_ids(active_skills) | UNIVERSAL_TOOLS
        if tool_id not in allowed:
            return ToolCallResult(
                success=False,
                error=f"Tool '{tool_id}' not authorized for active skills: {active_skills}",
            )

    reg = TOOL_REGISTRY.get(tool_id)
    if not reg:
        return ToolCallResult(success=False, error=f"Unknown tool: '{tool_id}'")

    # 2. Rate limit
    if not await _check_rate_limit(tool_id, reg.rate_limit_per_minute):
        return ToolCallResult(success=False, error=f"Rate limit exceeded for tool: {tool_id}")

    # 3. Cache get
    cached = await _cache_get(tool_id, params)
    if cached is not None:
        log.debug("tool_cache_hit", tool_id=tool_id)
        return ToolCallResult(success=True, output=cached, cached=True)

    # 4. Dispatch
    try:
        if reg.is_async:
            output = await reg.fn(**params)
        else:
            loop = asyncio.get_event_loop()
            output = await loop.run_in_executor(None, lambda: reg.fn(**params))

        log.info("tool_executed", tool_id=tool_id, cached=False)

        # 5. Cache set
        await _cache_set(tool_id, params, output)

        return ToolCallResult(success=True, output=output)

    except Exception as exc:
        log.error("tool_execution_failed", tool_id=tool_id, error=str(exc))
        return ToolCallResult(success=False, error=str(exc))


# ---------------------------------------------------------------------------
# Bootstrap — import all embedded tool modules to trigger @register_tool
# ---------------------------------------------------------------------------

def bootstrap_tool_registry() -> None:
    """Import embedded tool modules so @register_tool decorators fire."""
    import importlib

    modules = [
        "app.tools.embedded.data_fetchers",
        "app.tools.embedded.validators",
        "app.tools.embedded.earnings_tools",
        "app.tools.embedded.insight_tools",
        "app.tools.embedded.db_tools",
    ]
    for mod in modules:
        try:
            importlib.import_module(mod)
            log.debug("tool_module_loaded", module=mod)
        except Exception as exc:
            log.error("tool_module_load_failed", module=mod, error=str(exc))
            raise

    log.info("tool_registry_bootstrapped", tool_count=len(TOOL_REGISTRY))


def validate_skill_registry(tool_ids: set[str]) -> None:
    """Fail-hard if any skill references a tool_id not in TOOL_REGISTRY."""
    from app.services.skill_service import SKILL_REGISTRY
    errors = []
    for skill_id, skill in SKILL_REGISTRY.items():
        for tool_id in skill.tools:
            if tool_id not in tool_ids and tool_id not in UNIVERSAL_TOOLS:
                errors.append(f"Skill '{skill_id}' references unknown tool '{tool_id}'")
    if errors:
        raise ValueError("Skill validation failed:\n" + "\n".join(errors))
    log.info("skill_registry_validated", skill_count=len(SKILL_REGISTRY))
