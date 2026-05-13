# Implementation Plan: Phase 2.1 — Backend API & Database

**Branch**: `002-backend-api-db` | **Date**: 2026-03-03 | **Spec**: `specs/002-backend-api-db/spec.md`
**Input**: Feature specification from `specs/002-backend-api-db/spec.md`

## Summary

Build the FastAPI backend service for the Phase 2 Todo Web App. Delivers 6 RESTful
endpoints (`/api/{user_id}/tasks`) backed by Neon Serverless PostgreSQL via SQLModel ORM.
All endpoints enforce user-scoped data isolation. Phase 2.1 includes a security stub for
the JWT dependency; full JWT verification is wired in Phase 2.2. The architecture is
designed so Phase 3 (AI Chatbot) can call the CRUD service layer directly without
rewriting endpoints or auth logic.

---

## Technical Context

**Language/Version**: Python 3.13
**Primary Dependencies**: FastAPI 0.115+, SQLModel 0.0.21+, psycopg2-binary, Alembic,
  python-dotenv, uvicorn
**Storage**: Neon Serverless PostgreSQL (via `DATABASE_URL` env var, `psycopg2` driver)
**Testing**: pytest, httpx (async client for FastAPI), pytest-asyncio
**Target Platform**: Linux server (WSL2 local dev, Vercel/Railway or similar for deploy)
**Project Type**: Web application — backend service only (Phase 2.1)
**Performance Goals**: p95 response < 500ms for all CRUD operations (SC-001)
**Constraints**: Each query MUST include `user_id` scope; Neon free tier — use
  `pool_pre_ping=True` and NullPool to avoid connection exhaustion on serverless
**Scale/Scope**: Single-user MVP validation; multi-user isolation enforced from day 1

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Spec-Driven Development | Spec at `specs/002-backend-api-db/spec.md` ✓; API contract at `api/rest-endpoints.md` ✓; DB schema at `database/schema.md` ✓ | ✅ PASS |
| II. Read-Before-Write | All spec artifacts read before this plan was written ✓ | ✅ PASS |
| III. Non-Destructive Integration | CRUD service layer (`services/tasks.py`) is callable by Phase 3 AI layer without route changes ✓; JWT dependency is swappable ✓ | ✅ PASS |
| IV. API-First Architecture | All 6 endpoints under `/api/{user_id}/tasks`; Pydantic models for all I/O ✓ | ✅ PASS |
| V. Multi-User Data Isolation | Every SQLModel query includes `WHERE Task.user_id == user_id` filter ✓ | ✅ PASS |
| VI. JWT Security Contract | Phase 2.1: stub dependency returns hardcoded dev user. Phase 2.2 replaces stub with real JWT verification ✓ | ✅ PASS (stub acknowledged) |
| VII. Monorepo Pattern | Backend lives at `/todo-web-app/backend/`; CLAUDE.md at root + backend/ ✓ | ✅ PASS |
| VIII. Code Quality | Python 3.13, PEP8, Black ≤88 chars, type hints on all public functions ✓ | ✅ PASS |

**Post-Design Re-check**: No violations. Security stub for Principle VI is an acknowledged
deferral to Phase 2.2, logged in Complexity Tracking below.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-api-db/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions and rationale
├── data-model.md        # Phase 1: entity model and schema mapping
├── quickstart.md        # Phase 1: developer setup guide
├── spec.md              # Feature requirements
├── api/
│   └── rest-endpoints.md
├── database/
│   └── schema.md
├── contracts/
│   └── tasks-api.yaml   # OpenAPI 3.1 contract stub
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
todo-web-app/
├── CLAUDE.md                    # Root monorepo agent context
└── backend/
    ├── CLAUDE.md                # Backend-specific agent context
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI app, CORS, router mount
    │   ├── db.py                # Engine, session factory, get_session dep
    │   ├── models.py            # SQLModel ORM: Task table model
    │   ├── schemas.py           # Pydantic: TaskCreate, TaskUpdate, TaskRead, ListResponse
    │   ├── auth.py              # JWT dep stub (Phase 2.1) → real in Phase 2.2
    │   └── routes/
    │       ├── __init__.py
    │       └── tasks.py         # APIRouter: all 6 CRUD endpoints
    ├── migrations/
    │   ├── env.py               # Alembic environment config
    │   ├── script.py.mako
    │   └── versions/
    │       └── 001_create_tasks_table.py
    ├── tests/
    │   ├── conftest.py          # Test DB setup, client fixture, auth override
    │   ├── contract/
    │   │   └── test_tasks_contract.py
    │   └── integration/
    │       └── test_tasks_crud.py
    ├── .env.example
    ├── pyproject.toml
    └── README.md
