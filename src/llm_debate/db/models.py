from __future__ import annotations

from typing import Any
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from llm_debate.core.time import utcnow
from llm_debate.db.base import Base


class Debate(Base):
    __tablename__ = "debates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic: Mapped[str] = mapped_column(Text(), nullable=False)
    status: Mapped[str] = mapped_column(Text(), nullable=False)
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB(), nullable=False)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    turns: Mapped[list[Turn]] = relationship(
        back_populates="debate",
        cascade="all, delete-orphan",
        order_by="Turn.created_at",
    )


class Turn(Base):
    __tablename__ = "turns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    debate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("debates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    round: Mapped[int] = mapped_column(Integer(), nullable=False)
    actor: Mapped[str] = mapped_column(Text(), nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    model: Mapped[str | None] = mapped_column(Text(), nullable=True)
    usage: Mapped[dict[str, Any]] = mapped_column(JSONB(), nullable=False, default=dict)
    meta: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB(), nullable=False, default=dict)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    debate: Mapped[Debate] = relationship(back_populates="turns")

    __table_args__ = (
        Index("ix_turns_debate_id_created_at", "debate_id", "created_at"),
        Index("ix_turns_debate_id_round_actor", "debate_id", "round", "actor"),
    )
