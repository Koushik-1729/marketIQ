"""
PostgreSQL SQLAlchemy Async database client module.
Communicates with Supabase / PostgreSQL.
"""
from __future__ import annotations

from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Normalize DATABASE_URL to use asyncpg driver if needed
raw_url = settings.DATABASE_URL
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgres+asyncpg://", 1)

# Remove query params like ?pgbouncer=true that asyncpg doesn't take directly
if "?" in raw_url:
    raw_url = raw_url.split("?")[0]

# statement_cache_size=0 is required for PgBouncer pooler (port 6543)
async_engine = create_async_engine(
    raw_url,
    pool_size=10,
    max_overflow=5,
    echo=False,
    connect_args={
        "statement_cache_size": 0,
        "command_timeout": 15,
    },
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency to yield a database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def connect_postgres():
    """Test the PostgreSQL connection on startup."""
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1;"))
            logger.info("Successfully connected to Supabase PostgreSQL database")
    except Exception as e:
        logger.warning(
            "PostgreSQL database connection failed (check DATABASE_URL or network connection)",
            error=str(e),
        )


async def disconnect_postgres():
    """Close the PostgreSQL connection pool."""
    logger.info("Disconnecting from PostgreSQL")
    await async_engine.dispose()
