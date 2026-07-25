from __future__ import annotations

from typing import Any
from collections.abc import Callable

from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage

from app.agents.state import AgentState
from app.services.skill_service import SKILL_REGISTRY

# Default loop cap
_DEFAULT_REACT_MAX_LOOPS = 5
TOOL_FAIL_SOFT_CAP = 3
TOOL_FAIL_HARD_CAP = 6

def _state_max_react_loops(state: AgentState) -> int:
    active = state.get("active_skills") or state.get("input_spec", {}).get("active_skills") or []
    if not active:
        return _DEFAULT_REACT_MAX_LOOPS
    max_loops = 0
    for sid in active:
        skill = SKILL_REGISTRY.get(sid)
        if skill and skill.max_loops > max_loops:
            max_loops = skill.max_loops
    return max_loops if max_loops > 0 else _DEFAULT_REACT_MAX_LOOPS

def _is_failed_tool_message(m: Any) -> bool:
    if not hasattr(m, "status") and not hasattr(m, "content"):
        return False
    if getattr(m, "status", None) == "error":
        return True
    content = m.content if isinstance(m.content, str) else ""
    return content.startswith("Tool error (")

def _count_tool_failures(messages: list[Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for m in messages or []:
        if _is_failed_tool_message(m):
            name = getattr(m, "name", None) or "unknown"
            counts[name] = counts.get(name, 0) + 1
    return counts

def _count_tool_rounds(messages: list[Any]) -> int:
    return sum(
        1 for m in (messages or []) if isinstance(m, AIMessage) and getattr(m, "tool_calls", None)
    )

def should_continue_react(state: AgentState) -> str:
    messages = state.get("messages", [])
    if not messages:
        return "assemble_result"
    last = messages[-1]
    if getattr(last, "tool_calls", None):
        return "tools"
        
    correction_count = (state.get("intermediate") or {}).get("correction_count", 0)
    if correction_count < 2:
        return "needs_correction"
    return "assemble_result"

def route_after_tools(state: AgentState) -> str:
    messages = state.get("messages", [])
    latest = next(
        (m for m in reversed(messages) if isinstance(m, AIMessage) and getattr(m, "tool_calls", None)),
        None,
    )
    if latest is None:
        return "agent"

    names = [
        (tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None))
        for tc in latest.tool_calls
    ]
    
    if "final_answer" in names:
        return "assemble_result"

    failures = _count_tool_failures(messages)
    total_fails = sum(failures.values())
    worst_fails = max(failures.values(), default=0)
    intermediate = state.get("intermediate") or {}
    
    if total_fails >= TOOL_FAIL_HARD_CAP:
        return "assemble_result"
    if worst_fails >= TOOL_FAIL_SOFT_CAP and intermediate.get("tool_guard_count", 0) == 0:
        return "tool_failure_guard"

    rounds = _count_tool_rounds(messages)
    if rounds >= _state_max_react_loops(state):
        if not intermediate.get("force_final_done"):
            return "force_final"
        return "assemble_result"
        
    return "agent"

async def needs_correction_node(state: AgentState) -> dict:
    messages = list(state.get("messages") or [])
    messages.append(
        HumanMessage(content="You must call a tool to proceed. Use final_answer if you are done.")
    )
    intermediate = {**(state.get("intermediate") or {})}
    intermediate["correction_count"] = intermediate.get("correction_count", 0) + 1
    return {"messages": messages, "intermediate": intermediate}

async def tool_failure_guard_node(state: AgentState) -> dict:
    failures = _count_tool_failures(state.get("messages") or [])
    worst_tool = max(failures, key=lambda k: failures[k], default="that tool")
    n = failures.get(worst_tool, 0)
    messages = list(state.get("messages") or [])
    messages.append(
        HumanMessage(content=f"`{worst_tool}` has failed {n} times. Fix arguments or use final_answer.")
    )
    intermediate = {**(state.get("intermediate") or {})}
    intermediate["tool_guard_count"] = intermediate.get("tool_guard_count", 0) + 1
    return {"messages": messages, "intermediate": intermediate}

async def force_final_node(state: AgentState) -> dict:
    messages = list(state.get("messages") or [])
    messages.append(
        HumanMessage(content="Maximum steps reached. Call `final_answer` now with best available answer.")
    )
    intermediate = {**(state.get("intermediate") or {})}
    intermediate["force_final_done"] = True
    return {"messages": messages, "intermediate": intermediate}

def build_react_graph(
    agent_id: str,
    agent_node: Callable,
    assemble_node: Callable,
    tools: list,
) -> Any:
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(tools))
    graph.add_node("assemble_result", assemble_node)
    graph.add_node("needs_correction", needs_correction_node)
    graph.add_node("tool_failure_guard", tool_failure_guard_node)
    graph.add_node("force_final", force_final_node)
    
    graph.set_entry_point("agent")
    
    graph.add_conditional_edges("agent", should_continue_react, {
        "tools": "tools",
        "assemble_result": "assemble_result",
        "needs_correction": "needs_correction",
    })
    graph.add_conditional_edges("tools", route_after_tools, {
        "agent": "agent",
        "assemble_result": "assemble_result",
        "tool_failure_guard": "tool_failure_guard",
        "force_final": "force_final",
    })
    graph.add_edge("needs_correction", "agent")
    graph.add_edge("tool_failure_guard", "agent")
    graph.add_edge("force_final", "agent")
    graph.add_edge("assemble_result", END)
    
    return graph.compile()
