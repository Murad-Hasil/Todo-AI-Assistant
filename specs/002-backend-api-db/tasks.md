---
description: "Task list for Phase 2.1 — Backend API & Database"
---

# Tasks: Phase 2.1 — Backend API & Database

**Input**: Design documents from `specs/002-backend-api-db/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | research.md ✅ | contracts/ ✅
**Feature Branch**: `002-backend-api-db`
**Generated**: 2026-03-03

**Tests**: Not requested — each task includes a manual verification step instead.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

> **Stylistic rule**: All implementation files MUST include a task ID comment at the
> top of each section: `# [Task]: T-2.1.x`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All file paths are relative to the repo root

## Path Conventions

- **Backend root**: `todo-web-app/backend/`
- **App package**: `todo-web-app/backend/app/`
- **Routes**: `todo-web-app/backend/app/routes/`
- **Migrations**: `todo-web-app/backend/migrations/`
- **Tests**: `todo-web-app/backend/tests/`

---

## Phase 1: Setup (T-2.1.1 — Backend Scaffolding)

**Purpose**: Initialize the backend project structure and install all dependencies.

- [x] T001 Create `todo-web-app/backend/` directory and initialize `uv` project
  (`uv init --no-workspace` in `todo-web-app/backend/`)

  > **Verify**: `ls todo-web-app/backend/` shows `pyproject.toml` and `.python-version`

- [x] T002 [P] Add production dependencies to `todo-web-app/backend/pyproject.toml`:
  `fastapi>=0.115`, `sqlmodel>=0.0.21`, `psycopg2-binary`, `pydantic-settings`,
  `alembic`, `uvicorn[standard]`, `python-dotenv`
  (`uv add fastapi sqlmodel psycopg2-binary pydantic-settings alembic "uvicorn[standard]" python-dotenv`)

  > **Verify**: `uv pip list` shows all 7 packages installed

- [x] T003 [P] Create directory structure inside `todo-web-app/backend/`:
  `app/`, `app/routes/`, `migrations/`, `tests/`, `tests/contract/`, `tests/integration/`

  > **Verify**: `ls todo-web-app/backend/app/routes/` and `ls todo-web-app/backend/tests/` exist

- [x] T004 [P] Create `todo-web-app/backend/.env.example` with all required environment
  variables: `DATABASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT`

  > **Verify**: File contains `DATABASE_URL=postgresql://...` placeholder, `CORS_ORIGINS=http://localhost:3000`, `ENVIRONMENT=development`

- [x] T005 [P] Create `todo-web-app/backend/.gitignore` excluding `.env`, `__pycache__/`,
  `.venv/`, `*.pyc`

  > **Verify**: `.env` is NOT tracked by `git status` after copying from `.env.example`

---

## Phase 2: Foundational (T-2.1.2 — Database Configuration)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create `todo-web-app/backend/app/__init__.py` (empty) and
  `todo-web-app/backend/app/routes/__init__.py` (empty)

  > **Verify**: `python -c "from app import routes"` runs without ImportError

- [x] T007 Implement `todo-web-app/backend/app/db.py` — Settings class (pydantic-settings)
  loading `DATABASE_URL` and `CORS_ORIGINS` from env; SQLAlchemy engine with `NullPool`
  and `pool_pre_ping=True`; `SessionLocal` factory; `get_session` FastAPI dependency
  yielding a session and closing on exit. Add `# [Task]: T-2.1.2` at file top.

  > **Verify**: `python -c "from app.db import engine, get_session; print(engine)"` prints
  > engine without error (requires `.env` with valid `DATABASE_URL`)

- [x] T008 [P] Implement `todo-web-app/backend/app/auth.py` — `get_current_user_id`
  FastAPI dependency; Phase 2.1 stub returns hardcoded `"dev-user-id"`;
  if `ENVIRONMENT == "production"` raises `RuntimeError` to prevent accidental stub deploy.
  Add `# [Task]: T-2.1.2` at file top.

  > **Verify**: `python -c "import asyncio; from app.auth import get_current_user_id; print(asyncio.run(get_current_user_id()))"`
  > prints `dev-user-id`

- [x] T009 Initialize Alembic in `todo-web-app/backend/migrations/` via
  `alembic init migrations`; update `migrations/env.py` to import `SQLModel.metadata`
  and read `DATABASE_URL` from environment

  > **Verify**: `alembic current` runs without error (may show "No current revision" — that is OK)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Authenticated Task Management (Priority: P1) 🎯 MVP

