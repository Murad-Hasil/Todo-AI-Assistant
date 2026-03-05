# Tasks: Phase 3.1 — Database Evolution & MCP Server

**Feature**: `005-chatbot-db-mcp` | **Branch**: `005-chatbot-db-mcp`
**Plan**: `todo-web-app/specs/chatbot/phase3-mcp-plan.md`
**Spec**: `todo-web-app/specs/chatbot/spec.md`
**Date**: 2026-03-03

**Format**: `[TaskID] [P?] [Story?] Description — file path`
- **[P]**: Parallelizable (different files, no blocking dependencies)
- **[US1]**: User Story 1 — Stateless Conversation Persistence
- **[US2]**: User Story 2 — MCP-Mediated Task Management

---

## Phase 1: Setup (Prerequisites)

**Purpose**: Install dependencies and create directory scaffolding before any
feature code is written.

**⚠️ CRITICAL**: All Phase 2–4 tasks depend on this phase being complete first.

- [x] T-3.0.1 Add `mcp[cli]>=1.0.0` to the `[project.dependencies]` section in `todo-web-app/backend/pyproject.toml`; run `uv lock` to regenerate the lockfile and confirm the package resolves without conflicts
- [x] T-3.0.2 [P] Create `todo-web-app/backend/app/services/__init__.py` (empty file; marks `services/` as a Python package)
- [x] T-3.0.3 [P] Create `todo-web-app/backend/app/mcp/__init__.py` (empty file; marks `mcp/` as a Python package)

**Checkpoint**: `mcp[cli]` installed; `app/services/` and `app/mcp/` are importable Python packages.

---

## Phase 2: Database Evolution — Conversation Persistence (Priority: P1) 🎯

**Goal**: Add `conversations` and `messages` tables to the Neon PostgreSQL database
without touching any Phase 2 tables (`tasks`, Better Auth tables).

**Independent Test** (SC-002 / T-3.1.3):
`conversations` and `messages` tables are visible in the Neon DB console or via
`psql -c "\dt"` after running the migration. Zero errors; zero modifications to
existing tables.

**User Story**: US1 — Stateless Conversation Persistence

### Implementation for Phase 2 (Database Evolution)

- [x] T-3.1.1 [US1] Append `MessageRole` enum, `Conversation` SQLModel, and required imports (`Enum`, `Relationship`, `Text`, `func`, `Column`) to `todo-web-app/backend/app/models.py`

  **Exact additions** (append after the existing `Task` model; do NOT modify it):
  ```python
  # [Task]: T-3.1.1
  import uuid
  from enum import Enum
  from sqlalchemy import Column, DateTime, Text
  from sqlalchemy.sql import func
  from sqlmodel import Relationship

  class MessageRole(str, Enum):
      USER = "user"
      ASSISTANT = "assistant"

  class Conversation(SQLModel, table=True):
      __tablename__ = "conversations"
      id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
      user_id: str = Field(nullable=False, index=True)
      created_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()))
      updated_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()))
      messages: list["Message"] = Relationship(back_populates="conversation")
  ```
  Verify: `python -c "from app.models import Conversation; print('OK')"` runs without error.

- [x] T-3.1.2 [US1] Append `Message` SQLModel to `todo-web-app/backend/app/models.py` (after `Conversation`, before EOF)

  **Exact addition** (depends on T-3.1.1 — `Conversation` must exist first):
  ```python
  # [Task]: T-3.1.2
  class Message(SQLModel, table=True):
      __tablename__ = "messages"
      id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
      conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False, index=True)
      user_id: str = Field(nullable=False, index=True)
      role: str = Field(max_length=20, nullable=False)   # MessageRole.value
      content: str = Field(nullable=False, sa_column=Column(Text, nullable=False))
      created_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()))
      conversation: Conversation = Relationship(back_populates="messages")
  ```
  Verify: `python -c "from app.models import Message; print('OK')"` runs without error.

