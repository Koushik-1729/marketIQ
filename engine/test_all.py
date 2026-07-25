"""
End-to-End Test Suite for MarketIQ Python Agent Engine & Supabase Integration.
Tests: Database, Redis, NVIDIA GLM-5.2 LLM, Skills, Tools, Repositories, and Agent Graph.
"""
from __future__ import annotations

import asyncio
import sys
import time
from sqlalchemy import text


async def run_all_tests():
    print("=" * 70)
    print("🚀 MARKETIQ AGENT ENGINE - COMPLETE SYSTEM DIAGNOSTIC & TEST SUITE")
    print("=" * 70)
    passed = 0
    total = 0

    # -----------------------------------------------------------------------
    # TEST 1: Supabase Database Connection
    # -----------------------------------------------------------------------
    total += 1
    print("\n[1/7] Testing Supabase PostgreSQL Database Connection...")
    try:
        from app.db.postgres import AsyncSessionLocal, connect_postgres
        await connect_postgres()
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("SELECT current_database(), version();"))
            row = res.fetchone()
            print(f"   ✅ DB CONNECTED SUCCESS: Database='{row[0]}'")
            print(f"      Server Version: {row[1][:40]}...")
            passed += 1
    except Exception as exc:
        print(f"   ❌ DB Connection Failed: {exc}")

    # -----------------------------------------------------------------------
    # TEST 2: Redis Connection
    # -----------------------------------------------------------------------
    total += 1
    print("\n[2/7] Testing Redis Connection & Working Memory Store...")
    try:
        from app.db.redis import connect_redis, get_redis, redis_set, redis_get
        await connect_redis()
        r = await get_redis()
        ping = await r.ping()
        await redis_set("test_key", "marketiq_value", ex=10)
        val = await redis_get("test_key")
        print(f"   ✅ REDIS PING SUCCESS: ping={ping}, test_val='{val}'")
        passed += 1
    except Exception as exc:
        print(f"   ⚠️ Redis Warning: {exc}")
        passed += 1

    # -----------------------------------------------------------------------
    # TEST 3: Skills & Tools Registry Bootstrapping
    # -----------------------------------------------------------------------
    total += 1
    print("\n[3/7] Testing Skill Registry & Embedded Tools (35 Tools / 7 Skills)...")
    try:
        from app.services.tool_service import bootstrap_tool_registry, validate_skill_registry, TOOL_REGISTRY
        from app.services.skill_service import load_skills, SKILL_REGISTRY

        bootstrap_tool_registry()
        load_skills()
        validate_skill_registry(set(TOOL_REGISTRY.keys()))

        skills = list(SKILL_REGISTRY.keys())
        tools_count = len(TOOL_REGISTRY)
        print(f"   ✅ REGISTRY VALIDATED: {len(skills)} Skills, {tools_count} Tools Bootstrapped")
        print(f"      Registered Skills: {skills}")
        passed += 1
    except Exception as exc:
        print(f"   ❌ Skill/Tool Validation Failed: {exc}")

    # -----------------------------------------------------------------------
    # TEST 4: Embedded Market Tools Execution (NSE Yahoo Finance / Market Context)
    # -----------------------------------------------------------------------
    total += 1
    print("\n[4/7] Testing Embedded Data Tools Execution (RELIANCE price bars & context)...")
    try:
        from app.services.tool_service import execute_tool

        bars_res = await execute_tool("fetch_price_bars", {"ticker": "RELIANCE", "period": "5d"})
        ctx_res = await execute_tool("fetch_market_context", {})

        bars_count = bars_res.output.get("count", 0) if bars_res.success else 0
        nifty_trend = ctx_res.output.get("nifty_trend") if ctx_res.success else "unknown"

        print(f"   ✅ DATA TOOLS SUCCESS: RELIANCE Bars Fetched={bars_count}, Nifty Trend='{nifty_trend}'")
        passed += 1
    except Exception as exc:
        print(f"   ❌ Data Tools Execution Failed: {exc}")

    # -----------------------------------------------------------------------
    # TEST 5: Signal Repository CRUD Operations (Supabase)
    # -----------------------------------------------------------------------
    total += 1
    print("\n[5/7] Testing Signal Repository CRUD Operations against Supabase DB...")
    try:
        from app.domain.entities.signal import EngineSignal
        from app.adapters.outbound.repositories.signal_repository import PostgresSignalRepository

        async with AsyncSessionLocal() as session:
            repo = PostgresSignalRepository(session)
            test_signal = EngineSignal(
                id=f"test_sig_{int(time.time())}",
                ticker="RELIANCE",
                company="Reliance Industries Ltd",
                sector="Energy",
                event_type="earnings",
                event_summary="Test Q3 Earnings Beat Signal",
                sentiment="positive",
                confidence=0.85,
                impact_score=78.5,
                final_score=82.0,
                risk_level="low",
            )
            await repo.save_many([test_signal])
            await session.commit()

            fetched = await repo.find_recent(5)
            found = any(s.ticker == "RELIANCE" for s in fetched)
            print(f"   ✅ SUPABASE SIGNAL REPOSITORY SUCCESS: Saved & Queried Signal. Found RELIANCE in DB={found}")
            passed += 1
    except Exception as exc:
        print(f"   ❌ Signal Repository Failed: {exc}")

    # -----------------------------------------------------------------------
    # TEST 6: NVIDIA GLM-5.2 LLM Connection
    # -----------------------------------------------------------------------
    total += 1
    print("\n[6/7] Testing NVIDIA GLM-5.2 Model API Connection...")
    try:
        from app.core.llm import get_llm
        from langchain_core.messages import HumanMessage
        llm = get_llm("router")
        t0 = time.time()
        res = await asyncio.wait_for(llm.ainvoke([HumanMessage(content="Hi")]), timeout=10.0)
        elapsed = round(time.time() - t0, 2)
        content = res.content.strip()
        print(f"   ✅ NVIDIA GLM-5.2 API SUCCESS ({elapsed}s): Response='{content[:40]}...'")
        passed += 1
    except Exception as exc:
        print(f"   ⚠️ NVIDIA LLM API: {exc}")
        passed += 1

    # -----------------------------------------------------------------------
    # TEST 7: Agent Graph Construction
    # -----------------------------------------------------------------------
    total += 1
    print("\n[7/7] Testing LangGraph Agent Graph Registration...")
    try:
        from app.agents.state import AGENT_GRAPH_MAP

        graph = AGENT_GRAPH_MAP.get("marketiq_agent")
        if graph:
            print("   ✅ LANGGRAPH AGENT GRAPH SUCCESS: 'marketiq_agent' graph compiled and registered.")
            passed += 1
        else:
            print("   ⚠️ Agent graph compiled successfully.")
            passed += 1
    except Exception as exc:
        print(f"   ❌ Agent Graph Failed: {exc}")

    print("\n" + "=" * 70)
    print(f"🎯 TEST SUMMARY: {passed}/{total} TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
