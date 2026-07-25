"""
Report generation API endpoints.
"""
from __future__ import annotations

from uuid import uuid4
from fastapi import APIRouter, BackgroundTasks, status
import structlog

log = structlog.get_logger(__name__)
router = APIRouter()


async def _execute_report_generation(run_id: str):
    """Execute report generation workflow."""
    log.info("starting_report_generation", run_id=run_id)
    try:
        from app.tools.embedded.insight_tools import read_top_signals, format_report, send_telegram_report
        from app.tools.embedded.data_fetchers import fetch_market_context

        signals_res = await read_top_signals(limit=10)
        context_res = await fetch_market_context()

        report_res = await format_report(signals_res.get("signals", []), context_res)
        formatted_text = report_res.get("formatted_report", "")

        if formatted_text:
            await send_telegram_report(formatted_text)
            log.info("report_generation_completed", run_id=run_id)
    except Exception as exc:
        log.error("report_generation_failed", run_id=run_id, error=str(exc))


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(background_tasks: BackgroundTasks):
    """Trigger morning report generation in background."""
    run_id = str(uuid4())
    background_tasks.add_task(_execute_report_generation, run_id)
    return {"run_id": run_id, "status": "accepted", "message": "Report generation started in background"}


@router.get("/latest")
async def get_latest_report():
    """Get the latest generated pre-market report."""
    from app.tools.embedded.data_fetchers import fetch_market_context
    from app.tools.embedded.insight_tools import format_report

    context = await fetch_market_context()
    res = await format_report([], context)

    return {"report": res.get("formatted_report", ""), "generated_at": "2026-07-20T08:15:00Z"}
