from __future__ import annotations

from llm_debate.runtime.status import is_terminal, status_after_persisted_step


def test_is_terminal() -> None:
    assert is_terminal("completed")
    assert is_terminal("canceled")
    assert not is_terminal("running")
    assert not is_terminal("stopped")


def test_status_after_persisted_step_judge_completes() -> None:
    status, stop_reason = status_after_persisted_step(
        actor="judge",
        stopping_requested=False,
        stop_reason=None,
    )
    assert status == "completed"
    assert stop_reason == "max_rounds"


def test_status_after_persisted_step_stopping_sets_stopped() -> None:
    status, stop_reason = status_after_persisted_step(
        actor="debater_a",
        stopping_requested=True,
        stop_reason=None,
    )
    assert status == "stopped"
    assert stop_reason == "manual_stop"


def test_status_after_persisted_step_running_preserves_stop_reason() -> None:
    status, stop_reason = status_after_persisted_step(
        actor="debater_b",
        stopping_requested=False,
        stop_reason="max_runtime_seconds",
    )
    assert status == "running"
    assert stop_reason == "max_runtime_seconds"