**Goal**: Implement the `Task` model, Pydantic schemas, all 5 CRUD endpoints
(list, create, get, update, delete), and wire into the FastAPI application.

**Independent Test**: Start server, use FastAPI Docs at `http://localhost:8000/docs`
to create a task via `POST /api/dev-user-id/tasks`, retrieve it via
`GET /api/dev-user-id/tasks/{id}`, update it via `PUT`, then delete it via `DELETE`.
All four operations must succeed with correct response shapes.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create `todo-web-app/backend/app/models.py` — `Task` SQLModel table
  class with all fields from `data-model.md`: `id` (UUID PK, `uuid4`), `user_id` (str,
  indexed), `title` (str, max_length=200), `description` (Optional[str]),
  `completed` (bool, default=False), `created_at` (datetime, utcnow), `updated_at`
  (datetime, utcnow + `sa_column_kwargs={"onupdate": ...}`). Add `# [Task]: T-2.1.3`.

  > **Verify**: `python -c "from app.models import Task; print(Task.__tablename__)"` prints `tasks`

- [x] T011 [P] [US1] Create `todo-web-app/backend/app/schemas.py` — `TaskCreate`
  (title: `Field(min_length=1, max_length=200)`, optional description `Field(max_length=1000)`),
  `TaskUpdate` (same as TaskCreate), `TaskRead` (all fields, `ConfigDict(from_attributes=True)`),
  `TaskSingleResponse` (`data: TaskRead`), `TaskListResponse` (`data: list[TaskRead]`,
  `meta: dict[str, int]`), `StatusFilter` Enum (`all/pending/completed`),
  `SortOrder` Enum (`created/title/due_date`). Add `# [Task]: T-2.1.4`.

  > **Verify**: `python -c "from app.schemas import TaskCreate; t = TaskCreate(title='hi'); print(t)"` succeeds;
  > `TaskCreate(title='')` raises `ValidationError`

- [x] T012 [US1] Create Alembic migration `todo-web-app/backend/migrations/versions/001_create_tasks_table.py`
  — creates `tasks` table with all columns from `database/schema.md`; adds three indexes:
  `idx_tasks_user_id`, `idx_tasks_completed`, `idx_tasks_user_completed` (composite).
  Run `alembic upgrade head` to apply.

  > **Verify**: `alembic current` shows `001_create_tasks_table` as current revision;
  > `psql $DATABASE_URL -c "\d tasks"` shows all columns and indexes

- [x] T013 [P] [US1] Implement `todo-web-app/backend/app/routes/tasks.py` — create
  `APIRouter(prefix="/{user_id}/tasks")`; add helper `_assert_owner(path_uid, jwt_uid)`
  raising `HTTPException(403)` on mismatch; add helper
  `_get_task_or_404(task_id, user_id, session)` returning `Task` or raising
  `HTTPException(404)`. Add `# [Task]: T-2.1.5` at file top.

  > **Verify**: File imports without error: `python -c "from app.routes.tasks import router; print(router.prefix)"`

- [x] T014 [US1] [US1] Implement `GET /{user_id}/tasks` in
  `todo-web-app/backend/app/routes/tasks.py` — query all tasks scoped to `user_id`
  (default: no filter, sort by `created_at`); return `TaskListResponse` with `data`
  list and `meta.total`. Depends on T013.

  > **Verify**: `curl http://localhost:8000/api/dev-user-id/tasks` returns
  > `{"data": [], "meta": {"total": 0}}` when no tasks exist

- [x] T015 [US1] Implement `POST /{user_id}/tasks` in
  `todo-web-app/backend/app/routes/tasks.py` — accept `TaskCreate` body; create `Task`
  ORM instance with `user_id` from JWT dep; `session.add` + `commit` + `refresh`;
  return `TaskSingleResponse` with HTTP 201. Depends on T013.

  > **Verify**: `curl -X POST http://localhost:8000/api/dev-user-id/tasks -H "Content-Type: application/json" -d '{"title":"Test"}'`
  > returns `201` with `{"data": {"id": "...", "title": "Test", "completed": false, ...}}`

