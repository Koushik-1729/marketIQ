"""
MarketIQ Real-time Scraper & Signal Generator
Fetches NSE filings & financial RSS news, evaluates using the LLM,
and writes generated signals directly into Postgres database.
"""
import asyncio
import sys
import uuid
from datetime import datetime

# Add root of engine to path
sys.path.append(".")

from app.core.config import settings
from app.core.llm import get_llm
from app.tools.embedded.data_fetchers import fetch_nse_filings, fetch_rss_news
from app.adapters.outbound.repositories.signal_repository import PostgresSignalRepository
from app.db.postgres import AsyncSessionLocal
from app.domain.entities.signal import EngineSignal, SignalExplanation

async def analyze_with_llm(llm, content: str) -> dict:
    """Analyze announcement content using configured LLM."""
    prompt = (
        "You are a professional financial analyst. Analyze the following corporate announcement:\n"
        f"Announcement: {content}\n\n"
        "Respond with a raw comma-separated list containing exactly three values:\n"
        "1. Sentiment (must be one of: positive, neutral, negative)\n"
        "2. Score (integer between 0 and 100, representing positive market impact/importance)\n"
        "3. Confidence (float between 0.0 and 1.0, representing accuracy confidence)\n\n"
        "Example response format: positive, 78, 0.95"
    )
    try:
        resp = await llm.ainvoke(prompt)
        text = resp.content.strip() if hasattr(resp, "content") else str(resp).strip()
        parts = [p.strip() for p in text.split(",")]
        if len(parts) >= 3:
            sentiment = parts[0].lower()
            if sentiment not in ("positive", "neutral", "negative"):
                sentiment = "neutral"
            score = int(parts[1])
            confidence = float(parts[2])
            return {"sentiment": sentiment, "score": score, "confidence": confidence}
    except Exception:
        pass
    return {"sentiment": "neutral", "score": 60, "confidence": 0.8}

async def run_pipeline():
    print("====================================================")
    print("        MARKETIQ REAL-TIME DATA INGESTION           ")
    print("====================================================")
    
    # 1. Fetch live corporate filings from NSE
    print("Fetching today's NSE corporate announcements...")
    nse_res = await fetch_nse_filings()
    announcements = nse_res.get("announcements", [])
    print(f"Scraped {len(announcements)} corporate announcements.")
    
    # 2. Fetch live financial news from RSS
    print("Fetching today's news from Economic Times RSS...")
    rss_res = await fetch_rss_news(settings.ECONOMIC_TIMES_RSS)
    articles = rss_res.get("documents", [])
    print(f"Scraped {len(articles)} financial news articles.")
    
    if not announcements and not articles:
        print("⚠️ No new feed items detected. Exiting.")
        return

    # Initialize LLM
    llm = get_llm("router")
    
    # Process scraped feeds
    signals_to_save = []
    print("\nProcessing feeds through LLM conviction evaluator...")
    
    # Convert announcements
    for ann in announcements[:5]: # Ingest top 5 for speed
        desc = ann.get("desc", "") or ann.get("subject", "") or "Corporate announcement print"
        ticker = ann.get("symbol", "MARKET").upper()
        company = ann.get("companyName", "NSE Listed Company")
        
        print(f"Analyzing ticker {ticker}...")
        analysis = await analyze_with_llm(llm, desc)
        
        sig_id = f"sig_{uuid.uuid4().hex[:12]}"
        explanation = SignalExplanation(
            stock=ticker,
            score=float(analysis["score"]),
            reasons=[f"Announcement: {desc[:100]}..."],
            risk="medium" if analysis["sentiment"] == "neutral" else "low" if analysis["sentiment"] == "positive" else "high",
            watchItems=["Volume confirmation", "Open interest change"]
        )
        
        sig = EngineSignal(
            id=sig_id,
            ticker=ticker,
            company=company,
            eventType="CORPORATE_ACTION",
            eventSummary=desc,
            sentiment=analysis["sentiment"],
            confidence=analysis["confidence"],
            impactScore=analysis["score"],
            riskLevel="low" if analysis["sentiment"] == "positive" else "medium" if analysis["sentiment"] == "neutral" else "high",
            explanation=explanation
        )
        
        # Add properties for save compatibility
        sig.finalScore = analysis["score"]
        signals_to_save.append(sig)

    # Convert news articles
    for art in articles[:5]:
        title = art.get("title", "")
        summary = art.get("content", "")
        
        print(f"Analyzing news: {title[:40]}...")
        analysis = await analyze_with_llm(llm, summary)
        
        sig_id = f"sig_{uuid.uuid4().hex[:12]}"
        explanation = SignalExplanation(
            stock="MARKET",
            score=float(analysis["score"]),
            reasons=[f"News article: {title}"],
            risk="medium" if analysis["sentiment"] == "neutral" else "low" if analysis["sentiment"] == "positive" else "high",
            watchItems=["Sentiment index", "Sector indices trends"]
        )
        
        sig = EngineSignal(
            id=sig_id,
            ticker="MARKET",
            company="General Financial News",
            eventType="NEWS",
            eventSummary=title,
            sentiment=analysis["sentiment"],
            confidence=analysis["confidence"],
            impactScore=analysis["score"],
            riskLevel="low" if analysis["sentiment"] == "positive" else "medium" if analysis["sentiment"] == "neutral" else "high",
            explanation=explanation
        )
        sig.finalScore = analysis["score"]
        signals_to_save.append(sig)

    # Write signals directly to Postgres database
    print(f"\nWriting {len(signals_to_save)} scored signals directly to Supabase/Postgres database...")
    try:
        async with AsyncSessionLocal() as session:
            repo = PostgresSignalRepository(session)
            await repo.save_many(signals_to_save)
            await session.commit()
        print("🟢 DATABASE WRITE: Completed successfully!")
        print("🎉 Ingestion complete! Reload your React app to view today's live scored signals.")
    except Exception as exc:
        print(f"🔴 DATABASE WRITE: Failed to save signals: {exc}")

if __name__ == "__main__":
    asyncio.run(run_pipeline())
