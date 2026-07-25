from typing import TypedDict, Annotated, NotRequired, Any
from langgraph.graph.message import add_messages

def _merge_active_skills(current: list[str], new: list[str]) -> list[str]:
    # Monotonic merge - skills only added, never removed
    merged = list(current) if current else []
    for s in (new or []):
        if s not in merged:
            merged.append(s)
    return merged

class AgentState(TypedDict):
    agent_id: str
    session_id: str
    run_id: str
    input_spec: dict  # {query, active_skills, context_date, ticker_focus}
    messages: Annotated[list, add_messages]
    tool_calls: list[dict]
    intermediate: dict  # correction_count, loop_count, force_final_done
    active_skills: NotRequired[Annotated[list[str], _merge_active_skills]]
    final_result: dict | None
    error: str | None

AGENT_GRAPH_MAP: dict[str, Any] = {}
