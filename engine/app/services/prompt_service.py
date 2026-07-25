from __future__ import annotations

import re
from pathlib import Path
import structlog

logger = structlog.get_logger(__name__)

_DEFAULT_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
_PROMPTS_DIR = _DEFAULT_PROMPTS_DIR
_PROMPT_CACHE: dict[str, str] = {}

_INCLUDE_RE = re.compile(r'\{\{\s*include\s+"([^"]+)"\s*\}\}')
_MAX_INCLUDE_DEPTH = 4


def _resolve_includes(
    text: str, base_dir: Path, _seen: frozenset[str] = frozenset(), _depth: int = 0
) -> str:
    if _depth > _MAX_INCLUDE_DEPTH:
        raise RuntimeError(f"Playbook include depth exceeded {_MAX_INCLUDE_DEPTH}.")

    def _sub(match: re.Match[str]) -> str:
        rel_path = match.group(1)
        if rel_path in _seen:
            raise RuntimeError(f"Playbook include cycle detected at '{rel_path}'.")
        target = base_dir / rel_path
        if not target.exists():
            raise RuntimeError(f"Playbook include not found: '{rel_path}'")
        body = target.read_text(encoding="utf-8").strip()
        if not body:
            raise RuntimeError(f"Playbook include is empty: '{rel_path}'.")
        return _resolve_includes(body, base_dir, _seen | {rel_path}, _depth + 1)

    return _INCLUDE_RE.sub(_sub, text)


def load_prompts(prompts_dir: Path | None = None) -> None:
    _PROMPT_CACHE.clear()

    prompts_path = prompts_dir or _DEFAULT_PROMPTS_DIR
    agents_dir = prompts_path / "agents"
    system_dir = prompts_path / "system"

    if not agents_dir.exists():
        agents_dir.mkdir(parents=True, exist_ok=True)
    if not system_dir.exists():
        system_dir.mkdir(parents=True, exist_ok=True)

    loaded: list[str] = []
    for source_dir in (agents_dir, system_dir):
        for path in sorted(source_dir.glob("*.md")):
            raw = path.read_text(encoding="utf-8").strip()
            if not raw:
                raise RuntimeError(f"Prompt file is empty: {path}")
            rendered = _resolve_includes(raw, prompts_path).strip()
            if not rendered:
                raise RuntimeError(f"Prompt rendered empty after include resolution: {path}")
            if path.stem in _PROMPT_CACHE:
                raise RuntimeError(f"Duplicate prompt name '{path.stem}'")
            _PROMPT_CACHE[path.stem] = rendered
            loaded.append(path.stem)

    logger.info("agent_prompts_loaded", count=len(loaded), prompts=loaded)


def get_prompt(name: str) -> str:
    if name not in _PROMPT_CACHE:
        raise RuntimeError(f"No prompt loaded for '{name}'.")
    return _PROMPT_CACHE[name]
