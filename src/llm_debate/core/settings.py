from __future__ import annotations

from functools import lru_cache
from typing import Literal

from dotenv import load_dotenv
from pydantic import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: AnyUrl
    redis_url: AnyUrl

    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model_debater: str = "deepseek-chat"
    deepseek_model_judge: str = "deepseek-chat"

    debate_max_rounds: int = 5
    debate_max_runtime_seconds: int = 600
    debate_max_total_output_tokens: int = 8000
    debate_max_tokens_debater: int = 600
    debate_max_tokens_judge: int = 400

    log_level: Literal["debug", "info", "warning", "error"] = "info"


@lru_cache(maxsize=1)
def load_settings() -> Settings:
    """Load and cache settings."""

    load_dotenv(override=False)
    return Settings()  # type: ignore[call-arg]
