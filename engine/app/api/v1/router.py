"""
API v1 Router.
"""
from fastapi import APIRouter
from app.api.v1 import health, signals, reports

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, tags=["health"])
api_v1_router.include_router(signals.router, prefix="/signals", tags=["signals"])
api_v1_router.include_router(reports.router, prefix="/reports", tags=["reports"])
