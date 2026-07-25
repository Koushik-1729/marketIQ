"""
FastAPI Main Application Factory for marketIQ Engine.
Lifespan manages DB connections, prompt loading, tool bootstrapping, skill loading, and scheduler.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

log = structlog.get_logger(__name__)

BASE_DIR = Path(__file__).parent.parent
SKILLS_DIR = BASE_DIR / "skills"
PROMPTS_DIR = BASE_DIR / "prompts"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    from app.core.logging import setup_logging
    from app.core.config import settings
    from app.db.postgres import connect_postgres
    from app.db.redis import connect_redis
    from app.services.prompt_service import load_prompts
    from app.services.skill_service import load_skills
    from app.services.tool_service import bootstrap_tool_registry, validate_skill_registry, TOOL_REGISTRY
    from app.scheduler import bootstrap_scheduler

    setup_logging(settings.log_level)
    log.info("starting_marketiq_engine")

    await connect_postgres()
    await connect_redis()

    load_prompts(PROMPTS_DIR)
    bootstrap_tool_registry()      # Must come BEFORE load_skills
    load_skills(SKILLS_DIR)
    validate_skill_registry(set(TOOL_REGISTRY.keys()))

    import app.agents.marketiq_agent  # Self-registers in AGENT_GRAPH_MAP

    bootstrap_scheduler()
    log.info("marketiq_engine_ready")

    yield

    # Shutdown Sequence
    from app.db.postgres import disconnect_postgres
    from app.db.redis import disconnect_redis
    from app.scheduler import get_scheduler

    sched = get_scheduler()
    if sched:
        sched.shutdown(wait=False)

    await disconnect_postgres()
    await disconnect_redis()
    log.info("marketiq_engine_shutdown_complete")


def create_app() -> FastAPI:
    application = FastAPI(
        title="MarketIQ Agent Engine",
        version="0.1.0",
        description="Skill-driven LangGraph agent engine for Indian equity market intelligence",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.api.v1.router import api_v1_router
    application.include_router(api_v1_router, prefix="/api/v1")

    return application


app = create_app()
