from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from llm_debate.runtime.model_select import select_model_for_actor


@dataclass(frozen=True)
class _Defaults:
    deepseek_model_debater: str = "debater-default"
    deepseek_model_judge: str = "judge-default"


def test_select_model_uses_defaults_when_no_override() -> None:
    defaults = _Defaults()
    debate_settings: dict[str, Any] = {}
    assert (
        select_model_for_actor(actor="debater_a", debate_settings=debate_settings, defaults=defaults)
        == "debater-default"
    )
    assert (
        select_model_for_actor(actor="judge", debate_settings=debate_settings, defaults=defaults)
        == "judge-default"
    )


def test_select_model_uses_per_debate_override() -> None:
    defaults = _Defaults()
    debate_settings: dict[str, Any] = {"model_debater": "debater-override", "model_judge": "judge-override"}
    assert (
        select_model_for_actor(actor="debater_b", debate_settings=debate_settings, defaults=defaults)
        == "debater-override"
    )
    assert (
        select_model_for_actor(actor="judge", debate_settings=debate_settings, defaults=defaults)
        == "judge-override"
    )