- [x] T016 [US1] Implement `GET /{user_id}/tasks/{id}` in
  `todo-web-app/backend/app/routes/tasks.py` — call `_get_task_or_404`; return
  `TaskSingleResponse` with HTTP 200. Depends on T013.

  > **Verify**: Use UUID from T015 response; `curl http://localhost:8000/api/dev-user-id/tasks/{id}`
  > returns `200` with task data; random UUID returns `404`

- [x] T017 [US1] Implement `PUT /{user_id}/tasks/{id}` in
  `todo-web-app/backend/app/routes/tasks.py` — call `_get_task_or_404`; update `title`
  and `description` from `TaskUpdate` body; SQLModel `task.sqlmodel_update(data.model_dump())`
  or manual field assignment; `commit` + `refresh`; return `TaskSingleResponse`. Depends on T013.

  > **Verify**: `curl -X PUT .../tasks/{id} -d '{"title":"Updated"}'` returns `200` with new title;
  > `updated_at` is newer than `created_at`

- [x] T018 [US1] Implement `DELETE /{user_id}/tasks/{id}` in
  `todo-web-app/backend/app/routes/tasks.py` — call `_get_task_or_404`; `session.delete(task)`;
  `commit`; return HTTP 204 with no body. Depends on T013.

  > **Verify**: `curl -X DELETE .../tasks/{id}` returns `204`; subsequent `GET .../tasks/{id}`
  > returns `404`

- [x] T019 [US1] Assemble `todo-web-app/backend/app/main.py` — instantiate `FastAPI(title="Todo API", version="2.1.0")`; add `CORSMiddleware` with `allow_origins` from `settings.CORS_ORIGINS`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`; add `GET /health` returning `{"status": "ok"}`; `include_router(tasks_router, prefix="/api")`; call `SQLModel.metadata.create_all(engine)` in startup for dev. Add `# [Task]: T-2.1.6`.

  > **Verify**: `uvicorn app.main:app --reload` starts without errors;
  > `curl http://localhost:8000/health` returns `{"status": "ok"}`

**Checkpoint**: User Story 1 is fully functional. All 5 basic CRUD endpoints work
independently via FastAPI Docs at `http://localhost:8000/docs`.

---

## Phase 4: User Story 2 — Task Completion Toggle (Priority: P2)

**Goal**: Add the PATCH completion toggle endpoint to the existing tasks router.

**Independent Test**: Create a task, `PATCH /api/dev-user-id/tasks/{id}/complete`,
verify `completed` flips to `true`, PATCH again, verify it flips back to `false`.

### Implementation for User Story 2

- [x] T020 [US2] Implement `PATCH /{user_id}/tasks/{id}/complete` in
  `todo-web-app/backend/app/routes/tasks.py` — call `_get_task_or_404`; toggle
  `task.completed = not task.completed`; set `task.updated_at = datetime.now(timezone.utc)`;
  `session.add(task)` + `commit` + `refresh`; return `TaskSingleResponse`. Add
  `# [Task]: T-2.1.5` near this endpoint.

  > **Verify**: Create a task; `curl -X PATCH .../tasks/{id}/complete` returns `200` with
  > `completed: true`; PATCH again returns `completed: false`

**Checkpoint**: User Story 2 complete. Toggle endpoint works independently.

---

## Phase 5: User Story 3 — Task Filtering and Sorting (Priority: P3)

**Goal**: Extend `GET /{user_id}/tasks` to support `status` and `sort` query parameters.

**Independent Test**: Create 2 tasks, mark one complete; `GET .../tasks?status=pending`
returns only 1 task; `GET .../tasks?sort=title` returns alphabetical order.

### Implementation for User Story 3

- [x] T021 [US3] Add `status: StatusFilter = StatusFilter.ALL` and
  `sort: SortOrder = SortOrder.CREATED` query parameters to `GET /{user_id}/tasks`
  in `todo-web-app/backend/app/routes/tasks.py`; add filter logic:
  `if status == "pending": query.where(Task.completed == False)`;
  `elif status == "completed": query.where(Task.completed == True)`;
  add sort logic: `if sort == "title": query.order_by(Task.title)` else
  `query.order_by(Task.created_at)` (covers both `created` and `due_date`).

  > **Verify**: `curl ".../tasks?status=pending"` returns only non-completed tasks;
  > `curl ".../tasks?status=invalid"` returns `422` Unprocessable Entity

