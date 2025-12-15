from __future__ import annotations

from datetime import datetime
from typing import Any
import uuid

from pydantic import BaseModel, Field


class DebateCreate(BaseModel):
    topic: str = Field(min_length=1)
    settings: dict[str, Any] = Field(default_factory=dict)


class DebateOut(BaseModel):
    id: uuid.UUID
    topic: str
    status: str
    settings: dict[str, Any]
    next_round: int
    next_actor: str
    stop_reason: str | None = None
    last_error: str | None = None
    created_at: datetime
    updated_at: datetime


class DebateListItem(BaseModel):
    id: uuid.UUID
    topic: str
    status: str
    next_round: int
    next_actor: str
    stop_reason: str | None = None
    last_error: str | None = None
    completed_rounds: int
    created_at: datetime
    updated_at: datetime


class TurnOut(BaseModel):
    id: uuid.UUID
    debate_id: uuid.UUID
    round: int
    actor: str
    content: str
    model: str | None
    usage: dict[str, Any]
    metadata: dict[str, Any]
    created_at: datetime


class DebateWithTurns(BaseModel):
    debate: DebateOut
    turns: list[TurnOut]


class StartResumeResponse(BaseModel):
    enqueued: bool
