from __future__ import annotations

from typing import Any
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage

from app.agents.state import AgentState
from app.services.skill_service import SKILL_REGISTRY

def get_active_skills(state: AgentState) -> list[str]:
    """Get active skills from state or fallback to input_spec."""
    active = state.get("active_skills")
    if not active:
        active = state.get("input_spec", {}).get("active_skills", [])
    return list(active)

def add_active_skill(current: list[str], skill_id: str) -> list[str]:
    """Add a skill if it exists and we haven't hit the cap of 3."""
    if skill_id not in SKILL_REGISTRY:
        raise ValueError(f"Unknown skill_id: {skill_id}")
    
    merged = list(current) if current else []
    if skill_id not in merged:
        if len(merged) >= 3:
            raise ValueError("Maximum 3 active skills allowed per run.")
        merged.append(skill_id)
    return merged

def build_first_pass_messages(state: AgentState, system_prompt: str) -> list[BaseMessage]:
    """Build the initial message list with system prompt and human query."""
    query = state.get("input_spec", {}).get("query", "")
    return [
        SystemMessage(content=system_prompt),
        HumanMessage(content=query)
    ]