- [x] T-3.1.3 [US1] Create Alembic migration `todo-web-app/backend/migrations/versions/002_add_conversations_messages.py` and run it against the Neon DB

  **Migration file content** — create a new file (do NOT edit `001_create_tasks_table.py`):
  ```python
  # [Task]: T-3.1.3
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

  **Run migration** from `todo-web-app/backend/`:
  ```bash
  uv run alembic upgrade head
  ```

  **Verification** (SC-002): Confirm via `postgres` MCP tool or DB console that
  `conversations` and `messages` tables exist and `tasks` / Better Auth tables are
  unmodified. Expected: `alembic_version` row shows `002`.

**Checkpoint (US1 complete)**: `conversations` and `messages` tables exist in Neon.
The migration runs without error on a clean Phase 2 database.

---

## Phase 3: Logic Refactoring (Foundational for MCP) — Priority: P1

**Purpose**: Extract task CRUD logic from `routes/tasks.py` into a shared
`app/services/tasks.py` module. This is the single blocking prerequisite before
any MCP tool implementation can begin (T-3.1.5 through T-3.1.9 all import from it).

**⚠️ CRITICAL**: This refactor MUST NOT change any HTTP request/response behaviour.
All existing REST endpoints must continue to behave identically.

**Independent Test**: Run the existing Phase 2 test suite (or manually exercise
`GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/{id}`, `DELETE /api/tasks/{id}`)
and confirm zero regressions.

- [x] T-3.1.4 [US2] Create `todo-web-app/backend/app/services/tasks.py` with 5 pure service functions; then refactor `todo-web-app/backend/app/routes/tasks.py` to be a thin HTTP adapter calling those functions

  **Step A** — create `app/services/tasks.py` (new file):
  ```python
  # [Task]: T-3.1.4
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

  **Step B** — refactor `app/routes/tasks.py` (thin HTTP adapters):
  - Read the current `routes/tasks.py` in full before editing.
  - Replace each inline DB block with a call to the matching `service_*` function imported from `app.services.tasks`.
  - Keep all route decorators, request models, response models, and status codes identical.
  - Add a helper `_get_task_or_404(session, user_id, task_id)` that calls
    `get_task_for_user` and raises `HTTPException(404)` when it returns `None`.
  - Verify: start the FastAPI server with `uv run uvicorn app.main:app` and confirm
    all task endpoints respond identically to their pre-refactor behaviour.

**Checkpoint**: `app/services/tasks.py` exists with 6 functions (`get_task_for_user` +
5 `service_*`). `routes/tasks.py` imports from `app.services.tasks` and contains no
direct SQLModel `select` / `session.exec` calls of its own. Phase 2 API behaviour
is unchanged.

---

## Phase 4: MCP Server — MCP-Mediated Task Management (Priority: P1)

**Goal**: Expose all 5 task CRUD operations as typed MCP tools that an AI agent can
call. Each tool is stateless, creates its own DB session, and requires `user_id`.

**Independent Test** (FR-004 / FR-006):
Running `uv run mcp dev app/mcp/server.py` from `todo-web-app/backend/` opens the
MCP inspector. The inspector lists exactly 5 tools:
`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`.

**User Story**: US2 — MCP-Mediated Task Management

### Implementation for Phase 4 (MCP Server)

- [x] T-3.1.5 [US2] Create `todo-web-app/backend/app/mcp/server.py` with the `FastMCP` instance, `_get_session()` helper, and all imports — no tool implementations yet

  ```python
  # [Task]: T-3.1.5
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
  ```

  Verify the file imports cleanly: `python -c "from app.mcp.server import mcp; print(mcp.name)"` → `todo-mcp-server`.

- [x] T-3.1.6 [US2] Implement `add_task` MCP tool in `todo-web-app/backend/app/mcp/server.py`

  Add the following `@mcp.tool()` decorated function to `server.py`:
  ```python
  # [Task]: T-3.1.6
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
  ```
  Acceptance (FR-005 / US2 scenario 1): tool called with valid `user_id` and `title` → task row created and returned with `"success": true`.

- [x] T-3.1.7 [US2] Implement `list_tasks` MCP tool in `todo-web-app/backend/app/mcp/server.py`

  Add the following `@mcp.tool()` decorated function to `server.py`:
  ```python
  # [Task]: T-3.1.7
  @mcp.tool()
  def list_tasks(user_id: str, status: str = "all") -> dict:
      """Lists tasks for the authenticated user, optionally filtered by status."""
      status_map = {
          "all": StatusFilter.ALL,
          "pending": StatusFilter.PENDING,
          "completed": StatusFilter.COMPLETED,
      }
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
  ```
  Acceptance (US2 scenario 3): called with `status="pending"` when user has 2 pending + 3 completed → `"count": 2` with only pending tasks in `"tasks"`.

