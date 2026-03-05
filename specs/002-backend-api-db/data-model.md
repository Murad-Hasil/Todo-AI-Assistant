# Data Model: Phase 2.1 — Backend API & Database

**Feature**: `002-backend-api-db`
**Phase**: 1 — Design
**Date**: 2026-03-03

---

## Entity Overview

| Entity | Owner | Stored In | Managed By |
|--------|-------|-----------|------------|
| `User` | Better Auth | `users` table | Better Auth (not backend) |
| `Task` | Backend service | `tasks` table | SQLModel / Alembic |

---

## Task Entity (Primary)

### Fields

| Field | Python Type | DB Column | Default | Constraints |
|-------|------------|-----------|---------|-------------|
| `id` | `uuid.UUID` | `UUID PK` | `uuid4()` | PK, non-null |
| `user_id` | `str` | `VARCHAR NOT NULL` | — | Required, indexed |
| `title` | `str` | `VARCHAR(200) NOT NULL` | — | 1–200 chars |
| `description` | `str \| None` | `TEXT NULLABLE` | `None` | max 1000 chars |
| `completed` | `bool` | `BOOLEAN NOT NULL` | `False` | — |
| `created_at` | `datetime` | `TIMESTAMPTZ NOT NULL` | `utcnow()` | Set once on insert |
| `updated_at` | `datetime` | `TIMESTAMPTZ NOT NULL` | `utcnow()` | Updated on every write |

### SQLModel Class Sketch

```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(nullable=False, index=True)
    title: str = Field(nullable=False, max_length=200)
    description: str | None = Field(default=None, nullable=True)
    completed: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )
```

---

## Pydantic Schemas

### Request Schemas (Input)

```python
class TaskCreate(BaseModel):
    """Used for POST /api/{user_id}/tasks"""
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)

class TaskUpdate(BaseModel):
    """Used for PUT /api/{user_id}/tasks/{id} — full replacement"""
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
```

### Response Schemas (Output)

```python
class TaskRead(BaseModel):
    """Serialised Task returned in all responses"""
    id: uuid.UUID
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TaskSingleResponse(BaseModel):
    """Wraps single task: { data: Task }"""
    data: TaskRead

class TaskListResponse(BaseModel):
    """Wraps task list: { data: [Task], meta: { total: N } }"""
    data: list[TaskRead]
    meta: dict[str, int]  # {"total": N}
```

---

## Query Parameter Enums

```python
class StatusFilter(str, Enum):
    ALL       = "all"
    PENDING   = "pending"
    COMPLETED = "completed"

class SortOrder(str, Enum):
    CREATED  = "created"    # ORDER BY created_at ASC
    TITLE    = "title"      # ORDER BY title ASC
    DUE_DATE = "due_date"   # Alias for "created" in Phase 2.1
```

---

## State Transitions

```
Task Created
    │
    ▼
completed = False  ◄──── PATCH /complete
    │                         │
    └──── PATCH /complete ────►  completed = True
    │
    ▼
PUT update: title/description (completed not affected)
    │
    ▼
DELETE: permanent removal
```

---

## Indexes (from `database/schema.md`)

| Index | Column(s) | Query Pattern Served |
|-------|-----------|---------------------|
| `idx_tasks_user_id` | `user_id` | All task list queries |
| `idx_tasks_completed` | `completed` | Status filter on full table scans |
| `idx_tasks_user_completed` | `(user_id, completed)` | Combined user + status filter (dominant pattern) |

---

## Validation Rules Summary

| Field | Rule | Enforcement Layer |
|-------|------|-------------------|
| `title` | 1–200 chars, non-empty | Pydantic `Field(min_length=1, max_length=200)` |
| `description` | max 1000 chars, optional | Pydantic `Field(max_length=1000)` |
| `status` param | one of: all, pending, completed | FastAPI Enum query param |
| `sort` param | one of: created, title, due_date | FastAPI Enum query param |
| `user_id` path | must match JWT sub claim | Route handler assertion → HTTP 403 |
| Task ownership | task.user_id == current_user_id | SQLModel WHERE clause → HTTP 404 |
