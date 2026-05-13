# Data Model: 016-browser-notifications

## Entity: UserNotification

Stores a fired reminder as a persistent notification record so the frontend can poll and display it.

### SQLModel Definition

```python
class UserNotification(SQLModel, table=True):
    __tablename__ = "user_notifications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    task_title: str = Field(max_length=500, nullable=False)
    message: str = Field(nullable=False)
    is_read: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
```

### Indexes

- `(user_id, is_read)` — composite index for efficient unread polling queries
- `id` — primary key

### Relationships

- No FK to `users` table (same pattern as `Task` model — Better Auth owns user DDL)
- Linked to tasks logically via `task_title` string (no FK to tasks table — task may be deleted)

### Alembic Migration: 003_add_notifications_table

```python
# migrations/versions/003_add_notifications_table.py
def upgrade():
    op.create_table(
        "user_notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("task_title", sa.String(500), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_user_notifications_user_is_read",
                    "user_notifications", ["user_id", "is_read"])

def downgrade():
    op.drop_index("ix_user_notifications_user_is_read")
    op.drop_table("user_notifications")
```
