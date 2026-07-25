"""
Health and readiness API endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health():
    return {"status": "ok", "service": "marketIQ-engine"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def ready():
    from app.db.postgres import connect_postgres
    from app.db.redis import connect_redis

    pg_ok = True
    redis_ok = True

    try:
        await connect_postgres()
    except Exception:
        pg_ok = False

    try:
        await connect_redis()
    except Exception:
        redis_ok = False

    if pg_ok and redis_ok:
        return {"status": "ready", "postgres": "connected", "redis": "connected"}

    return JSONResponse(
        status_code=status.HTTP_530_SERVICE_UNAVAILABLE,
        content={"status": "degraded", "postgres": "ok" if pg_ok else "failed", "redis": "ok" if redis_ok else "failed"},
    )
