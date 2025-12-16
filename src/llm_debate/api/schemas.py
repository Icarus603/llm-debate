from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
import uuid

from pydantic import BaseModel, ConfigDict, Field

DebaterSide = Literal["pro", "con"]
JudgeMode = Literal["end"]


class DebateSettingsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    debater_a_side: DebaterSide | None = Field(
        default=None, description='Debater A stance: "pro" or "con".'
    )
    max_rounds: int | None = Field(default=None, ge=1, le=100)
    max_runtime_seconds: int | None = Field(default=None, ge=1, le=60 * 60)
    max_total_output_tokens: int | None = Field(default=None, ge=1, le=200_000)
    max_tokens_debater: int | None = Field(default=None, ge=1, le=20_000)
    max_tokens_judge: int | None = Field(default=None, ge=1, le=20_000)
    model_debater: str | None = Field(default=None, min_length=1)
    model_judge: str | None = Field(default=None, min_length=1)
    prompt_version: str | None = Field(default=None, min_length=1)
    judge_mode: JudgeMode | None = Field(
        default=None, description='Judge scheduling mode (default "end").'
    )


class DebateCreate(BaseModel):
    topic: str = Field(min_length=1)
    settings: DebateSettingsIn = Field(default_factory=DebateSettingsIn)


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
