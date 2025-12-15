from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Any, cast

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from llm_debate.core.settings import load_settings


@dataclass(frozen=True)
class ChatResult:
    content: str
    model: str | None
    usage: dict[str, Any]
    metadata: dict[str, Any]


def _usage_to_dict(usage: Any) -> dict[str, Any]:
    if usage is None:
        return {}
    if hasattr(usage, "model_dump"):
        return usage.model_dump()  # type: ignore[no-any-return]
    if isinstance(usage, dict):
        return usage
    return {}


class DeepSeekClient:
    """DeepSeek client using the OpenAI-compatible API surface."""

    def __init__(self) -> None:
        settings = load_settings()
        self._client = OpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

    @retry(wait=wait_exponential(min=0.5, max=10), stop=stop_after_attempt(3))
    def chat_completion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int,
        response_format: dict[str, Any] | None = None,
    ) -> ChatResult:
        extra: dict[str, Any] = {}
        if response_format is not None:
            extra["response_format"] = response_format

        response = self._client.chat.completions.create(
            model=model,
            messages=cast(Any, messages),
            max_tokens=max_tokens,
            **extra,
        )

        message = response.choices[0].message
        content = message.content or ""

        metadata: dict[str, Any] = {}
        reasoning_content = getattr(message, "reasoning_content", None)
        if reasoning_content:
            metadata["has_reasoning_content"] = True

        return ChatResult(
            content=content,
            model=getattr(response, "model", None),
            usage=_usage_to_dict(getattr(response, "usage", None)),
            metadata=metadata,
        )


def safe_parse_json_object(text: str) -> dict[str, Any]:
    """Parse a JSON object string, raising ValueError if invalid or not an object."""

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("Expected JSON object")
    return parsed
