from __future__ import annotations

from datetime import UTC, datetime, timedelta

from llm_debate.runtime.steps import (
    compute_next_step,
    judge_no_new_streak,
    should_stop_for_rounds,
    should_stop_for_runtime,
    should_stop_for_token_budget,
    sum_completion_tokens,
)


def test_compute_next_step_empty() -> None:
    step = compute_next_step([])
    assert step.round == 1
    assert step.actor == "debater_a"


def test_compute_next_step_debater_a_to_b() -> None:
    step = compute_next_step([(1, "debater_a")])
    assert step.round == 1
    assert step.actor == "debater_b"


def test_compute_next_step_debater_b_to_judge() -> None:
    step = compute_next_step([(1, "debater_a"), (1, "debater_b")])
    assert step.round == 1
    assert step.actor == "judge"


def test_compute_next_step_judge_to_next_round() -> None:
    step = compute_next_step([(1, "debater_a"), (1, "debater_b"), (1, "judge")])
    assert step.round == 2
    assert step.actor == "debater_a"


def test_should_stop_for_rounds() -> None:
    assert should_stop_for_rounds(settings={"max_rounds": 5}, completed_rounds=5) is True
    assert should_stop_for_rounds(settings={"max_rounds": 5}, completed_rounds=4) is False


def test_should_stop_for_runtime() -> None:
    created_at = datetime.now(tz=UTC) - timedelta(seconds=601)
    assert should_stop_for_runtime(settings={"max_runtime_seconds": 600}, created_at=created_at) is True


def test_token_budget_helpers() -> None:
    total = sum_completion_tokens([{"completion_tokens": 10}, {"completion_tokens": 5}, {}])
    assert total == 15
    assert should_stop_for_token_budget(settings={"max_total_output_tokens": 15}, total_completion_tokens=15)


def test_judge_no_new_streak() -> None:
    metas = [
        {"no_new_substantive_arguments": False},
        {"no_new_substantive_arguments": True},
        {"no_new_substantive_arguments": True},
    ]
    assert judge_no_new_streak(metas) == 2

