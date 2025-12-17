from __future__ import annotations

from typing import Literal

Actor = Literal["debater_a", "debater_b", "judge"]

TERMINAL_STATUSES = {"completed", "canceled"}
NON_TERMINAL_STATUSES = {"created", "running", "stopping", "stopped", "failed"}


def is_terminal(status: str) -> bool:
    """Return True when a debate status is terminal."""

    return status in TERMINAL_STATUSES


def status_after_persisted_step(
    *,
    actor: Actor,
    stopping_requested: bool,
    stop_reason: str | None,
) -> tuple[str, str | None]:
    """Compute the debate status update after persisting a turn for a step."""

    if actor == "judge":
        return "completed", stop_reason or "max_rounds"

    if stopping_requested:
        return "stopped", "manual_stop"

    return "running", stop_reason

