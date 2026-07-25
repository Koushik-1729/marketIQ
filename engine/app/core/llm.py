"""
LLM Factory Module.
Supports NVIDIA API (GLM-5.2, MiniMax-M3, Llama 3.3), Ollama, OpenAI, Anthropic via LangChain.
Includes robust timeout & retry handling for external API endpoints.
"""
from __future__ import annotations

from typing import Any
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


def get_llm(role: str = "router") -> Any:
    """Factory function to get configured LLM instance based on role/tier."""
    return get_llm_for_tier(role)


def get_llm_for_tier(tier: str) -> Any:
    """Returns a configured LLM instance for the specified skill model tier."""
    model_name = settings.litellm_model_for(tier)
    provider = settings.LLM_PROVIDER.lower()

    logger.info("initializing_llm", tier=tier, model=model_name, provider=provider)

    if provider in ("nvidia", "nvidia_api"):
        from langchain_openai import ChatOpenAI
        api_key = settings.NVIDIA_API_KEY
        base_url = settings.OPENAI_BASE_URL or "https://integrate.api.nvidia.com/v1"
        return ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base=base_url,
            temperature=0.0,
            max_tokens=4096,
            timeout=35.0,
            max_retries=3
        )

    if provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
            clean_model = model_name.split("/")[-1]
            return ChatOllama(
                model=clean_model,
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.0,
            )
        except ImportError:
            from langchain_community.chat_models import ChatOllama
            clean_model = model_name.split("/")[-1]
            return ChatOllama(
                model=clean_model,
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.0,
            )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        clean_model = model_name.split("/")[-1]
        kwargs = {"model": clean_model, "temperature": 0.0}
        if settings.OPENAI_BASE_URL and settings.OPENAI_BASE_URL != "https://api.openai.com/v1":
            kwargs["openai_api_base"] = settings.OPENAI_BASE_URL
        if settings.OPENAI_API_KEY:
            kwargs["openai_api_key"] = settings.OPENAI_API_KEY
        return ChatOpenAI(**kwargs)

    # Standard fallback to ChatOpenAI (NVIDIA endpoint)
    from langchain_openai import ChatOpenAI
    api_key = settings.NVIDIA_API_KEY
    base_url = settings.OPENAI_BASE_URL or "https://integrate.api.nvidia.com/v1"
    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=0.0,
        timeout=35.0,
        max_retries=3
    )
