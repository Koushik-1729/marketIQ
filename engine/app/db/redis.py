"""
Redis client module with automatic In-Memory Fallback.
If a Redis server is not running locally or fails to connect,
it gracefully falls back to a 100% free built-in Python in-memory store.
"""
from __future__ import annotations

import time
from typing import Any, Optional
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Global client reference (either real redis.Redis or InMemoryRedis)
redis_client: Any = None


class InMemoryRedis:
    """
    100% Free, built-in Python in-memory fallback store.
    Provides identical interface to redis.asyncio.Redis without needing an external Redis server.
    """
    def __init__(self):
        self._store: dict[str, Any] = {}
        self._expires: dict[str, float] = {}

    def _clean_expired(self, key: str):
        if key in self._expires and time.time() > self._expires[key]:
            self._store.pop(key, None)
            self._expires.pop(key, None)

    async def ping(self) -> bool:
        return True

    async def get(self, key: str) -> Optional[str]:
        self._clean_expired(key)
        return self._store.get(key)

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        self._store[key] = str(value)
        if ex:
            self._expires[key] = time.time() + ex
        return True

    async def incr(self, key: str) -> int:
        self._clean_expired(key)
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key: str, seconds: int) -> bool:
        if key in self._store:
            self._expires[key] = time.time() + seconds
            return True
        return False

    async def aclose(self):
        self._store.clear()
        self._expires.clear()


async def connect_redis():
    """Initialize Redis client with automatic free in-memory fallback."""
    global redis_client
    import redis.asyncio as redis

    try:
        real_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        await real_client.ping()
        redis_client = real_client
        logger.info("Successfully connected to Redis server", url=settings.REDIS_URL)
    except Exception as e:
        logger.warning(
            "Redis server unavailable, using built-in free In-Memory store",
            error=str(e),
        )
        redis_client = InMemoryRedis()


async def get_redis() -> Any:
    """FastAPI dependency to get the Redis client."""
    global redis_client
    if redis_client is None:
        redis_client = InMemoryRedis()
    return redis_client


async def disconnect_redis():
    """Close Redis client connection."""
    global redis_client
    if redis_client:
        logger.info("Disconnecting Redis client")
        await redis_client.aclose()
        redis_client = None


# Convenience wrappers
async def redis_get(key: str) -> Optional[str]:
    client = await get_redis()
    return await client.get(key)


async def redis_set(key: str, value: Any, ex: Optional[int] = None) -> None:
    client = await get_redis()
    await client.set(key, value, ex=ex)


async def redis_incr(key: str) -> int:
    client = await get_redis()
    return await client.incr(key)


async def redis_expire(key: str, seconds: int) -> bool:
    client = await get_redis()
    return await client.expire(key, seconds)
