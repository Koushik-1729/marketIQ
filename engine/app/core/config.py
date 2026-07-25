"""
Application configuration settings via Pydantic BaseSettings.
Loads all parameters dynamically from environment variables / .env file.
"""
from __future__ import annotations

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/marketiq"
    DIRECT_URL: str = "postgresql://user:pass@localhost:5432/marketiq"
    REDIS_URL: str = "redis://localhost:6379/0"

    LLM_PROVIDER: str = "nvidia"
    LLM_MODEL_ROUTER: str = "minimaxai/minimax-m3"
    LLM_MODEL_MAX: str = "minimaxai/minimax-m3"
    LLM_MODEL_CAPABLE: str = "minimaxai/minimax-m3"
    LLM_MODEL_LITE: str = "minimaxai/minimax-m3"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    NVIDIA_API_KEY: Optional[str] = "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"
    OPENAI_BASE_URL: Optional[str] = "https://integrate.api.nvidia.com/v1"

    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    NSE_FILINGS_URL: str = "https://www.nseindia.com/api/corporate-announcements"
    BSE_ANNOUNCEMENTS_URL: str = "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w"
    STOCKTWITS_ACCESS_TOKEN: Optional[str] = None

    ECONOMIC_TIMES_RSS: str = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
    MONEYCONTROL_RSS: str = "https://www.moneycontrol.com/rss/marketreports.xml"
    CNBCTV18_RSS: str = "https://www.cnbctv18.com/commonfeeds/v1/hin/rss/market.xml"
    BUSINESS_STANDARD_RSS: str = "https://www.business-standard.com/rss/markets-106.rss"

    ENGINE_PORT: int = 8001
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def log_level(self) -> str:
        return self.LOG_LEVEL

    @property
    def environment(self) -> str:
        return self.ENVIRONMENT

    @property
    def engine_port(self) -> int:
        return self.ENGINE_PORT

    @property
    def telegram_bot_token(self) -> Optional[str]:
        return self.TELEGRAM_BOT_TOKEN

    @property
    def telegram_chat_id(self) -> Optional[str]:
        return self.TELEGRAM_CHAT_ID

    @property
    def is_ollama(self) -> bool:
        return self.LLM_PROVIDER.lower() == "ollama"

    @property
    def is_nvidia(self) -> bool:
        return self.LLM_PROVIDER.lower() in ("nvidia", "nvidia_api")

    def litellm_model_for(self, tier: str) -> str:
        tier_map = {
            "max": self.LLM_MODEL_MAX,
            "capable": self.LLM_MODEL_CAPABLE,
            "lite": self.LLM_MODEL_LITE,
            "router": self.LLM_MODEL_ROUTER,
        }
        return tier_map.get(tier.lower(), self.LLM_MODEL_ROUTER)


settings = Settings()
