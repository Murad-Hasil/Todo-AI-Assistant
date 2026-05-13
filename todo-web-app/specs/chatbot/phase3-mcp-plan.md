# Implementation Plan: Phase 3.1 — Database Evolution & MCP Server

**Branch**: `005-chatbot-db-mcp` | **Date**: 2026-03-03
**Spec**: `todo-web-app/specs/chatbot/spec.md`
**SDD Index**: `specs/005-chatbot-db-mcp/plan.md`

---

## Summary

Phase 3.1 introduces the data persistence layer and AI tool boundary for the
Phase 3 chatbot. It consists of three tightly scoped deliverables:

1. **Database migration** — two new Neon PostgreSQL tables (`conversations`,
   `messages`) via Alembic, without touching Phase 2 tables (`tasks`, Better Auth).
2. **Service layer extraction** — `app/services/tasks.py` extracts the five CRUD
   operations from `routes/tasks.py` into pure functions callable by both the REST
   routes and the MCP tools.
3. **MCP server** — `app/mcp/server.py` wraps the service layer in five typed MCP
   tools using the official `FastMCP` API. Tested standalone via `mcp dev`.

Phase 3.2 (AI agent orchestration + `/api/chat` endpoint) depends on this plan and
is out of scope here.

---

## Technical Context

| Attribute          | Value                                                    |
|--------------------|----------------------------------------------------------|
| Language/Version   | Python 3.13                                              |
| Primary Deps       | FastAPI 0.115+, SQLModel 0.0.21+, Alembic 1.13+, `mcp[cli]>=1.0.0` |
| Storage            | Neon Serverless PostgreSQL (via `DATABASE_URL` env var)  |
| ORM                | SQLModel (SQLAlchemy + Pydantic)                         |
| Testing            | `mcp dev` inspector, `scripts/test_mcp_tools.py` (no pytest for Phase 3.1) |
| Target Platform    | Linux server (same host as Phase 2 FastAPI service)      |
| Performance Goals  | MCP tool calls < 500ms p95 (single-user, <100 tasks)     |
| Constraints        | Phase 2 tables MUST NOT be modified; no in-memory state  |

---

## Constitution Check

*GATE: Must pass before implementation begins.*

- [x] **I. Spec-Driven Development** — Spec and plan approved; all code refs this plan.
- [x] **II. Read-Before-Write** — Phase 2 code fully audited before designing Phase 3.
- [x] **III. Non-Destructive Integration** — New tables only; routes/tasks.py: minimal
      refactor (service extraction only — HTTP behaviour unchanged).
- [x] **IV. API-First Architecture** — MCP tools are the formal API boundary between AI
      and data; all tool I/O validated via Pydantic.
- [x] **V. Multi-User Data Isolation** — Every MCP tool accepts `user_id` and enforces
      user-scoped DB queries.
- [x] **VI. JWT Security Contract** — Phase 3.1 has no HTTP endpoints; JWT enforcement
      is Phase 3.2's responsibility. MCP tools trust the `user_id` passed by the agent.
- [x] **VII. Monorepo Pattern** — No new top-level directories; new dirs within `backend/app/`.
- [x] **VIII. Code Quality Standards** — PEP8, Black (88 chars), type hints on all functions.
- [x] **IX. Stateless AI Request Cycle** — `Conversation` + `Message` tables designed for
      full history retrieval per request; no in-memory session cache.
- [x] **X. MCP Tool Enforcement** — Tools are the ONLY interface between agent and tasks DB.
- [x] **XI. Agent Behavior Contract** — Implemented in Phase 3.2; tools return structured
      `{"success": bool, ...}` for agent-friendly error handling.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-chatbot-db-mcp/
├── spec.md              # SDD root index (artifact table)
├── plan.md              # This plan (SDD root)
├── research.md          # Phase 0 findings (7 key decisions)
├── data-model.md        # Conversation + Message entities
├── quickstart.md        # Verification guide
└── contracts/
    └── mcp-tools.json   # JSON Schema tool contracts
todo-web-app/specs/chatbot/
├── spec.md              # Feature spec (user stories, FRs, success criteria)
├── database.md          # DB schema detail
├── mcp-tools.md         # Tool parameter/return prose specs
├── behavior.md          # Agent trigger + Roman Urdu rules
└── phase3-mcp-plan.md   # This file
```

### Source Code Changes

```text
todo-web-app/backend/
├── pyproject.toml                          # Add: mcp[cli]>=1.0.0
├── app/
│   ├── models.py                           # ADD: Conversation, Message, MessageRole
│   ├── schemas.py                          # ADD: ConversationRead, MessageRead, ChatToolResult
│   ├── services/                           # NEW directory
│   │   ├── __init__.py                     # NEW (empty)
│   │   └── tasks.py                        # NEW: 5 pure service functions
│   ├── mcp/                                # NEW directory
│   │   ├── __init__.py                     # NEW (empty)
│   │   └── server.py                       # NEW: FastMCP instance + 5 @mcp.tool() handlers
│   └── routes/
│       └── tasks.py                        # REFACTOR: thin HTTP adapters (call services/tasks.py)
├── migrations/versions/
│   └── 002_add_conversations_messages.py   # NEW: Alembic migration
└── scripts/
    └── test_mcp_tools.py                   # NEW: standalone verification script
