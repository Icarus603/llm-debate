from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Callable, cast
import uuid

from sqlalchemy.dialects import postgresql

from llm_debate.db.turn_writes import build_insert_turn_idempotent_stmt


def test_insert_turn_is_idempotent() -> None:
    stmt = build_insert_turn_idempotent_stmt(
        values={
            "debate_id": uuid.uuid4(),
            "round": 1,
            "actor": "debater_a",
            "content": "hello",
            "model": "deepseek-chat",
            "usage": {"completion_tokens": 1},
            "metadata": {},
            "created_at": datetime.now(tz=UTC),
        }
    )
    dialect_factory = cast(Callable[[], Any], postgresql.dialect)
    sql = str(stmt.compile(dialect=dialect_factory()))
    assert "ON CONFLICT" in sql
    assert "DO NOTHING" in sql
    assert "RETURNING" in sql
