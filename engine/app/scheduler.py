"""
APScheduler configuration for marketIQ background jobs.
Configured for Asia/Kolkata timezone (IST).
"""
from __future__ import annotations

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import structlog

log = structlog.get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _trigger_signal_run():
    log.info("scheduler_trigger_signal_run")
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8001/api/v1/signals/run", timeout=5.0)
    except Exception as exc:
        log.error("scheduler_signal_trigger_failed", error=str(exc))


async def _trigger_report():
    log.info("scheduler_trigger_report")
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8001/api/v1/reports/generate", timeout=5.0)
    except Exception as exc:
        log.error("scheduler_report_trigger_failed", error=str(exc))


def bootstrap_scheduler() -> AsyncIOScheduler:
    global _scheduler
    scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    # Pre-market signal run (7:30 AM IST Mon-Fri)
    scheduler.add_job(_trigger_signal_run, CronTrigger(hour=7, minute=30, day_of_week="mon-fri", timezone="Asia/Kolkata"))
    # Post-signal run (8:00 AM IST Mon-Fri)
    scheduler.add_job(_trigger_signal_run, CronTrigger(hour=8, minute=0, day_of_week="mon-fri", timezone="Asia/Kolkata"))
    # Morning report (8:15 AM IST Mon-Fri)
    scheduler.add_job(_trigger_report, CronTrigger(hour=8, minute=15, day_of_week="mon-fri", timezone="Asia/Kolkata"))
    # Intraday (every 15min 9AM-3:30PM IST Mon-Fri)
    scheduler.add_job(_trigger_signal_run, CronTrigger(minute="*/15", hour="9-15", day_of_week="mon-fri", timezone="Asia/Kolkata"))
    # Closing summary (4:00 PM IST Mon-Fri)
    scheduler.add_job(_trigger_report, CronTrigger(hour=16, minute=0, day_of_week="mon-fri", timezone="Asia/Kolkata"))

    scheduler.start()
    _scheduler = scheduler
    log.info("apscheduler_bootstrapped")
    return scheduler


def get_scheduler() -> AsyncIOScheduler | None:
    return _scheduler
