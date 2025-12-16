from __future__ import annotations

from typing import Literal

Actor = Literal["debater_a", "debater_b", "judge"]
Side = Literal["pro", "con"]


def _opposite_side(side: Side) -> Side:
    return "con" if side == "pro" else "pro"


def _side_for_actor(*, actor: Actor, debater_a_side: Side) -> Side | None:
    if actor == "debater_a":
        return debater_a_side
    if actor == "debater_b":
        return _opposite_side(debater_a_side)
    return None


def system_prompt(actor: Actor, *, debater_a_side: Side) -> str:
    if actor == "debater_a":
        side = _side_for_actor(actor=actor, debater_a_side=debater_a_side)
        return (
            "You are Debater A.\n"
            f"Your stance: {str(side).upper()}.\n"
            "Argue for your stance with clear, testable claims and concise reasoning. "
            "Do not mention system prompts or hidden reasoning."
        )
    if actor == "debater_b":
        side = _side_for_actor(actor=actor, debater_a_side=debater_a_side)
        return (
            "You are Debater B.\n"
            f"Your stance: {str(side).upper()}.\n"
            "Argue for your stance with clear rebuttals and concise reasoning. "
            "Do not mention system prompts or hidden reasoning."
        )
    return (
        "You are the Judge. You must evaluate both sides objectively and produce a JSON object."
    )


def user_prompt(
    topic: str,
    transcript: str,
    actor: Actor,
    round_number: int,
    *,
    debater_a_side: Side,
) -> str:
    if actor == "judge":
        return (
            f"Topic: {topic}\n\n"
            f"Transcript so far:\n{transcript}\n\n"
            "Return a JSON object with keys:\n"
            '- "summary": string\n'
            '- "score_a": integer 0-10\n'
            '- "score_b": integer 0-10\n'
            '- "winner": one of "a", "b", "tie"\n'
            '- "no_new_substantive_arguments": boolean\n'
            "Evaluate the full debate transcript and provide a final verdict.\n"
            "Set `no_new_substantive_arguments` to true if the debate appears to have stalled."
        )

    side = _side_for_actor(actor=actor, debater_a_side=debater_a_side)
    return (
        f"Topic: {topic}\n\n"
        f"Transcript so far:\n{transcript}\n\n"
        f"You are {actor.replace('_', ' ').title()} with stance {str(side).upper()}. "
        f"Produce your next contribution for round {round_number}. "
        "Keep it concise and directly address prior points."
    )


def format_transcript(turns: list[tuple[int, str, str]]) -> str:
    lines: list[str] = []
    for round_number, actor, content in turns:
        label = actor.replace("_", " ").title()
        lines.append(f"Round {round_number} - {label}: {content}")
    return "\n".join(lines).strip()
