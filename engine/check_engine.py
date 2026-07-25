"""
MarketIQ Core Backend Ingestion and LLM Diagnostic Checker.
Run this script to verify DB, external scrapers, and LLM endpoints.
"""
import asyncio
import sys
from datetime import datetime

# Add root of engine to path
sys.path.append(".")

from app.core.config import settings
from app.core.llm import get_llm
from app.tools.embedded.data_fetchers import fetch_nse_filings, fetch_bse_announcements, fetch_rss_news
from app.db.postgres import AsyncSessionLocal

async def check_database():
    print("Checking Database Connection...")
    try:
        async with AsyncSessionLocal() as session:
            # Simple select to verify Postgres connection
            from sqlalchemy import text
            res = await session.execute(text("SELECT 1;"))
            row = res.fetchone()
            if row and row[0] == 1:
                print("DATABASE: Connected successfully!")
                return True
    except Exception as exc:
        print(f"DATABASE: Connection failed: {exc}")
    return False

async def check_scraping():
    print("\nChecking NSE/BSE & RSS Scraping feeds...")
    
    # 1. NSE Filings
    print("Fetching NSE Announcements...")
    nse_res = await fetch_nse_filings()
    if nse_res.get("error"):
        print(f" NSE Filings: Fetch failed/blocked (NSE has strict browser guards): {nse_res.get('error')}")
    else:
        print(f"NSE Filings: Fetched {nse_res.get('count')} recent corporate filings.")

    # 2. BSE Announcements
    print("Fetching BSE Announcements...")
    bse_res = await fetch_bse_announcements()
    if bse_res.get("error"):
        print(f"BSE: Fetch failed: {bse_res.get('error')}")
    else:
        print(f"BSE: Fetched {bse_res.get('count')} announcements.")

    # 3. RSS News Feeds
    print("Fetching Economic Times RSS Feed...")
    rss_res = await fetch_rss_news(settings.ECONOMIC_TIMES_RSS)
    docs = rss_res.get("documents", [])
    if len(docs) > 0:
        print(f"RSS Feed: Successfully parsed {len(docs)} news articles from Economic Times.")
    else:
        print("RSS Feed: Failed to fetch/parse articles.")

async def check_llm():
    print("\nChecking LLM Router integration...")
    try:
        llm = get_llm("router")
        print(f"Model selected: {settings.litellm_model_for('router')} (Provider: {settings.LLM_PROVIDER})")
        print("Sending test greeting prompt to LLM...")
        
        # Test basic invocation
        resp = await llm.ainvoke("Respond with the single word 'READY'.")
        content = resp.content.strip() if hasattr(resp, "content") else str(resp).strip()
        print(f" LLM Router: Response received: '{content}'")
        return True
    except Exception as exc:
        print(f"LLM Router: Invocation failed: {exc}")
    return False

async def main():
    print("====================================================")
    print("          MARKETIQ ENGINE SYSTEM DIAGNOSTIC         ")
    print(f"Time: {datetime.now().isoformat()}")
    print("====================================================")
    
    db_ok = await check_database()
    await check_scraping()
    llm_ok = await check_llm()
    
    print("\n====================================================")
    if db_ok and llm_ok:
        print(" DIAGNOSTIC PASSED: Core services are operational!")
    else:
        print("⚠️  DIAGNOSTIC WARNING: Some components require check/setup.")
    print("====================================================")

if __name__ == "__main__":
    asyncio.run(main())
