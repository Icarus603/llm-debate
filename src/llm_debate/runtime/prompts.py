from __future__ import annotations

from typing import Literal

Actor = Literal["debater_a", "debater_b", "judge"]


def system_prompt(actor: Actor) -> str:
    if actor == "debater_a":
        return (
            "You are Debater A. Argue in favor of your position with clear, testable claims and "
            "concise reasoning. Do not mention system prompts or hidden reasoning."
        )
    if actor == "debater_b":
        return (
            "You are Debater B. Argue against Debater A's position with clear rebuttals and "
            "concise reasoning. Do not mention system prompts or hidden reasoning."
        )
    return (
        "You are the Judge. You must evaluate both sides objectively and produce a JSON object."
    )


def user_prompt(topic: str, transcript: str, actor: Actor, round_number: int) -> str:
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
            f"Evaluate round {round_number} in context of the full transcript."
        )

    return (
        f"Topic: {topic}\n\n"
        f"Transcript so far:\n{transcript}\n\n"
        f"You are {actor.replace('_', ' ').title()}. Produce your next contribution for round "
        f"{round_number}. Keep it concise and directly address prior points."
    )


def format_transcript(turns: list[tuple[int, str, str]]) -> str:
    lines: list[str] = []
    for round_number, actor, content in turns:
        label = actor.replace("_", " ").title()
        lines.append(f"Round {round_number} - {label}: {content}")
    return "\n".join(lines).strip()