```

---

## Phase 0: Research Findings

Full details in `specs/005-chatbot-db-mcp/research.md`. Key decisions:

1. **No `logic.py` exists** → create `app/services/tasks.py` (minimum viable extraction).
2. **`user_id` is `str`** (not UUID) in all models — matches Better Auth pattern.
3. **Migration convention**: sequential numeric IDs (`002`, `down_revision = "001"`).
4. **MCP SDK**: `FastMCP` from `mcp[cli]` package — supports `mcp dev` inspector.
5. **Error contract**: Service functions return `None` (not-found); MCP tools convert to `{"success": false}`.
6. **`complete_task` = set-to-true** (idempotent), not toggle (REST uses toggle).
7. **Conversation scope**: optional `conversation_id` per request (Phase 3.2 concern).

---

## Phase 1: Detailed Implementation Design

### Step 1 — `app/models.py`: Add `Conversation` and `Message`

Append to the existing file. Do NOT alter the `Task` model.

```python
# --- Phase 3.1 additions ---

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False
    )
    user_id: str = Field(nullable=False, index=True)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False,
            server_default=func.now(), onupdate=func.now()
        ),
    )
    messages: list["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False
    )
    conversation_id: uuid.UUID = Field(
        foreign_key="conversations.id", nullable=False, index=True
    )
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(max_length=20, nullable=False)   # MessageRole.value
    content: str = Field(nullable=False, sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    conversation: Conversation = Relationship(back_populates="messages")
```

**Required imports to add**: `Enum`, `Text` from `sqlalchemy`, `Relationship` from `sqlmodel`.

---

### Step 2 — `migrations/versions/002_add_conversations_messages.py`

New Alembic migration. Pattern follows `001_create_tasks_table.py` exactly.

```python
"""Add conversations and messages tables.

Revision ID: 002
Revises: 001
Create Date: 2026-03-03
"""
import uuid
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: str = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # conversations first (messages FKs to it)
    op.create_table(
        "conversations",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_conversations_user_id", "conversations", ["user_id"])

    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.CheckConstraint("role IN ('user', 'assistant')", name="ck_messages_role"),
    )
    op.create_index("idx_messages_conversation_created", "messages", ["conversation_id", "created_at"])
    op.create_index("idx_messages_user_id", "messages", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_messages_user_id", table_name="messages")
    op.drop_index("idx_messages_conversation_created", table_name="messages")
    op.drop_table("messages")
    op.drop_index("idx_conversations_user_id", table_name="conversations")
    op.drop_table("conversations")
```

---

### Step 3 — `app/services/tasks.py`: Service Layer Extraction

**New file**. Contains five pure functions that accept `(session: Session, user_id: str, ...)`.
Route handlers and MCP tools import from this module.

```python
"""
Task service layer — pure functions callable by REST routes and MCP tools.

Each function:
  - Accepts a SQLModel Session (injected by caller)
  - Returns a domain object or None (never raises HTTPException)
  - Enforces user_id scoping on every query
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.models import Task
from app.schemas import StatusFilter


def get_task_for_user(session: Session, user_id: str, task_id: uuid.UUID) -> Task | None:
    return session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()


def service_list_tasks(
    session: Session, user_id: str, status: StatusFilter = StatusFilter.ALL
) -> list[Task]:
    query = select(Task).where(Task.user_id == user_id)
    if status == StatusFilter.PENDING:
        query = query.where(Task.completed == False)  # noqa: E712
    elif status == StatusFilter.COMPLETED:
        query = query.where(Task.completed == True)  # noqa: E712
    query = query.order_by(Task.created_at.desc())
    return list(session.exec(query).all())


def service_create_task(
    session: Session, user_id: str, title: str, description: Optional[str] = None
) -> Task:
    task = Task(user_id=user_id, title=title, description=description)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def service_complete_task(
    session: Session, user_id: str, task_id: uuid.UUID
) -> Task | None:
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    task.completed = True
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def service_delete_task(
    session: Session, user_id: str, task_id: uuid.UUID
) -> uuid.UUID | None:
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    task_id_out = task.id
    session.delete(task)
    session.commit()
    return task_id_out


def service_update_task(
    session: Session,
    user_id: str,
    task_id: uuid.UUID,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> Task | None:
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    if title is not None:
        task.title = title
    if description is not None:
        task.description = description or None
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

**`routes/tasks.py` refactor**: Replace inline DB logic with calls to the service
functions above. Helper `_get_task_or_404` calls `get_task_for_user` and raises 404
if `None`. No HTTP behaviour changes — all existing endpoints retain identical request/response contracts.

---

### Step 4 — `app/mcp/server.py`: MCP Server with FastMCP

```python
"""
MCP server exposing Todo CRUD as typed agent tools.

Run standalone:   uv run mcp dev app/mcp/server.py
Import by agent:  from app.mcp.server import mcp  (FastMCP instance)

Each tool:
  - Accepts user_id as a required parameter (constitution Principle V + X)
  - Creates its own DB session (stateless — constitution Principle IX)
  - Returns {"success": bool, ...} dict (constitution Principle XI)
  - Raises no FastAPI or HTTP exceptions
"""
import uuid
from typing import Optional

from mcp.server.fastmcp import FastMCP
from sqlmodel import Session

from app.db import engine
from app.models import MessageRole
from app.schemas import StatusFilter
from app.services.tasks import (
    service_complete_task,
    service_create_task,
    service_delete_task,
    service_list_tasks,
    service_update_task,
)

mcp = FastMCP("todo-mcp-server")


def _get_session() -> Session:
    return Session(engine)


@mcp.tool()
def add_task(user_id: str, title: str, description: Optional[str] = None) -> dict:
    """Creates a new task for the authenticated user."""
    if not title or not title.strip():
        return {"success": False, "error": "Task title cannot be empty."}
    if len(title) > 200:
        return {"success": False, "error": "Task title too long (max 200 chars)."}
    with _get_session() as session:
        task = service_create_task(session, user_id, title.strip(), description)
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "user_id": task.user_id,
            "created_at": task.created_at.isoformat(),
        },
    }


@mcp.tool()
def list_tasks(user_id: str, status: str = "all") -> dict:
    """Lists tasks for the authenticated user, optionally filtered by status."""
    status_map = {"all": StatusFilter.ALL, "pending": StatusFilter.PENDING, "completed": StatusFilter.COMPLETED}
    if status not in status_map:
        return {"success": False, "error": "Invalid status filter. Use: all, pending, completed."}
    with _get_session() as session:
        tasks = service_list_tasks(session, user_id, status_map[status])
    return {
        "success": True,
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in tasks
        ],
        "count": len(tasks),
    }


@mcp.tool()
def complete_task(user_id: str, task_id: str) -> dict:
    """Marks a task as completed (idempotent — always sets completed=true)."""
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        task = service_complete_task(session, user_id, tid)
    if not task:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat(),
        },
    }


@mcp.tool()
def delete_task(user_id: str, task_id: str) -> dict:
    """Permanently removes a task. Irreversible."""
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        deleted_id = service_delete_task(session, user_id, tid)
    if not deleted_id:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "deleted_task_id": str(deleted_id),
        "message": "Task deleted successfully.",
    }


@mcp.tool()
def update_task(
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """Updates the title and/or description of a task."""
    if title is None and description is None:
        return {"success": False, "error": "Provide at least title or description to update."}
    if title is not None and not title.strip():
        return {"success": False, "error": "Task title cannot be empty."}
    if title is not None and len(title) > 200:
        return {"success": False, "error": "Task title too long (max 200 chars)."}
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        task = service_update_task(session, user_id, tid, title, description)
    if not task:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat(),
        },
    }
```

---

### Step 5 — `pyproject.toml`: Add `mcp[cli]`

```toml
dependencies = [
    ...
    "mcp[cli]>=1.0.0",    # Official MCP SDK + mcp dev inspector
]
```

---

## Complexity Tracking

> **No constitution violations.** All gates pass cleanly.

---

## Risks and Follow-ups

1. **`mcp` package compatibility** — Verify `mcp[cli]>=1.0.0` installs cleanly with
   Python 3.13 and the existing `uv` lockfile. If a conflict arises, pin to a tested
   version.
2. **`routes/tasks.py` refactor scope** — The service extraction must not change any
   HTTP behaviour. Run Phase 2 tests after refactor to confirm zero regressions.
3. **Phase 3.2 dependency** — The MCP server's `_get_session()` helper opens a new
   session per tool call. Phase 3.2 may need to pass a session from the FastAPI
   request context for transaction consistency in multi-tool agent turns. Design
   Phase 3.2 with this in mind.
