"""
MarketIQ LangGraph Agent Node & Dynamic Tool Binding.
"""
from __future__ import annotations

from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
import structlog

from app.agents.state import AgentState, AGENT_GRAPH_MAP
from app.agents.skill_runtime import get_active_skills, add_active_skill
from app.agents.react import build_react_graph
from app.services.skill_service import SKILL_REGISTRY, active_skill_tool_ids, execution_tier
from app.services.prompt_service import get_prompt
from app.services.tool_service import TOOL_REGISTRY, execute_tool
from app.core.llm import get_llm_for_tier

log = structlog.get_logger(__name__)

ATOMIQ_AGENT_ID = "marketiq_agent"

# ---------------------------------------------------------------------------
# Dynamic LangChain StructuredTools created from TOOL_REGISTRY
# ---------------------------------------------------------------------------

class LoadSkillArgs(BaseModel):
    skill_id: str = Field(..., description="The ID of the skill to load.")


def load_skill_func(skill_id: str) -> str:
    return f"Loaded skill: {skill_id}"


load_skill_tool = StructuredTool.from_function(
    func=load_skill_func,
    name="load_skill",
    description="Load a specific market intelligence skill (e.g. quantitative, sentiment, earnings, counter_bias, conviction_engine, report_generator).",
    args_schema=LoadSkillArgs,
)


class FinalAnswerArgs(BaseModel):
    output: str = Field(..., description="The final answer and output of the agent analysis.")


def final_answer_func(output: str) -> str:
    return "Final answer submitted successfully."


final_answer_tool = StructuredTool.from_function(
    func=final_answer_func,
    name="final_answer",
    description="Submit final answer to complete the market intelligence task.",
    args_schema=FinalAnswerArgs,
)


def _build_langchain_tools() -> list[StructuredTool]:
    """Convert registered embedded tools in TOOL_REGISTRY into LangChain StructuredTools."""
    lc_tools = [load_skill_tool, final_answer_tool]

    for tool_id, reg in TOOL_REGISTRY.items():
        if tool_id in ("load_skill", "final_answer"):
            continue

        def _make_tool_func(tid: str):
            async def _tool_wrapper(**kwargs) -> Any:
                res = await execute_tool(tid, kwargs)
                return res.output if res.success else f"Error in {tid}: {res.error}"
            return _tool_wrapper

        tool_func = _make_tool_func(tool_id)
        tool_func.__doc__ = reg.description
        tool_func.__name__ = tool_id

        lc_tools.append(
            StructuredTool.from_function(
                coroutine=tool_func,
                name=tool_id,
                description=reg.description or f"Execute tool {tool_id}",
            )
        )

    return lc_tools


# ---------------------------------------------------------------------------
# Prompt Composition & Tool Binding
# ---------------------------------------------------------------------------

_BASE_NO_SKILL_PROMPT: str = ""
try:
    _BASE_NO_SKILL_PROMPT = get_prompt("marketiq_base")
except Exception:
    _BASE_NO_SKILL_PROMPT = "You are MarketIQ, an AI-driven Indian equity market intelligence agent."


def _compose_system_prompt(active_skills: list[str]) -> str:
    """Build system prompt: base + active skill procedures."""
    if not active_skills:
        return _BASE_NO_SKILL_PROMPT
    skill_procedures = []
    for sid in active_skills:
        s = SKILL_REGISTRY.get(sid)
        if s:
            skill_procedures.append(f"# {sid.upper()} SKILL\n{s.procedure}")
    return _BASE_NO_SKILL_PROMPT + "\n\n" + "\n\n".join(skill_procedures)


def _bound_tools_for(active_skills: list[str]) -> list[StructuredTool]:
    """Return only tools authorized for active skills + universal control tools."""
    universal = {"load_skill", "final_answer"}
    allowed_ids = active_skill_tool_ids(active_skills) | universal
    all_lc_tools = _build_langchain_tools()
    return [t for t in all_lc_tools if t.name in allowed_ids]


# ---------------------------------------------------------------------------
# Graph Nodes
# ---------------------------------------------------------------------------

async def agent_node(state: AgentState, config: RunnableConfig) -> dict:
    active = get_active_skills(state)
    tier = execution_tier(active) if active else "router"
    llm = get_llm_for_tier(tier)

    force_final = state.get("intermediate", {}).get("force_final_done", False)
    tools = [final_answer_tool] if force_final else _bound_tools_for(active)

    tool_choice = "final_answer" if force_final else "auto"
    llm_with_tools = llm.bind_tools(tools, tool_choice=tool_choice)

    messages = list(state["messages"])
    if not messages:
        system_prompt = _compose_system_prompt(active)
        query = state.get("input_spec", {}).get("query", "Analyze market intelligence")
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=query)]
    elif active:
        desired = _compose_system_prompt(active)
        if messages and isinstance(messages[0], SystemMessage) and messages[0].content != desired:
            messages = [SystemMessage(content=desired)] + messages[1:]

    loop_count = state.get("intermediate", {}).get("loop_count", 0)
    response = await llm_with_tools.ainvoke(messages, config=config)

    return {
        "messages": [response],
        "intermediate": {**state.get("intermediate", {}), "loop_count": loop_count + 1},
    }


async def assemble_result_node(state: AgentState) -> dict:
    """Extract final_answer from tool calls and set final_result."""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "tool_calls"):
            for tc in (msg.tool_calls or []):
                if tc.get("name") == "final_answer":
                    return {"final_result": tc.get("args")}
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content") and msg.content:
            return {"final_result": {"output": str(msg.content)}}
    return {"final_result": {"output": "No result"}}


# Register Graph
try:
    all_tools = _build_langchain_tools()
    _graph = build_react_graph(
        agent_id=ATOMIQ_AGENT_ID,
        agent_node=agent_node,
        assemble_node=assemble_result_node,
        tools=all_tools,
    )
    AGENT_GRAPH_MAP[ATOMIQ_AGENT_ID] = _graph
    log.info("agent_graph_registered", agent_id=ATOMIQ_AGENT_ID, tool_count=len(all_tools))
except Exception as e:
    log.warning("agent_graph_registration_deferred", error=str(e))
