import asyncio
from datetime import datetime
from uuid import uuid4
import sys
import os

# Add engine directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

async def main():
    print("⚡ [MarketIQ Engine] Initializing fresh live signal scan...")
    # Import marketiq_agent to trigger graph registration
    import app.agents.marketiq_agent
    from app.agents.state import AGENT_GRAPH_MAP

    graph = AGENT_GRAPH_MAP.get("marketiq_agent")
    if not graph:
        print("❌ Error: marketiq_agent graph not found in registry")
        return

    run_id = str(uuid4())

    initial_state = {
        "agent_id": "marketiq_agent",
        "session_id": "manual_trigger",
        "run_id": run_id,
        "input_spec": {
            "query": "Run fresh intelligence pipeline for RELIANCE, HDFCBANK, TCS, ICICIBANK, INFY, TATAMOTORS today",
            "active_skills": ["quantitative", "sentiment", "earnings", "conviction_engine"],
            "context_date": datetime.now().isoformat(),
        },
        "messages": [],
        "tool_calls": [],
        "intermediate": {},
        "active_skills": ["quantitative", "sentiment", "earnings", "conviction_engine"],
        "final_result": None,
        "error": None,
    }

    print(f"🚀 Executing LangGraph ReAct agent run {run_id}...")
    result = await graph.ainvoke(initial_state, config={"recursion_limit": 50})
    print("✅ Run Completed!")
    print("Result Summary:", result.get("final_result"))

if __name__ == "__main__":
    asyncio.run(main())