```

**Structure Decision**: Web application backend (Option 2 from template) — backend
service only for Phase 2.1. Frontend (`todo-web-app/frontend/`) is scoped to Phase 2.3.

---

## Phase 0: Research Summary

See `research.md` for full decision log. Key decisions:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB driver | `psycopg2-binary` (sync) | SQLModel default; simpler than asyncpg for Phase 2.1 CRUD |
| Connection pool | `NullPool` + `pool_pre_ping=True` | Neon serverless closes idle connections; NullPool avoids stale connections |
| Migration tool | Alembic | Standard SQLAlchemy migration; SQLModel-compatible |
| Schema separation | Pydantic schemas in `schemas.py` | Keeps ORM models clean; `TaskCreate ≠ Task` |
| Auth Phase 2.1 | Stub returning `"dev-user-id"` | Allows endpoint testing before JWT wiring |
| CORS | Allow localhost:3000 + env-configured origins | Frontend dev on port 3000; production origin via env |
| Response envelope | `{ "data": ..., "meta": { "total": N } }` | Matches API contract; consistent for all endpoints |

---

## Phase 1: Design

### Component Specifications

#### `app/db.py` — Database Layer

**Responsibility**: Initialise the SQLAlchemy engine from `DATABASE_URL`, create
a `SessionLocal` factory, and provide a `get_session` FastAPI dependency.

**Key design choices**:
- Use `NullPool` from SQLAlchemy to prevent stale connections on Neon serverless
- `pool_pre_ping=True` to verify connections before use
- `create_all()` called from `main.py` on startup for development; Alembic handles
  production migrations

```python
# Interface contract
def get_session() -> Generator[Session, None, None]: ...
engine: Engine  # module-level, shared across requests
```

---

#### `app/models.py` — ORM Models

**Responsibility**: Define `Task` as a SQLModel table model. `User` is NOT defined
as a SQLModel table (it is managed by Better Auth); only a lightweight reference
class is used for FK documentation.

**Task model fields** (from `database/schema.md`):

| Field | SQLModel type | Constraints |
|-------|--------------|-------------|
| `id` | `uuid.UUID` | PK, default `uuid4` |
| `user_id` | `str` | NOT NULL, index=True, FK concept (no enforced SQLModel FK to users) |
| `title` | `str` | NOT NULL, max_length=200, min_length=1 |
| `description` | `Optional[str]` | Nullable, max_length=1000 |
| `completed` | `bool` | NOT NULL, default=False |
| `created_at` | `datetime` | NOT NULL, default=`datetime.utcnow` |
| `updated_at` | `datetime` | NOT NULL, default + sa_column_kwargs `onupdate` |

**Note on FK**: The `users` table is managed by Better Auth. SQLModel cannot define a
FK to a table it doesn't own without migration conflicts. `user_id` is stored as `str`
and scoping is enforced at the application layer (not DB FK), per constitution
Principle V. The cascade-delete behaviour is handled by Better Auth's own cleanup.

---

#### `app/schemas.py` — Pydantic Schemas

**Responsibility**: Separate the wire format from the ORM model. No ORM fields
(like `sa_column`) leak into API responses.

```python
class TaskCreate(BaseModel):
    title: str          # 1–200 chars, validated via Field(min_length=1, max_length=200)
    description: str | None = None   # max 1000 chars

class TaskUpdate(BaseModel):
    title: str          # required for PUT (full replacement)
    description: str | None = None

class TaskRead(BaseModel):
    id: uuid.UUID
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TaskListResponse(BaseModel):
    data: list[TaskRead]
    meta: dict          # {"total": int}

class TaskSingleResponse(BaseModel):
    data: TaskRead
