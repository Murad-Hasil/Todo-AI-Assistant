---
id: "0031"
title: Add priority, tags, due_date fields to Todo backend
stage: green
date: 2026-04-07
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 013-dapr-jobs-scheduling
user: Murad Hasil
command: Add 3 new fields to the Todo backend (priority, tags, due_date)
labels: ["backend", "models", "schema", "migration", "mcp", "agent"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - app/models.py
  - app/schemas.py
  - app/logic/task_ops.py
  - app/routes/tasks.py
  - app/mcp/server.py
  - app/agent/prompts.py
  - migrations/versions/003_add_priority_tags_due_date.py
tests:
  - "python -c 'from app.models import Task; ...' — field presence verified"
  - "python -c 'from app.schemas import TaskCreate, TaskUpdate, TaskRead; ...' — schema fields verified"
  - "python -c 'import inspect; from app.logic.task_ops import op_create_task, op_update_task; ...' — function signatures verified"
---

## Prompt

Add 3 new fields to the Todo backend: `priority` (low/medium/high), `tags`
(comma-separated string), `due_date` (optional datetime with timezone).

Files to modify (all in `/home/brownie/projects/hackathon-II/todo-web-app/backend/`):

1. `app/models.py` — add fields to Task class
2. `migrations/versions/003_add_priority_tags_due_date.py` — new Alembic migration
3. `app/schemas.py` — add to TaskCreate, TaskUpdate, TaskRead
4. `app/logic/task_ops.py` — update op_create_task and op_update_task signatures
5. `app/routes/tasks.py` — pass new fields through to op functions
6. `app/mcp/server.py` — update add_task and update_task MCP tools
7. `app/agent/prompts.py` — update AVAILABLE TOOLS + add PRIORITY/TAGS/DUE DATE rules

## Response snapshot

All 7 files modified/created. Runtime verification confirmed:

- Task model fields: id, user_id, title, description, completed, priority, tags,
  due_date, created_at, updated_at
- TaskCreate fields: title, description, priority, tags, due_date
- TaskUpdate fields: title, description, priority, tags, due_date
- TaskRead fields: id, user_id, title, description, completed, priority, tags,
  due_date, created_at, updated_at
- op_create_task params: session, user_id, title, description, priority, tags, due_date
- op_update_task params: session, user_id, task_id, title, description, priority,
  tags, due_date

Migration 003 created; `alembic upgrade head` requires a live .env with DATABASE_URL
to execute against Neon — run once .env is in place.

## Outcome

- Impact: Task model, all Pydantic schemas, business logic layer, REST routes,
  MCP tools, and agent prompt updated atomically with zero breaking changes to
  existing fields.
- Tests: Import-level schema/model checks PASS; migration SQL ready; live DB
  migration pending .env setup.
- Files: 6 modified + 1 created (migration)
- Next prompts: run `alembic upgrade head` with live DATABASE_URL; update
  frontend TaskForm to expose the three new fields.
- Reflection: due_date in op_update_task always overwrites when passed; if the
  caller wants to clear due_date they should pass None explicitly — current guard
  `if due_date is not None` means clearing is not yet supported via MCP update_task.

## Evaluation notes (flywheel)

- Failure modes observed: alembic upgrade failed without .env (expected — startup
  guard requires BETTER_AUTH_SECRET and DATABASE_URL)
- Graders run and results (PASS/FAIL): import-level field verification PASS
- Prompt variant (if applicable): none
- Next experiment: add `clear_due_date: bool = False` param to op_update_task if
  users need to explicitly unset due_date
