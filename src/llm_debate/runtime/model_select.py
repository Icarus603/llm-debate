from __future__ import annotations

from typing import Any, Literal, Protocol

Actor = Literal["debater_a", "debater_b", "judge"]


class _ModelDefaults(Protocol):
    @property
    def deepseek_model_debater(self) -> str: ...

    @property
    def deepseek_model_judge(self) -> str: ...


def select_model_for_actor(
    *, actor: Actor, debate_settings: dict[str, Any], defaults: _ModelDefaults
) -> str:
    """
    Select a model id for an actor with per-debate overrides.

    `defaults` is expected to provide `deepseek_model_debater` and `deepseek_model_judge` attributes.
    """

    model_override_key = "model_judge" if actor == "judge" else "model_debater"
    raw = str(debate_settings.get(model_override_key) or "").strip()
    if raw:
        return raw
    return defaults.deepseek_model_judge if actor == "judge" else defaults.deepseek_model_debater
