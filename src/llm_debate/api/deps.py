from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker

from llm_debate.db.engine import create_db_engine, create_sessionmaker, session_scope

_ENGINE = create_db_engine()
_SESSIONMAKER: sessionmaker[Session] = create_sessionmaker(_ENGINE)


def get_sessionmaker() -> sessionmaker[Session]:
    """Return the process-wide SQLAlchemy sessionmaker."""

    return _SESSIONMAKER


def get_db() -> Generator[Session, None, None]:
    """Provide a SQLAlchemy session with commit/rollback semantics."""

    with session_scope(_SESSIONMAKER) as session:
        yield session