```

---

#### `app/auth.py` — JWT Dependency (Phase 2.1 Stub)

**Responsibility**: Provide a `get_current_user_id` FastAPI dependency. In Phase 2.1
this is a **stub** that returns a hardcoded dev user ID (or reads from a test header).
In Phase 2.2 this will be replaced with real JWT verification against Better Auth.

```python
# Phase 2.1 stub signature — Phase 2.2 replaces the body, not the signature
async def get_current_user_id(
    authorization: str | None = Header(default=None)
) -> str:
    # STUB: Returns "dev-user-id" for local development
    # Phase 2.2: decode and verify JWT, return sub claim
    return "dev-user-id"
```

**Critical**: Route handlers depend on `get_current_user_id` via `Depends()`. Swapping
the implementation in Phase 2.2 requires zero changes to route handlers.

---

#### `app/routes/tasks.py` — Route Handlers

**Responsibility**: Implement all 6 endpoints. Each handler:
1. Receives `user_id` from path parameter AND from `get_current_user_id` dependency
2. Asserts path `user_id == current_user_id` → raises `HTTPException(403)` if mismatch
3. Calls SQLModel query scoped by `user_id` → raises `HTTPException(404)` if not found
4. Returns wrapped response (`TaskSingleResponse` or `TaskListResponse`)

**Filter/sort logic** for `GET /api/{user_id}/tasks`:

```python
# status filter
if status == "pending":    query = query.where(Task.completed == False)
elif status == "completed": query = query.where(Task.completed == True)

# sort
if sort == "title":        query = query.order_by(Task.title)
else:                      query = query.order_by(Task.created_at)  # "created" + "due_date"
```

**Toggle completion** (`PATCH /complete`):
```python
task.completed = not task.completed
task.updated_at = datetime.utcnow()
session.add(task); session.commit(); session.refresh(task)
```

---

#### `app/main.py` — Application Entry Point

**Responsibility**: Instantiate `FastAPI`, configure CORS, mount the tasks router.

```python
app = FastAPI(title="Todo API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,   # ["http://localhost:3000"] + env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router, prefix="/api")
```

---

### Validation Strategy

| Layer | Mechanism | What it catches |
|-------|-----------|-----------------|
| Pydantic `Field()` | `min_length`, `max_length` on `TaskCreate`/`TaskUpdate` | title/description length violations → 422 |
| FastAPI query param validation | `Enum` type for `status` and `sort` | Invalid param values → 422 |
| Route handler | `HTTPException(404)` | Task not found or wrong user |
| Route handler | `HTTPException(403)` | Path user_id ≠ JWT user_id |
| SQLModel | Database-level constraints | Fallback; should not be hit if Pydantic validates first |

**Note**: FastAPI returns 422 (Unprocessable Entity) by default for Pydantic validation
failures. The spec's 400 errors for "validation failure" are mapped to 422 per FastAPI
conventions (documented in Error Taxonomy in `api/rest-endpoints.md`).

---

## Complexity Tracking

> Filled because Constitution Principle VI has an acknowledged deferral.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| JWT stub (Principle VI) | Phase 2.1 delivers CRUD layer; Better Auth integration requires Phase 2.2 frontend work first to issue tokens for testing | Cannot verify real JWT without a working Better Auth frontend; stub allows backend to be developed and tested independently in Phase 2.1 |
| No FK to `users` table (Principle V) | Better Auth owns `users` DDL; SQLModel FK would fail migration if table doesn't exist | Enforcing `user_id` scoping at application layer achieves the same security guarantee without DDL coupling |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Neon serverless connection drops on idle | High | Medium | `NullPool` + `pool_pre_ping=True` in `db.py` |
| `updated_at` not auto-updating via ORM | Medium | Low | Use SQLAlchemy `onupdate=datetime.utcnow` column arg; add integration test to verify |
| Phase 2.2 JWT stub is accidentally left in production | Low | High | `auth.py` stub raises `RuntimeError` if `ENVIRONMENT=production` and token is not provided |

---

## References

- Spec: `specs/002-backend-api-db/spec.md`
- API Contract: `specs/002-backend-api-db/api/rest-endpoints.md`
- DB Schema: `specs/002-backend-api-db/database/schema.md`
- Data Model: `specs/002-backend-api-db/data-model.md`
- Research: `specs/002-backend-api-db/research.md`
- Constitution: `.specify/memory/constitution.md` (v2.0.0)
