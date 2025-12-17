from __future__ import annotations

from llm_debate.runtime.prompts import system_prompt, user_prompt


def test_templates_render_for_debater_a() -> None:
    text = system_prompt("debater_a", debater_a_side="pro", language="en")
    assert "Role:" in text
    assert "Debater A" in text


def test_templates_render_for_judge() -> None:
    text = system_prompt("judge", debater_a_side="pro", language="en")
    assert "Role:" in text
    assert "Judge" in text


def test_user_prompt_renders_with_transcript() -> None:
    text = user_prompt(
        "Topic",
        "Round 1 - Debater A: Hi",
        "debater_a",
        1,
        debater_a_side="pro",
        language="en",
    )
    assert "Topic:" in text
    assert "Transcript so far:" in text


def test_prompt_version_sanitized() -> None:
    text = system_prompt(
        "judge",
        debater_a_side="pro",
        language="en",
        prompt_version="../evil",
    )
    assert "Judge" in text