- [x] T-3.1.8 [US2] Implement `complete_task` and `delete_task` MCP tools in `todo-web-app/backend/app/mcp/server.py`

  Add both `@mcp.tool()` decorated functions to `server.py`:
  ```python
  # [Task]: T-3.1.8
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
  ```
  Acceptance (US2 scenario 2): `complete_task` called with User B's `user_id` on User A's task → `{"success": false, "error": "Task not found."}` (user isolation enforced).
  Acceptance (US2 scenario 4): `delete_task` succeeds → subsequent `list_tasks` does not include the deleted task.

- [x] T-3.1.9 [US2] Implement `update_task` MCP tool in `todo-web-app/backend/app/mcp/server.py`

  Add the final `@mcp.tool()` decorated function to `server.py`:
  ```python
  # [Task]: T-3.1.9
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
  Acceptance: `update_task` called with only `title` → title updated, description unchanged. Called with only `description` → description updated, title unchanged.

**Checkpoint (US2 complete)**: `app/mcp/server.py` registers exactly 5 tools.
`uv run mcp dev app/mcp/server.py` inspector lists: `add_task`, `list_tasks`,
`complete_task`, `delete_task`, `update_task`. Each tool returns `{"success": true/false, ...}`.

---

## Phase 5: Verification & Polish

**Purpose**: End-to-end tool verification and creation of the standalone test script.

- [ ] T-3.1.10 [P] Create standalone verification script `todo-web-app/backend/scripts/test_mcp_tools.py`

  The script must:
  1. Import the 5 tool functions directly from `app.mcp.server`.
  2. Create a real DB session and call each tool with a test `user_id` (e.g. `"test-user-123"`).
  3. Assert `result["success"] == True` for all create/list/update operations.
  4. Assert cross-user isolation: calling `complete_task` with a different `user_id` returns `{"success": False}`.
  5. Print a pass/fail summary.

  Run with: `uv run python scripts/test_mcp_tools.py` from `todo-web-app/backend/`.

- [ ] T-3.1.11 Run `uv run mcp dev app/mcp/server.py` from `todo-web-app/backend/` and confirm the MCP inspector lists all 5 tools (add_task, list_tasks, complete_task, delete_task, update_task) with correct parameter schemas (SC-001)

  **Verification criteria** (FR-004 / FR-006):
  - Inspector shows exactly 5 tools — no more, no less.
  - `add_task`: required params `user_id: str`, `title: str`; optional `description: str`.
  - `list_tasks`: required `user_id: str`; optional `status: str` (default `"all"`).
  - `complete_task`: required `user_id: str`, `task_id: str`.
  - `delete_task`: required `user_id: str`, `task_id: str`.
  - `update_task`: required `user_id: str`, `task_id: str`; optional `title`, `description`.

**Checkpoint**: Phase 3.1 is fully complete. The MCP server is standalone-runnable,
all 5 tools are verified, DB tables exist, and service layer is shared between REST
and MCP. Phase 3.2 (AI agent orchestration) may now begin.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (DB Evolution) — T-3.1.1 → T-3.1.2 → T-3.1.3
    └── Phase 3 (Logic Refactoring) — T-3.1.4  [blocks all MCP tasks]
            └── Phase 4 (MCP Server)
                    T-3.1.5 → T-3.1.6 → T-3.1.7 → T-3.1.8 → T-3.1.9
    └── Phase 5 (Verification) — after Phase 4 complete
```

### Critical Sequential Dependencies

| Task | Depends On | Reason |
|------|-----------|--------|
| T-3.0.2 | T-3.0.1 | `services/` package needed before creating the module |
| T-3.0.3 | T-3.0.1 | `mcp/` package needed before creating the server |
| T-3.1.2 | T-3.1.1 | `Message.conversation_id` FK references `Conversation` |
| T-3.1.3 | T-3.1.1, T-3.1.2 | Migration must match the final model definitions |
| T-3.1.4 | T-3.0.2 | `services/` package must exist |
| T-3.1.5 | T-3.0.3, T-3.1.4 | `mcp/` package + service layer must exist |
| T-3.1.6–T-3.1.9 | T-3.1.5 | FastMCP instance and `_get_session()` must exist |
| T-3.1.10–T-3.1.11 | T-3.1.6–T-3.1.9 | All tools must exist before verification |

