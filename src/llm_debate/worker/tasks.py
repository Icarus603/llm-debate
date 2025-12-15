from __future__ import annotations

from typing import Any, Literal
import uuid

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from llm_debate.core.settings import load_settings
from llm_debate.core.time import utcnow
from llm_debate.db.engine import create_db_engine, create_sessionmaker, session_scope
from llm_debate.db.models import Debate, Turn
from llm_debate.db.turn_writes import build_insert_turn_idempotent_stmt
from llm_debate.llm.deepseek import DeepSeekClient, safe_parse_json_object
from llm_debate.runtime.cursor import cursor_after_step, cursor_from_last_turn
from llm_debate.runtime.prompts import format_transcript, system_prompt, user_prompt
from llm_debate.runtime.steps import (
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
StopReason = Literal[
    "manual_stop",
    "max_rounds",
    "max_runtime_seconds",
    "max_total_output_tokens",
    "judge_early_stop",
    "error",
]


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


def _lock_debate(db: Session, debate_id: uuid.UUID) -> Debate | None:
    stmt = select(Debate).where(Debate.id == debate_id).with_for_update(skip_locked=True)
    return db.execute(stmt).scalar_one_or_none()


def _set_completed(*, debate: Debate, now: Any, reason: StopReason) -> None:
    debate.status = "completed"
    debate.stop_reason = reason
    debate.updated_at = now


def _set_stopped(*, debate: Debate, now: Any) -> None:
    debate.status = "stopped"
    debate.stop_reason = "manual_stop"
    debate.updated_at = now


@celery_app.task(bind=True, max_retries=3)  # type: ignore[untyped-decorator]
def advance_debate(self: Any, debate_id: str) -> None:
    settings = load_settings()
    debate_uuid = _ensure_uuid(debate_id)

    try:
        with session_scope(_SESSIONMAKER) as db:
            debate = _lock_debate(db, debate_uuid)
            if debate is None:
                return

            now = utcnow()

            if debate.status == "stopping":
                _set_stopped(debate=debate, now=now)
                db.add(debate)
                return

            if debate.status != "running":
                return

            turns = list(
                db.execute(
                    select(Turn)
                    .where(Turn.debate_id == debate_uuid)
                    .order_by(Turn.created_at, Turn.id)
                ).scalars()
            )

            last_turn = turns[-1] if turns else None
            turn_tuples = [(t.round, t.actor, t.content) for t in turns]
            if debate.next_actor not in {"debater_a", "debater_b", "judge"} or debate.next_round < 1:
                next_round, next_actor = cursor_from_last_turn(
                    last_round=last_turn.round if last_turn is not None else None,
                    last_actor=last_turn.actor if last_turn is not None else None,
                )
                debate.next_round = next_round
                debate.next_actor = next_actor

            completed_rounds = int(debate.next_round) - 1
            if should_stop_for_rounds(settings=debate.settings, completed_rounds=completed_rounds):
                _set_completed(debate=debate, now=now, reason="max_rounds")
                db.add(debate)
                return

            if should_stop_for_runtime(settings=debate.settings, created_at=debate.created_at):
                _set_completed(debate=debate, now=now, reason="max_runtime_seconds")
                db.add(debate)
                return

            total_tokens = sum_completion_tokens([t.usage for t in turns])
            if should_stop_for_token_budget(
                settings=debate.settings, total_completion_tokens=total_tokens
            ):
                _set_completed(debate=debate, now=now, reason="max_total_output_tokens")
                db.add(debate)
                return

            judge_meta = [t.meta for t in turns if t.actor == "judge"]
            if judge_no_new_streak(judge_meta) >= 2:
                _set_completed(debate=debate, now=now, reason="judge_early_stop")
                db.add(debate)
                return

            actor: Actor = debate.next_actor  # type: ignore[assignment]
            step_round = int(debate.next_round)
            topic = debate.topic
            debate_settings = dict(debate.settings)
            db.add(debate)

        transcript = format_transcript(turn_tuples)
        model = settings.deepseek_model_judge if actor == "judge" else settings.deepseek_model_debater
        max_tokens_key = "max_tokens_judge" if actor == "judge" else "max_tokens_debater"
        default_max = (
            settings.debate_max_tokens_judge if actor == "judge" else settings.debate_max_tokens_debater
        )
        max_tokens = int(debate_settings.get(max_tokens_key) or default_max)

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt(actor)},
            {"role": "user", "content": user_prompt(topic, transcript, actor, step_round)},
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

        should_enqueue = False
        with session_scope(_SESSIONMAKER) as db:
            debate = _lock_debate(db, debate_uuid)
            if debate is None:
                return

            if debate.status == "stopping":
                _set_stopped(debate=debate, now=now)
                db.add(debate)
                return

            if debate.status != "running":
                return

            if int(debate.next_round) != step_round or debate.next_actor != actor:
                should_enqueue = True
                return

            stmt = (
                build_insert_turn_idempotent_stmt(
                    values={
                        "debate_id": debate_uuid,
                        "round": step_round,
                        "actor": actor,
                        "content": content,
                        "model": result.model,
                        "usage": result.usage,
                        "metadata": turn_metadata,
                        "created_at": now,
                    }
                )
            )
            inserted_id = db.execute(stmt).scalar_one_or_none()

            if inserted_id is None:
                turns = list(
                    db.execute(
                        select(Turn)
                        .where(Turn.debate_id == debate_uuid)
                        .order_by(Turn.created_at, Turn.id)
                    ).scalars()
                )
                last_turn = turns[-1] if turns else None
                next_round, next_actor = cursor_from_last_turn(
                    last_round=last_turn.round if last_turn is not None else None,
                    last_actor=last_turn.actor if last_turn is not None else None,
                )
                debate.next_round = next_round
                debate.next_actor = next_actor
            else:
                next_round, next_actor = cursor_after_step(
                    next_round=int(debate.next_round),
                    next_actor=actor,
                    persisted_actor=actor,
                )
                debate.next_round = next_round
                debate.next_actor = next_actor

            debate.last_error = None
            debate.updated_at = now
            db.add(debate)
            should_enqueue = debate.status == "running"

        if should_enqueue:
            advance_debate.apply_async(args=[debate_id], countdown=0.1)

    except Exception as exc:
        now = utcnow()
        with session_scope(_SESSIONMAKER) as db:
            debate = _lock_debate(db, debate_uuid)
            if debate is not None:
                debate.last_error = repr(exc)
                debate.updated_at = now
                retries = int(getattr(self.request, "retries", 0))
                if retries >= int(self.max_retries):
                    debate.status = "failed"
                    debate.stop_reason = "error"
                db.add(debate)

        retries = int(getattr(self.request, "retries", 0))
        if retries < int(self.max_retries):
            raise self.retry(exc=exc, countdown=min(60, 2**retries)) from exc
        raise
