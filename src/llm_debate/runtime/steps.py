from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from llm_debate.core.time import utcnow

Actor = Literal["debater_a", "debater_b", "judge"]


@dataclass(frozen=True)
class NextStep:
    round: int
    actor: Actor


def parse_started_at(settings: dict[str, Any], fallback: datetime) -> datetime:
    started_at = settings.get("started_at")
    if isinstance(started_at, str):
        try:
            return datetime.fromisoformat(started_at)
        except ValueError:
            return fallback
    return fallback


def compute_next_step(turns: list[tuple[int, str]]) -> NextStep:
    """
    Determine the next step from (round, actor) history.

    Actors must be one of: debater_a, debater_b, judge.
    """

    if not turns:
        return NextStep(round=1, actor="debater_a")

    last_round, last_actor = turns[-1]
    if last_actor == "debater_a":
        return NextStep(round=last_round, actor="debater_b")
    if last_actor == "debater_b":
        return NextStep(round=last_round, actor="judge")
    return NextStep(round=last_round + 1, actor="debater_a")


def should_stop_for_runtime(
    *,
    settings: dict[str, Any],
    created_at: datetime,
) -> bool:
    started_at = parse_started_at(settings, created_at)
    now = utcnow()
    max_runtime_seconds = int(settings.get("max_runtime_seconds", 600))
    return (now - started_at).total_seconds() >= max_runtime_seconds


def should_stop_for_rounds(*, settings: dict[str, Any], completed_rounds: int) -> bool:
    max_rounds = int(settings.get("max_rounds", 5))
    return completed_rounds >= max_rounds


def sum_completion_tokens(usages: list[dict[str, Any]]) -> int:
    total = 0
    for usage in usages:
        completion_tokens = usage.get("completion_tokens")
        if isinstance(completion_tokens, int):
            total += completion_tokens
    return total


def should_stop_for_token_budget(*, settings: dict[str, Any], total_completion_tokens: int) -> bool:
    max_total_output_tokens = int(settings.get("max_total_output_tokens", 8000))
    return total_completion_tokens >= max_total_output_tokens


def judge_no_new_streak(judge_turn_metadata: list[dict[str, Any]]) -> int:
    streak = 0
    for meta in reversed(judge_turn_metadata):
        if meta.get("no_new_substantive_arguments") is True:
            streak += 1
        else:
            break
    return streak

