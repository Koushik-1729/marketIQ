from __future__ import annotations

import yaml
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import structlog

from app.services.prompt_service import _PROMPTS_DIR, _resolve_includes

logger = structlog.get_logger(__name__)

_DEFAULT_SKILLS_DIR = Path(__file__).parent.parent.parent / "skills"


@dataclass
class SkillRegistration:
    skill_id: str
    kind: str
    description: str
    procedure: str
    tools: list[str]
    required_inputs: tuple[tuple[str, ...], ...]
    examples: list[str]
    max_loops: int
    model_tier: str
    enabled: bool = True


SKILL_REGISTRY: dict[str, SkillRegistration] = {}


def _parse_required_inputs(raw: Any, where: str) -> tuple[tuple[str, ...], ...]:
    if raw is None:
        return ()
    if not isinstance(raw, list):
        raise RuntimeError(f"{where}: required_inputs must be a list of lists. Got: {raw!r}")
    groups: list[tuple[str, ...]] = []
    for group in raw:
        if not isinstance(group, list) or not all(isinstance(x, str) for x in group):
            raise RuntimeError(f"{where}: each required_inputs group must be a list of strings. Got: {group!r}")
        groups.append(tuple(group))
    return tuple(groups)


def load_skills(skills_dir: Path | None = None) -> None:
    SKILL_REGISTRY.clear()

    skills_path = skills_dir or _DEFAULT_SKILLS_DIR
    if not skills_path.exists():
        raise RuntimeError(f"Skills directory not found: {skills_path}")

    loaded: list[str] = []
    for skill_dir in sorted(p for p in skills_path.iterdir() if p.is_dir()):
        skill_id = skill_dir.name
        yaml_path = skill_dir / "skill.yaml"
        md_path = skill_dir / "skill.md"

        if not yaml_path.exists():
            raise RuntimeError(f"skill '{skill_id}': missing manifest {yaml_path}.")

        manifest = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
        declared_id = manifest.get("skill_id")
        if declared_id is not None and str(declared_id) != skill_id:
            raise RuntimeError(f"skill '{skill_id}': skill_id '{declared_id}' must match directory name.")

        description = str(manifest.get("description") or "").strip()
        if not description:
            raise RuntimeError(f"skill '{skill_id}': 'description' is required.")

        if skill_id in SKILL_REGISTRY:
            raise RuntimeError(f"Duplicate skill_id '{skill_id}'.")

        enabled = bool(manifest.get("enabled", True))
        if not enabled:
            continue

        if not md_path.exists():
            raise RuntimeError(f"skill '{skill_id}': missing procedure {md_path}.")

        raw_md = md_path.read_text(encoding="utf-8").strip()
        procedure = _resolve_includes(raw_md, _PROMPTS_DIR).strip()
        if not procedure:
            raise RuntimeError(f"skill '{skill_id}': skill.md rendered empty.")

        tools = manifest.get("tools") or []
        model_tier = str(manifest.get("model_tier", "capable")).strip().lower()

        SKILL_REGISTRY[skill_id] = SkillRegistration(
            skill_id=skill_id,
            kind=manifest.get("kind", "functional"),
            description=description,
            procedure=procedure,
            tools=list(tools),
            required_inputs=_parse_required_inputs(manifest.get("required_inputs"), f"skill '{skill_id}'"),
            examples=[str(x) for x in (manifest.get("examples") or [])],
            max_loops=int(manifest.get("max_loops", 5)),
            model_tier=model_tier,
            enabled=enabled,
        )
        loaded.append(skill_id)

    if not loaded:
        raise RuntimeError(f"No skills found in {skills_path}.")
    logger.info("skills_loaded", count=len(loaded), skills=loaded)


def get_skill(skill_id: str) -> SkillRegistration | None:
    return SKILL_REGISTRY.get(skill_id)


def active_skill_tool_ids(active_skills: list[str]) -> set[str]:
    tools: set[str] = set()
    for sid in active_skills:
        s = get_skill(sid)
        if s:
            tools.update(s.tools)
    return tools


def execution_tier(active_skills: list[str]) -> str:
    tier_priority = {"max": 3, "capable": 2, "lite": 1}
    highest_priority = 0
    highest_tier = "router"

    for sid in active_skills:
        s = get_skill(sid)
        if s:
            p = tier_priority.get(s.model_tier, 1)
            if p > highest_priority:
                highest_priority = p
                highest_tier = s.model_tier

    return highest_tier
