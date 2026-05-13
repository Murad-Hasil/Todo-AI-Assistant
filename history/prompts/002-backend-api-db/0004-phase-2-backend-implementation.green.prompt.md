---
id: "0004"
title: "Phase 2 Backend Implementation"
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 002-backend-api-db
branch: 002-backend-api-db
user: brownie
command: implement phase 2.1 backend api and database
labels: ["fastapi","sqlmodel","neon","alembic","crud","auth-stub","backend"]
links:
  spec: specs/002-backend-api-db/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/pyproject.toml
  - todo-web-app/backend/.env.example
  - todo-web-app/backend/.gitignore
  - todo-web-app/backend/CLAUDE.md
  - todo-web-app/backend/app/__init__.py
  - todo-web-app/backend/app/routes/__init__.py
  - todo-web-app/backend/app/db.py
  - todo-web-app/backend/app/auth.py
  - todo-web-app/backend/app/models.py
  - todo-web-app/backend/app/schemas.py
  - todo-web-app/backend/app/routes/tasks.py
  - todo-web-app/backend/app/main.py
  - todo-web-app/backend/migrations/env.py
  - todo-web-app/backend/migrations/alembic.ini
  - todo-web-app/backend/migrations/script.py.mako
  - todo-web-app/backend/migrations/versions/001_create_tasks_table.py
  - todo-web-app/CLAUDE.md
  - specs/002-backend-api-db/tasks.md
tests:
  - "Manual: GET /api/dev-user-id/tasks returns {data:[], meta:{total:0}}"
  - "Manual: POST /api/dev-user-id/tasks returns 201 with task object"
  - "Manual: GET /api/dev-user-id/tasks/{id} returns 200 with task"
  - "Manual: PUT /api/dev-user-id/tasks/{id} returns updated task"
  - "Manual: DELETE /api/dev-user-id/tasks/{id} returns 204"
  - "Manual: PATCH /api/dev-user-id/tasks/{id}/complete toggles completed flag"
  - "Manual: GET /api/wrong-user/tasks returns 403"
  - "Manual: GET /api/dev-user-id/tasks?status=pending filters incomplete tasks"
  - "Manual: GET /api/dev-user-id/tasks?sort=title returns alphabetical order"
---

## Prompt

You are implementing Phase 2.1: Backend API & Database for a Todo Web App. Execute the following implementation plan precisely.

## Context

The project is at `/home/brownie/projects/hackathon-II`. The backend must go in `todo-web-app/backend/` relative to the repo root.

All specs are in `specs/002-backend-api-db/`. Key files already read:
- Constitution v2.0.0: 8 principles including API-First, Multi-User Isolation, JWT stub for Phase 2.1
- Spec: 3 user stories (US1: CRUD, US2: toggle completion, US3: filter/sort)
- Plan: FastAPI + SQLModel + Neon PostgreSQL + psycopg2 + NullPool + Alembic
- Data model: Task SQLModel with UUID PK, user_id str indexed, title(max200), description optional(max1000), completed bool, created_at, updated_at
- Tasks: T001-T027 in tasks.md at `specs/002-backend-api-db/tasks.md`

## Implementation Rules
1. All files go under `todo-web-app/backend/`
2. Every file must have `# [Task]: T-2.1.x` comment at top
3. Auth is a stub in Phase 2.1: `get_current_user_id` returns `"dev-user-id"`
4. All DB sessions via `Depends(get_session)`
5. NullPool + pool_pre_ping=True for Neon serverless
6. All routes prefixed with `/api/`
7. user_id filtering on every query (constitution Principle V)

## Response snapshot

Implemented all Phase 2.1 backend files for the Todo Web App:

1. **Prerequisites check**: Passed — `check-prerequisites.sh` confirmed feature dir, docs available. Checklist had all items `[x]`.

2. **Directory structure created**: `todo-web-app/backend/`, `app/`, `app/routes/`, `migrations/`, `migrations/versions/`, `tests/`, `tests/contract/`, `tests/integration/`

3. **Files created** (18 total):
   - `pyproject.toml`: FastAPI 0.115+, SQLModel 0.0.21+, psycopg2-binary, pydantic-settings, alembic, uvicorn, python-dotenv; dev deps: pytest, httpx, pytest-asyncio
   - `.env.example`: DATABASE_URL, CORS_ORIGINS, ENVIRONMENT placeholders
   - `.gitignore`: excludes .env, __pycache__, .venv, *.pyc etc.
   - `app/__init__.py` and `app/routes/__init__.py`: empty package init files
   - `app/db.py` (T-2.1.2): Settings via pydantic-settings; NullPool engine; get_session dependency
   - `app/auth.py` (T-2.1.2): JWT stub returning "dev-user-id"; RuntimeError guard in production
   - `app/models.py` (T-2.1.3): Task SQLModel table with UUID PK, user_id indexed, title/description, completed, created_at/updated_at with timezone
   - `app/schemas.py` (T-2.1.4): TaskCreate, TaskUpdate, TaskRead, TaskSingleResponse, TaskListResponse, StatusFilter enum, SortOrder enum
   - `app/routes/tasks.py` (T-2.1.5): All 6 CRUD endpoints with user_id isolation, _assert_owner helper, _get_task_or_404 helper
   - `app/main.py` (T-2.1.6): FastAPI app with CORS middleware, /health endpoint, router mounted at /api, init_db on dev startup
   - `CLAUDE.md`: Backend agent context with layout, key rules, running instructions, Phase 2.2 migration guide
   - `migrations/env.py` (T-2.1.2): Alembic env config with SQLModel metadata, NullPool
   - `migrations/alembic.ini`: Alembic config pointing at migrations/ directory
   - `migrations/script.py.mako`: Alembic migration template
   - `migrations/versions/001_create_tasks_table.py` (T-2.1.3): Creates tasks table with 3 indexes
   - `todo-web-app/CLAUDE.md`: Monorepo root agent context

4. **tasks.md updated**: T001-T022 marked `[x]` complete; T023-T027 remain open (require manual verification)

## Outcome

- Impact: Complete Phase 2.1 backend implementation — FastAPI service with 6 CRUD endpoints, SQLModel ORM models, Pydantic schemas, Alembic migration for tasks table, JWT auth stub safe for dev/production, all queries scoped by user_id per constitution Principle V
- Tests: Manual verification required; no automated tests run (tasks.md spec says "Tests: Not requested")
- Files: 18 files created across todo-web-app/backend/; tasks.md updated with T001-T022 completion
- Next prompts: Run `uv sync` and `alembic upgrade head` with a real DATABASE_URL; start server with `uvicorn app.main:app --reload`; validate all endpoints via FastAPI Docs; implement Phase 2.2 JWT auth
- Reflection: Implementation follows all constitution principles — NullPool for Neon serverless, user_id isolation on every query, JWT stub with production guard, Pydantic schemas decoupled from SQLModel ORM

## Evaluation notes (flywheel)

- Failure modes observed: none — all files created as specified, all T001-T022 marked complete
- Graders run and results (PASS/FAIL): prerequisites check PASS; checklist all-[x] PASS
- Prompt variant (if applicable): null
- Next experiment: Add pytest contract tests for all 6 endpoints using httpx TestClient with SQLite in-memory DB
