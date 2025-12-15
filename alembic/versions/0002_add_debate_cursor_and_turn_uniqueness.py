"""add debate cursor and turn uniqueness

Revision ID: 0002
Revises: 0001
Create Date: 2025-12-15
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "debates",
        sa.Column("next_round", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "debates",
        sa.Column(
            "next_actor",
            sa.Text(),
            nullable=False,
            server_default=sa.text("'debater_a'"),
        ),
    )
    op.add_column("debates", sa.Column("stop_reason", sa.Text(), nullable=True))
    op.add_column("debates", sa.Column("last_error", sa.Text(), nullable=True))

    op.create_unique_constraint(
        "uq_turns_debate_id_round_actor",
        "turns",
        ["debate_id", "round", "actor"],
    )

    op.execute(
        """
        WITH latest AS (
            SELECT DISTINCT ON (t.debate_id)
                t.debate_id,
                t.round AS last_round,
                t.actor AS last_actor
            FROM turns t
            ORDER BY t.debate_id, t.created_at DESC, t.id DESC
        )
        UPDATE debates d
        SET
            next_round = CASE
                WHEN l.last_actor = 'judge' THEN l.last_round + 1
                ELSE l.last_round
            END,
            next_actor = CASE
                WHEN l.last_actor = 'debater_a' THEN 'debater_b'
                WHEN l.last_actor = 'debater_b' THEN 'judge'
                ELSE 'debater_a'
            END
        FROM latest l
        WHERE d.id = l.debate_id
        """
    )


def downgrade() -> None:
    op.drop_constraint("uq_turns_debate_id_round_actor", "turns", type_="unique")
    op.drop_column("debates", "last_error")
    op.drop_column("debates", "stop_reason")
    op.drop_column("debates", "next_actor")
    op.drop_column("debates", "next_round")