### Parallel Opportunities

**Phase 1**: T-3.0.2 and T-3.0.3 can run in parallel (different directories).

**Phase 2 + 3 in parallel**: T-3.1.1/T-3.1.2/T-3.1.3 (DB models + migration) and
T-3.1.4 (service layer) operate on completely different files and can be worked on
concurrently by different developers:
- Developer A: `models.py` + `migrations/versions/002_*.py` (T-3.1.1 → T-3.1.2 → T-3.1.3)
- Developer B: `services/tasks.py` + `routes/tasks.py` refactor (T-3.1.4)

```bash
# Parallel example — Phase 2 & 3 can proceed simultaneously:
# Dev A stream:
Task: T-3.1.1 — Add Conversation model to app/models.py
Task: T-3.1.2 — Add Message model to app/models.py
Task: T-3.1.3 — Create + run migration 002_add_conversations_messages.py

# Dev B stream (independent):
Task: T-3.1.4 — Create app/services/tasks.py + refactor routes/tasks.py
```

**Phase 4**: T-3.1.6, T-3.1.7, T-3.1.8, T-3.1.9 all add to the same file
(`app/mcp/server.py`) so they must be sequential, but each tool's logic is
independently reviewable.

---

## Stylistic Rules (applied throughout)

1. **Task ID comments**: Every code block includes `# [Task]: T-3.1.x` at the top.
2. **Stateless tools**: Every MCP tool in `app/mcp/server.py` opens its own session
   via `_get_session()` — no session is held across tool calls.
3. **`user_id` required**: All 5 MCP tools declare `user_id: str` as the **first**
   positional parameter with no default value.
4. **No HTTP exceptions in services**: `app/services/tasks.py` returns `None` for
   not-found; only `app/routes/tasks.py` raises `HTTPException`.
5. **PEP8 + Black (88 chars)**: All new files must pass `black --check` and
   `flake8` with the project's existing configuration.

---

## Implementation Strategy

### MVP Scope (Phase 3.1 only)

1. Complete **Phase 1** (Setup — 15 min)
2. Complete **Phase 2** in parallel with **Phase 3** (DB + Service extraction — 45 min)
3. Complete **Phase 4** sequentially T-3.1.5 → T-3.1.9 (MCP tools — 30 min)
4. **STOP and VALIDATE** with `mcp dev` inspector (T-3.1.11)
5. Hand off to Phase 3.2 (AI agent orchestration + `/api/chat` endpoint)

### What Phase 3.1 Delivers

- Neon DB: 2 new tables (`conversations`, `messages`) — ready for Phase 3.2 history retrieval
- `app/services/tasks.py` — 5 pure functions shared by REST + AI
- `app/mcp/server.py` — 5 typed MCP tools callable by any MCP-compatible AI agent
- Phase 2 REST API: unchanged behaviour, thinner implementation

### What Phase 3.1 Does NOT Deliver (Phase 3.2 scope)

- `/api/chat` HTTP endpoint
- AI agent orchestration (OpenAI Agents SDK + Groq)
- Roman Urdu detection (US3)
- Frontend chat UI (`ChatKit`)
- JWT enforcement at the MCP boundary (Phase 3.2 passes `user_id` from validated JWT)

---

## Notes

- All file paths are relative to the repository root (`hackathon-II/`).
- Backend working directory for `uv` commands: `todo-web-app/backend/`
- `STATUS_FILTER` enum (`StatusFilter.ALL / PENDING / COMPLETED`) already exists in
  `app/schemas.py` — do not redefine it.
- The `_utcnow` helper is already used in the existing `Task` model in `models.py` —
  reuse it for `Conversation` and `Message` timestamps.
- Phase 2 tables (`tasks`, Better Auth) MUST NOT be altered in T-3.1.3 — verify with
  `alembic history` and `alembic current` after migration.