- [x] T022 [US3] Verify `SortOrder.DUE_DATE` falls back to `created_at` ordering
  (already covered by the `else` branch in T021); add inline comment
  `# due_date: Phase 2.1 alias for created_at — extend in Phase 2.3`

  > **Verify**: `curl ".../tasks?sort=due_date"` returns `200` sorted by creation date (same as `?sort=created`)

**Checkpoint**: All 3 user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, documentation, and end-to-end validation.

- [ ] T023 [P] Create `todo-web-app/backend/README.md` — project overview, setup
  steps (following `quickstart.md`), env variable table, curl examples for all 6
  endpoints, and Phase 2.2 migration note for JWT

  > **Verify**: A new developer can follow README to reach a working server from scratch

- [ ] T024 [P] Create `todo-web-app/backend/CLAUDE.md` — backend-specific agent
  context: Python 3.13, FastAPI, SQLModel, Neon, file layout, auth stub note

  > **Verify**: File exists at `todo-web-app/backend/CLAUDE.md`; no placeholder tokens remain

- [ ] T025 [P] Validate `updated_at` auto-update: create a task, wait 1 second,
  PUT update, confirm `updated_at > created_at` in the response

  > **Verify**: `updated_at != created_at` after a PUT request

- [ ] T026 [P] Validate user isolation (cross-user 404): start server; attempt
  `GET /api/other-user-id/tasks` (user_id ≠ `"dev-user-id"`); confirm HTTP 403

  > **Verify**: `curl http://localhost:8000/api/wrong-user/tasks` returns `403 Forbidden`

- [ ] T027 Run full quickstart.md validation end-to-end (all curl commands in order,
  confirm expected status codes at each step)

  > **Verify**: All commands in `specs/002-backend-api-db/quickstart.md` succeed; no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002–T005 can run in parallel after T001
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
  - T006, T008, T009 can run in parallel after T007 is done
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
  - T010 and T011 can start in parallel; T012 requires T010+T011
  - T013 can start in parallel with T010/T011
  - T014–T018 each depend on T013 (router scaffold); can run in parallel with each other
  - T019 (main.py) depends on T013–T018 all being complete
- **User Story 2 (Phase 4)**: Depends on Phase 3 (router file exists)
- **User Story 3 (Phase 5)**: Depends on T014 (GET list endpoint must exist)
- **Polish (Phase 6)**: Depends on all user stories complete

### Within Each User Story

- Models (T010) before migration (T012)
- Schemas (T011) before routes (T013–T018)
- Router scaffold (T013) before individual endpoints (T014–T018)
- All endpoints (T014–T018) before app assembly (T019)

### Parallel Opportunities

```bash
# Phase 1 — after T001:
Task: "T002 Add dependencies"
Task: "T003 Create directory structure"
Task: "T004 Create .env.example"
Task: "T005 Create .gitignore"

# Phase 2 — after T007:
Task: "T008 Implement auth.py stub"
Task: "T009 Initialize Alembic"

# Phase 3 — T010/T011/T013 in parallel, then T014-T018 in parallel:
Task: "T010 Create models.py"
Task: "T011 Create schemas.py"
Task: "T013 Create routes/tasks.py scaffold"

# After T013 completes:
Task: "T014 GET list endpoint"
Task: "T015 POST create endpoint"
Task: "T016 GET single endpoint"
Task: "T017 PUT update endpoint"
Task: "T018 DELETE endpoint"

# Phase 6 — all polish tasks in parallel:
Task: "T023 README.md"
Task: "T024 CLAUDE.md"
Task: "T025 Validate updated_at"
Task: "T026 Validate user isolation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T009) — **CRITICAL, blocks everything**
3. Complete Phase 3: User Story 1 (T010–T019)
4. **STOP and VALIDATE**: All CRUD operations work via FastAPI Docs
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Working database connection
2. User Story 1 → Full CRUD → Validate independently → MVP!
3. User Story 2 → Completion toggle → Validate independently
4. User Story 3 → Filtering + sorting → Validate independently
5. Polish → README, CLAUDE.md, end-to-end validation

---

## Notes

- All session handling MUST use `Depends(get_session)` — never create sessions directly
- `# [Task]: T-2.1.x` comments MUST appear at the top of each file or section
- `user_id` path parameter MUST always be validated against `get_current_user_id()` dep
- JWT stub (`auth.py`) is intentionally simple — Phase 2.2 replaces body only
- `due_date` sort parameter is an alias for `created_at` in Phase 2.1 — document inline
- Commit after each phase checkpoint (not per individual task)
