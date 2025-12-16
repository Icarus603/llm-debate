from __future__ import annotations

from pydantic import ValidationError
import pytest

from llm_debate.api.schemas import DebateSettingsIn


def test_debate_settings_rejects_unknown_keys() -> None:
    with pytest.raises(ValidationError):
        DebateSettingsIn.model_validate({"unknown_key": 123})


def test_debate_settings_rejects_invalid_stance() -> None:
    with pytest.raises(ValidationError):
        DebateSettingsIn.model_validate({"debater_a_side": "maybe"})

