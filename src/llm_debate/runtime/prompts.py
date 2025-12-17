from __future__ import annotations

from functools import lru_cache
from importlib.resources import files
import re
from typing import Literal

Actor = Literal["debater_a", "debater_b", "judge"]
Side = Literal["pro", "con"]
OutputLanguage = Literal["zh-Hant", "zh-Hans", "en"]


def _opposite_side(side: Side) -> Side:
    return "con" if side == "pro" else "pro"


def _side_for_actor(*, actor: Actor, debater_a_side: Side) -> Side | None:
    if actor == "debater_a":
        return debater_a_side
    if actor == "debater_b":
        return _opposite_side(debater_a_side)
    return None


def _language_instruction(language: OutputLanguage) -> str:
    if language == "zh-Hans":
        return "All outputs MUST be in Simplified Chinese."
    if language == "zh-Hant":
        return "All outputs MUST be in Traditional Chinese."
    return "All outputs MUST be in English."

_VERSION_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def _normalize_prompt_version(version: str) -> str:
    v = version.strip() or "v1"
    if not _VERSION_RE.fullmatch(v):
        return "v1"
    return v


@lru_cache(maxsize=32)
def _load_template(*, version: str, name: str) -> str:
    v = _normalize_prompt_version(version)
    path = files("llm_debate.prompts") / v / name
    return path.read_text(encoding="utf-8")


def system_prompt(
    actor: Actor,
    *,
    debater_a_side: Side,
    language: OutputLanguage,
    prompt_version: str = "v1",
) -> str:
    side = _side_for_actor(actor=actor, debater_a_side=debater_a_side)
    stance = str(side).upper() if side is not None else "N/A"
    language_rule = _language_instruction(language)

    if actor == "debater_a":
        template_name = "debater_a_system.txt"
    elif actor == "debater_b":
        template_name = "debater_b_system.txt"
    else:
        template_name = "judge_system.txt"

    return _load_template(version=prompt_version, name=template_name).format(
        stance=stance,
        language_rule=language_rule,
    )


def user_prompt(
    topic: str,
    transcript: str,
    actor: Actor,
    round_number: int,
    *,
    debater_a_side: Side,
    language: OutputLanguage,
    prompt_version: str = "v1",
) -> str:
    language_rule = _language_instruction(language)
    side = _side_for_actor(actor=actor, debater_a_side=debater_a_side)
    stance = str(side).upper() if side is not None else "N/A"

    template_name = "judge_user.txt" if actor == "judge" else "debater_user.txt"
    return _load_template(version=prompt_version, name=template_name).format(
        topic=topic,
        transcript=transcript,
        round_number=round_number,
        actor=actor,
        stance=stance,
        language_rule=language_rule,
    )


def format_transcript(turns: list[tuple[int, str, str]]) -> str:
    lines: list[str] = []
    for round_number, actor, content in turns:
        if actor == "debater_a":
            label = "A"
        elif actor == "debater_b":
            label = "B"
        elif actor == "judge":
            label = "Judge"
        else:
            label = actor
        lines.append(f"Round {round_number} - {label}: {content}")
    return "\n".join(lines).strip()
