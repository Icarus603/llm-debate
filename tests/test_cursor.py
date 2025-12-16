from __future__ import annotations

from llm_debate.runtime.cursor import cursor_after_step, cursor_from_last_turn


def test_cursor_from_last_turn_empty() -> None:
    assert cursor_from_last_turn(last_round=None, last_actor=None) == (1, "debater_a")


def test_cursor_from_last_turn_debater_a() -> None:
    assert cursor_from_last_turn(last_round=1, last_actor="debater_a") == (1, "debater_b")


def test_cursor_from_last_turn_debater_b() -> None:
    assert cursor_from_last_turn(last_round=2, last_actor="debater_b") == (3, "debater_a")


def test_cursor_from_last_turn_judge() -> None:
    assert cursor_from_last_turn(last_round=3, last_actor="judge") == (4, "debater_a")


def test_cursor_after_step() -> None:
    assert cursor_after_step(next_round=1, next_actor="debater_a", persisted_actor="debater_a") == (
        1,
        "debater_b",
    )
    assert cursor_after_step(next_round=1, next_actor="debater_b", persisted_actor="debater_b") == (
        2,
        "debater_a",
    )
    assert cursor_after_step(next_round=6, next_actor="judge", persisted_actor="judge") == (6, "debater_a")
