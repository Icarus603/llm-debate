"""create debates and turns

Revision ID: 0001
Revises:
Create Date: 2025-12-15
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "debates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "turns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("debate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("round", sa.Integer(), nullable=False),
        sa.Column("actor", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=True),
        sa.Column("usage", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index("ix_turns_debate_id_created_at", "turns", ["debate_id", "created_at"])
    op.create_index("ix_turns_debate_id_round_actor", "turns", ["debate_id", "round", "actor"])
    op.create_foreign_key(
        "fk_turns_debate_id_debates",
        source_table="turns",
        referent_table="debates",
        local_cols=["debate_id"],
        remote_cols=["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_turns_debate_id_debates", "turns", type_="foreignkey")
    op.drop_index("ix_turns_debate_id_round_actor", table_name="turns")
    op.drop_index("ix_turns_debate_id_created_at", table_name="turns")
    op.drop_table("turns")
    op.drop_table("debates")

