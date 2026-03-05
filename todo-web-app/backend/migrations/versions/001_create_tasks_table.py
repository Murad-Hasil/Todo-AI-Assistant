# [Task]: T-2.1.3
"""Create tasks table with indexes.

Revision ID: 001
Revises:
Create Date: 2026-03-03
"""
import uuid
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_tasks_user_id", "tasks", ["user_id"])
    op.create_index("idx_tasks_completed", "tasks", ["completed"])
    op.create_index("idx_tasks_user_completed", "tasks", ["user_id", "completed"])


def downgrade() -> None:
    op.drop_index("idx_tasks_user_completed", table_name="tasks")
    op.drop_index("idx_tasks_completed", table_name="tasks")
    op.drop_index("idx_tasks_user_id", table_name="tasks")
    op.drop_table("tasks")
