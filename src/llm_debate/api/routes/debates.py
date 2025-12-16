from __future__ import annotations

from collections.abc import Iterator
import json
import time
from typing import Any
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from llm_debate.api.deps import get_db, get_sessionmaker
from llm_debate.api.schemas import (
    DebateCreate,
    DebateListItem,
    DebateOut,
    DebateWithTurns,
    StartResumeResponse,
    TurnOut,
)
from llm_debate.core.settings import load_settings
from llm_debate.core.time import utcnow
from llm_debate.db.models import Debate, Turn
from llm_debate.runtime.cursor import completed_rounds_from_cursor
from llm_debate.worker.tasks import advance_debate

router = APIRouter()


def _default_settings() -> dict[str, Any]:
    settings = load_settings()
    return {
        "debater_a_side": "pro",
        "judge_mode": "end",
        "max_rounds": settings.debate_max_rounds,
        "max_runtime_seconds": settings.debate_max_runtime_seconds,
        "max_total_output_tokens": settings.debate_max_total_output_tokens,
        "max_tokens_debater": settings.debate_max_tokens_debater,
        "max_tokens_judge": settings.debate_max_tokens_judge,
    }


def _turn_out(turn: Turn) -> TurnOut:
    return TurnOut(
        id=turn.id,
        debate_id=turn.debate_id,
        round=turn.round,
        actor=turn.actor,
        content=turn.content,
        model=turn.model,
        usage=turn.usage,
        metadata=turn.meta,
        created_at=turn.created_at,
    )


@router.get("", response_model=list[DebateListItem])
def list_debates(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[DebateListItem]:
    debates = list(db.execute(select(Debate).order_by(Debate.updated_at.desc()).limit(limit)).scalars())
    items: list[DebateListItem] = []
    for d in debates:
        completed_rounds = completed_rounds_from_cursor(next_round=int(d.next_round))
        items.append(
            DebateListItem(
                id=d.id,
                topic=d.topic,
                status=d.status,
                next_round=int(d.next_round),
                next_actor=d.next_actor,
                stop_reason=d.stop_reason,
                last_error=d.last_error,
                completed_rounds=completed_rounds,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
        )
    return items


@router.post("", response_model=DebateOut, status_code=status.HTTP_201_CREATED)
def create_debate(payload: DebateCreate, db: Session = Depends(get_db)) -> DebateOut:
    merged_settings = {**_default_settings(), **payload.settings.model_dump(exclude_none=True)}
    now = utcnow()
    debate = Debate(
        topic=payload.topic,
        status="created",
        settings=merged_settings,
        next_round=1,
        next_actor="debater_a",
        created_at=now,
        updated_at=now,
    )
    db.add(debate)
    db.flush()
    return DebateOut.model_validate(debate, from_attributes=True)


@router.get("/{debate_id}", response_model=DebateWithTurns)
def get_debate(debate_id: uuid.UUID, db: Session = Depends(get_db)) -> DebateWithTurns:
    debate = db.get(Debate, debate_id)
    if debate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debate not found")

    turns = list(
        db.execute(
            select(Turn).where(Turn.debate_id == debate_id).order_by(Turn.created_at, Turn.id)
        ).scalars()
    )
    return DebateWithTurns(
        debate=DebateOut.model_validate(debate, from_attributes=True),
        turns=[_turn_out(t) for t in turns],
    )


@router.post("/{debate_id}/start", response_model=StartResumeResponse)
def start_debate(debate_id: uuid.UUID, db: Session = Depends(get_db)) -> StartResumeResponse:
    debate = db.get(Debate, debate_id)
    if debate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debate not found")

    if debate.status in {"running"}:
        return StartResumeResponse(enqueued=False)

    debate.status = "running"
    debate.settings = {**debate.settings, "started_at": utcnow().isoformat()}
    debate.updated_at = utcnow()
    db.add(debate)
    db.flush()
    advance_debate.delay(str(debate.id))
    return StartResumeResponse(enqueued=True)


@router.post("/{debate_id}/resume", response_model=StartResumeResponse)
def resume_debate(debate_id: uuid.UUID, db: Session = Depends(get_db)) -> StartResumeResponse:
    debate = db.get(Debate, debate_id)
    if debate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debate not found")

    if debate.status in {"running"}:
        return StartResumeResponse(enqueued=False)

    debate.status = "running"
    if "started_at" not in debate.settings:
        debate.settings = {**debate.settings, "started_at": utcnow().isoformat()}
    debate.updated_at = utcnow()
    db.add(debate)
    db.flush()
    advance_debate.delay(str(debate.id))
    return StartResumeResponse(enqueued=True)


@router.post("/{debate_id}/stop", status_code=status.HTTP_204_NO_CONTENT)
def stop_debate(debate_id: uuid.UUID, db: Session = Depends(get_db)) -> Response:
    debate = db.get(Debate, debate_id)
    if debate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debate not found")

    if debate.status in {"completed", "failed"}:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    debate.status = "stopping"
    debate.updated_at = utcnow()
    db.add(debate)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _sse_format(event: str, data: dict[str, Any], event_id: str | None) -> str:
    body = ""
    if event_id is not None:
        body += f"id: {event_id}\n"
    body += f"event: {event}\n"
    body += f"data: {json.dumps(data, separators=(',', ':'))}\n\n"
    return body


@router.get("/{debate_id}/events")
def stream_debate_events(
    debate_id: uuid.UUID,
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
    after: str | None = Query(default=None, description="Turn id to start after"),
) -> StreamingResponse:
    start_after = after or last_event_id
    sessionmaker = get_sessionmaker()

    def iter_events() -> Iterator[bytes]:
        last_seen_created_at = None
        last_seen_turn_id: uuid.UUID | None = None
        with sessionmaker() as db:
            debate = db.get(Debate, debate_id)
            if debate is None:
                payload = _sse_format("error", {"detail": "Debate not found"}, None)
                yield payload.encode("utf-8")
                return

            if start_after is not None:
                try:
                    turn = db.get(Turn, uuid.UUID(start_after))
                except ValueError:
                    turn = None
                if turn is not None and turn.debate_id == debate_id:
                    last_seen_created_at = turn.created_at
                    last_seen_turn_id = turn.id

        while True:
            with sessionmaker() as db:
                query = (
                    select(Turn)
                    .where(Turn.debate_id == debate_id)
                    .order_by(Turn.created_at, Turn.id)
                )
                if last_seen_created_at is not None and last_seen_turn_id is not None:
                    query = query.where(
                        or_(
                            Turn.created_at > last_seen_created_at,
                            and_(
                                Turn.created_at == last_seen_created_at,
                                Turn.id > last_seen_turn_id,
                            ),
                        )
                    )
                new_turns = list(db.execute(query).scalars())

                for t in new_turns:
                    last_seen_created_at = t.created_at
                    last_seen_turn_id = t.id
                    turn_payload = _turn_out(t).model_dump(mode="json")
                    yield _sse_format("turn", turn_payload, str(t.id)).encode("utf-8")

            time.sleep(1.0)

    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive"}
    return StreamingResponse(iter_events(), media_type="text/event-stream", headers=headers)
