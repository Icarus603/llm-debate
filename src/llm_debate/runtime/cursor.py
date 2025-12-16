from __future__ import annotations

from typing import Literal

Actor = Literal["debater_a", "debater_b", "judge"]


def cursor_from_last_turn(*, last_round: int | None, last_actor: str | None) -> tuple[int, Actor]:
    """
    Compute the next (round, actor) cursor from the last persisted turn.

    If no turns exist, the cursor starts at round 1 for debater_a.
    """

    if last_round is None or last_actor is None:
        return 1, "debater_a"

    if last_actor == "debater_a":
        return last_round, "debater_b"
    if last_actor == "debater_b":
        return last_round + 1, "debater_a"
    if last_actor == "judge":
        return last_round + 1, "debater_a"
    return 1, "debater_a"


def cursor_after_step(*, next_round: int, next_actor: Actor, persisted_actor: Actor) -> tuple[int, Actor]:
    """
    Advance a cursor after persisting a step.

    The caller MUST only advance when the cursor matches the persisted step.
    """

    if persisted_actor == "debater_a":
        return next_round, "debater_b"
    if persisted_actor == "debater_b":
        return next_round + 1, "debater_a"
    return next_round, "debater_a"


def completed_rounds_from_cursor(*, next_round: int) -> int:
    """
    Return completed rounds based on the invariant that a round completes after Debater B writes.
    """

    return max(0, int(next_round) - 1)
