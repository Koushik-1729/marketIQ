"""
Signal generation, listing, hybrid search, and pagination API endpoints.
"""
from __future__ import annotations

import math
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, BackgroundTasks, status, Query, Body

import structlog

from app.application.use_cases.search_signals import execute_hybrid_search
from app.application.use_cases.calculate_backtest import get_backtest_stats_for_event
from app.domain.entities.signal import EngineSignal, SourceCitation

log = structlog.get_logger(__name__)
router = APIRouter()


async def _execute_signal_run(run_id: str):
    """Execute full LangGraph agent signal generation run."""
    log.info("starting_signal_run", run_id=run_id)
    try:
        from app.agents.state import AGENT_GRAPH_MAP

        graph = AGENT_GRAPH_MAP.get("marketiq_agent")
        if not graph:
            log.error("agent_graph_not_found")
            return

        initial_state = {
            "agent_id": "marketiq_agent",
            "session_id": "scheduled_run",
            "run_id": run_id,
            "input_spec": {
                "query": "Run the complete daily market intelligence pipeline: fetch today's NSE/BSE filings and news, extract events, validate with price action, score signals, and generate pre-market report.",
                "active_skills": [],
                "context_date": datetime.now().isoformat(),
            },
            "messages": [],
            "tool_calls": [],
            "intermediate": {},
            "active_skills": [],
            "final_result": None,
            "error": None,
        }

        result = await graph.ainvoke(initial_state, config={"recursion_limit": 50})
        log.info("signal_run_completed", run_id=run_id, result=result.get("final_result"))
    except Exception as exc:
        log.error("signal_run_failed", run_id=run_id, error=str(exc))


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
async def run_signal_engine(background_tasks: BackgroundTasks):
    """Trigger a background signal engine run."""
    run_id = str(uuid4())
    background_tasks.add_task(_execute_signal_run, run_id)
    return {"run_id": run_id, "status": "accepted", "message": "Signal engine run started in background"}


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_signals(
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Offset index"),
    ticker: str = Query("", description="Ticker filter")
):
    """List recent engine signals with offset pagination and backtest stats."""
    try:
        from app.db.postgres import AsyncSessionLocal
        from app.adapters.outbound.repositories.signal_repository import PostgresSignalRepository

        async with AsyncSessionLocal() as session:
            repo = PostgresSignalRepository(session)
            
            # Fetch all matching signals for count & slicing
            if ticker:
                all_signals = await repo.find_by_ticker(ticker, limit=200)
            else:
                all_signals = await repo.find_recent(limit=200)

            total_count = len(all_signals)
            sliced_signals = all_signals[offset : offset + limit]

            enriched = []
            for s in sliced_signals:
                dict_sig = s.model_dump()
                backtest = get_backtest_stats_for_event(dict_sig.get("eventType", "other"))
                citation = SourceCitation(
                    quote=dict_sig.get("eventSummary", "Filing quote extracted"),
                    sourceTitle="NSE Exchange Filing / Corporate Feed",
                    publishedAt=datetime.utcnow().isoformat(),
                    credibilityScore=0.94
                )
                dict_sig["backtestStats"] = backtest.model_dump()
                dict_sig["citation"] = citation.model_dump()
                enriched.append(dict_sig)

            total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
            current_page = (offset // limit) + 1

            return {
                "items": enriched,
                "signals": enriched,
                "count": len(enriched),
                "totalCount": total_count,
                "limit": limit,
                "offset": offset,
                "page": current_page,
                "totalPages": total_pages,
                "hasNextPage": current_page < total_pages,
                "hasPrevPage": current_page > 1
            }
    except Exception as exc:
        log.warning("list_signals_db_error", error=str(exc))
        return {
            "items": [],
            "signals": [],
            "count": 0,
            "totalCount": 0,
            "limit": limit,
            "offset": offset,
            "page": 1,
            "totalPages": 1,
            "hasNextPage": False,
            "hasPrevPage": False,
            "status": "db_offline",
            "error": str(exc)
        }


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_signals(
    q: str = Query("", description="Query string for hybrid search"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Hybrid RRF search endpoint with pagination."""
    signals_resp = await list_signals(limit=200, offset=0)
    raw_items = signals_resp.get("items", [])

    typed_signals = [EngineSignal.model_validate(item) for item in raw_items]
    search_results = execute_hybrid_search(q, typed_signals)

    total_count = len(search_results)
    sliced_results = search_results[offset : offset + limit]
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    current_page = (offset // limit) + 1

    return {
        "query": q,
        "totalCount": total_count,
        "results": [r.model_dump() for r in sliced_results],
        "items": [r.signal.model_dump() for r in sliced_results],
        "limit": limit,
        "offset": offset,
        "page": current_page,
        "totalPages": total_pages
    }


@router.post("/chat", status_code=status.HTTP_200_OK)
async def chat_with_analyst(message: str = Body(..., embed=True)):
    """Ask configured LLM analyst about stock setups, filings, or active signals."""
    try:
        from app.core.llm import get_llm
        llm = get_llm()
        
        # Pull active signals to give context to the LLM
        signals_resp = await list_signals(limit=50, offset=0)
        items = signals_resp.get("items", [])
        
        sig_texts = []
        for i, s in enumerate(items):
            sig_texts.append(
                f"{i+1}. Ticker: {s.get('ticker')}, Company: {s.get('company')}, "
                f"Event: {s.get('eventType')}, Summary: {s.get('eventSummary')}, "
                f"Sentiment: {s.get('sentiment')}, Score: {s.get('impactScore')}"
            )
        
        context_str = "\n".join(sig_texts) if sig_texts else "No active signals found in database."
        
        prompt = (
            "You are MarketIQ AI Analyst, a high-conviction financial advisor specialized in Indian Equities (NSE/BSE).\n"
            "You are given the following list of active signals parsed from NSE/BSE corporate filings:\n"
            f"{context_str}\n\n"
            f"User asks: {message}\n"
            "Answer clearly and concisely based on the signal context above. Keep the response to 1-3 sentences maximum."
        )
        
        response = await llm.ainvoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        return {"response": text}
    except Exception as exc:
        log.error("analyst_chat_error", error=str(exc))
        return {
            "response": f"I detected a database/LLM connection issue: {str(exc)}. "
                        f"Please check your engine configuration or verify settings in your .env configuration."
        }

