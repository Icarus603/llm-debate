from __future__ import annotations

from typing import Any, cast
import uuid

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql.dml import Insert
from sqlalchemy.sql.schema import Table

from llm_debate.db.models import Turn


def build_insert_turn_idempotent_stmt(*, turn_id: uuid.UUID | None = None, values: dict[str, Any]) -> Insert:
    """
    Build a Postgres INSERT for a Turn that is idempotent for (debate_id, round, actor).

    The statement uses ON CONFLICT DO NOTHING and returns the inserted row id.
    """

    payload = dict(values)
    if turn_id is not None:
        payload["id"] = turn_id

    return (
        pg_insert(cast(Table, Turn.__table__))
        .values(**payload)
        .on_conflict_do_nothing(index_elements=["debate_id", "round", "actor"])
        .returning(Turn.id)
    )
