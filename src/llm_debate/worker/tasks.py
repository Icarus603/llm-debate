from __future__ import annotations

from typing import Any, Literal
import uuid

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select

from llm_debate.core.settings import load_settings
from llm_debate.core.time import utcnow
from llm_debate.db.engine import create_db_engine, create_sessionmaker, session_scope
from llm_debate.db.models import Debate, Turn
from llm_debate.llm.deepseek import DeepSeekClient, safe_parse_json_object
from llm_debate.runtime.prompts import format_transcript, system_prompt, user_prompt
from llm_debate.runtime.steps import (
    compute_next_step,
    judge_no_new_streak,
    should_stop_for_rounds,
    should_stop_for_runtime,
    should_stop_for_token_budget,
    sum_completion_tokens,
)
from llm_debate.worker.celery_app import celery_app

_ENGINE = create_db_engine()
_SESSIONMAKER = create_sessionmaker(_ENGINE)
_CLIENT = DeepSeekClient()

Actor = Literal["debater_a", "debater_b", "judge"]


class JudgeVerdict(BaseModel):
    summary: str = Field(min_length=1)
    score_a: int = Field(ge=0, le=10)
    score_b: int = Field(ge=0, le=10)
    winner: Literal["a", "b", "tie"]
    no_new_substantive_arguments: bool


def _render_judge_content(verdict: JudgeVerdict) -> str:
    return (
        f"Winner: {verdict.winner.upper()}\n"
        f"Scores: A={verdict.score_a}, B={verdict.score_b}\n\n"
        f"{verdict.summary}"
    ).strip()


def _ensure_uuid(text: str) -> uuid.UUID:
    return uuid.UUID(text)


def _completed_rounds(turns: list[Turn]) -> int:
    judge_rounds = {t.round for t in turns if t.actor == "judge"}
    return len(judge_rounds)


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)  # type: ignore[untyped-decorator]
def advance_debate(self: Any, debate_id: str) -> None:
    settings = load_settings()
    debate_uuid = _ensure_uuid(debate_id)

    with session_scope(_SESSIONMAKER) as db:
        debate = db.get(Debate, debate_uuid)
        if debate is None:
            return

        if debate.status == "stopping":
            debate.status = "stopped"
            debate.updated_at = utcnow()
            db.add(debate)
            return

        if debate.status != "running":
            return

        turns = list(
            db.execute(select(Turn).where(Turn.debate_id == debate_uuid).order_by(Turn.created_at))
            .scalars()
        )

        completed_rounds = _completed_rounds(turns)

        if should_stop_for_rounds(settings=debate.settings, completed_rounds=completed_rounds):
            debate.status = "completed"
            debate.updated_at = utcnow()
            db.add(debate)
            return

        if should_stop_for_runtime(settings=debate.settings, created_at=debate.created_at):
            debate.status = "completed"
            debate.updated_at = utcnow()
            db.add(debate)
            return

        total_tokens = sum_completion_tokens([t.usage for t in turns])
        if should_stop_for_token_budget(settings=debate.settings, total_completion_tokens=total_tokens):
            debate.status = "completed"
            debate.updated_at = utcnow()
            db.add(debate)
            return

        judge_meta = [t.meta for t in turns if t.actor == "judge"]
        if judge_no_new_streak(judge_meta) >= 2:
            debate.status = "completed"
            debate.updated_at = utcnow()
            db.add(debate)
            return

        history = [(t.round, t.actor) for t in turns]
        step = compute_next_step(history)

        existing = db.execute(
            select(Turn).where(
                Turn.debate_id == debate_uuid, Turn.round == step.round, Turn.actor == step.actor
            )
        ).scalar_one_or_none()
        if existing is not None:
            advance_debate.apply_async(args=[debate_id], countdown=0.1)
            return

        transcript = format_transcript([(t.round, t.actor, t.content) for t in turns])
        actor: Actor = step.actor
        model = (
            settings.deepseek_model_judge if actor == "judge" else settings.deepseek_model_debater
        )
        max_tokens_key = "max_tokens_judge" if actor == "judge" else "max_tokens_debater"
        default_max = (
            settings.debate_max_tokens_judge if actor == "judge" else settings.debate_max_tokens_debater
        )
        max_tokens = int(debate.settings.get(max_tokens_key) or default_max)

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt(actor)},
            {
                "role": "user",
                "content": user_prompt(debate.topic, transcript, actor, step.round),
            },
        ]

        response_format: dict[str, Any] | None = None
        if actor == "judge":
            response_format = {"type": "json_object"}

        result = _CLIENT.chat_completion(
            model=model, messages=messages, max_tokens=max_tokens, response_format=response_format
        )

        now = utcnow()
        content = result.content.strip()
        turn_metadata = dict(result.metadata)

        if actor == "judge":
            try:
                verdict_dict = safe_parse_json_object(content)
                verdict = JudgeVerdict.model_validate(verdict_dict)
            except (ValueError, ValidationError):
                verdict = JudgeVerdict(
                    summary="Judge output was invalid JSON; unable to score reliably.",
                    score_a=0,
                    score_b=0,
                    winner="tie",
                    no_new_substantive_arguments=False,
                )
            turn_metadata.update(verdict.model_dump())
            content = _render_judge_content(verdict)

        db.add(
            Turn(
                debate_id=debate_uuid,
                round=step.round,
                actor=actor,
                content=content,
                model=result.model,
                usage=result.usage,
                meta=turn_metadata,
                created_at=now,
            )
        )

        debate.updated_at = now
        db.add(debate)

    advance_debate.apply_async(args=[debate_id], countdown=0.1)
