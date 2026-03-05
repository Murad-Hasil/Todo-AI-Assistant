# Research: Phase 2.1 — Backend API & Database

**Feature**: `002-backend-api-db`
**Phase**: 0 — Outline & Research
**Date**: 2026-03-03

---

## Decision 1: Database Driver — `psycopg2` vs `asyncpg`

**Decision**: Use `psycopg2-binary` (synchronous driver)

**Rationale**:
- SQLModel's primary documentation and examples use the sync SQLAlchemy session pattern
- Phase 2.1 is CRUD-only; async I/O benefits are minimal for low-concurrency MVP
- `asyncpg` requires async session management (SQLAlchemy `AsyncSession`) which adds
  complexity to FastAPI dependency injection patterns
- Sync routes with `psycopg2` are simpler to test with `pytest` (no `@pytest.mark.asyncio`)

**Alternatives considered**:
- `asyncpg` — deferred to a future phase if performance profiling shows I/O bottlenecks

---

## Decision 2: Neon Connection Pooling Strategy

**Decision**: Use `NullPool` with `pool_pre_ping=True`

**Rationale**:
- Neon is a serverless PostgreSQL; it closes idle connections aggressively
- SQLAlchemy's default `QueuePool` will hold connections open and receive errors
  when Neon reclaims them
- `NullPool` creates a new connection per request and closes it immediately — safe for
  serverless environments; slight latency overhead is acceptable at MVP scale
- `pool_pre_ping=True` issues a lightweight `SELECT 1` before using a recycled
  connection, catching stale connections before they reach route handlers

**Alternatives considered**:
- Neon's own connection pooler (PgBouncer) can be enabled on the Neon dashboard to
  maintain a pooled endpoint; this can replace `NullPool` in a future performance pass

---

## Decision 3: Migration Tool — Alembic vs SQLModel `create_all`

**Decision**: Alembic for production migrations; `SQLModel.metadata.create_all` for
dev/test

**Rationale**:
- `create_all()` on startup is fine for development iteration but does not support
  schema changes (adding columns, renaming) without dropping and recreating tables
- Alembic provides versioned, reversible migrations — required for production Neon
- SQLModel is compatible with Alembic via the standard SQLAlchemy `env.py` setup

**Alternatives considered**:
- Prisma (Node.js) — wrong ecosystem for Python backend
- Liquibase — heavy; not aligned with Python ecosystem

---

## Decision 4: Pydantic Schema Separation Strategy

**Decision**: Separate `schemas.py` with `TaskCreate`, `TaskUpdate`, `TaskRead`,
`TaskListResponse`, `TaskSingleResponse`

**Rationale**:
- SQLModel table models have SQLAlchemy internals (`sa_column`, `metadata`) that
  must not be serialized in API responses
- `TaskRead` uses `model_config = ConfigDict(from_attributes=True)` to convert ORM
  objects to Pydantic without manual mapping
- Separating create/read schemas prevents over-posting attacks (client cannot supply
  `id`, `created_at`, `user_id` in the request body)

**Alternatives considered**:
- Using SQLModel's `table=False` response model — simpler but mixes ORM and schema
  concerns; rejected per constitution Principle IV (clean API contracts)

---

## Decision 5: FK to `users` Table — Enforced vs Application-Level

**Decision**: No SQLModel FK constraint to `users`; enforce `user_id` scoping at
application layer

**Rationale**:
- Better Auth owns the `users` table DDL; if Alembic runs before Better Auth
  initialises `users`, FK creation will fail
- Application-layer scoping (`WHERE user_id = ?`) achieves the same isolation guarantee
  per constitution Principle V
- Cascade-delete on user removal is handled by Better Auth's own account deletion flow

**Alternatives considered**:
- Deferred FK constraint — complex Alembic config; risk of migration ordering issues
- SQLModel FK with migration dependency — adds operational coupling between Better Auth
  init and backend migration pipeline; rejected

---

## Decision 6: CORS Configuration

**Decision**: `allow_origins` from environment variable `CORS_ORIGINS`; default to
`["http://localhost:3000"]` for development

**Rationale**:
- Hardcoded CORS origins are a security risk in production (prevents secret rotation)
- `CORS_ORIGINS` env var is a comma-separated list parsed at startup
- `allow_credentials=True` required for Better Auth session cookies in Phase 2.2

**Alternatives considered**:
- Wildcard `allow_origins=["*"]` — rejected; credentials cannot be sent with wildcard

---

## Decision 7: Phase 2.1 Auth Stub Design

**Decision**: `get_current_user_id` dependency returns `"dev-user-id"` unless
`ENVIRONMENT=production` (which raises `RuntimeError` to prevent accidental stub use)

**Rationale**:
- Allows backend CRUD to be developed and integration-tested without a working
  Better Auth / Next.js frontend
- Stub signature is identical to the Phase 2.2 real dependency — route handlers
  do not need changes when JWT is wired
- Production safeguard prevents stub from being deployed unintentionally

**Alternatives considered**:
- Read user ID from a test header `X-Test-User-Id` — acceptable for local dev but
  more complex test setup; rejected in favour of simpler hardcoded stub for Phase 2.1

---

## Decision 8: Response Envelope Shape

**Decision**: `{ "data": ..., "meta": { "total": N } }` for lists;
`{ "data": <Task> }` for single items

**Rationale**:
- Matches the API contract defined in `api/rest-endpoints.md`
- `total` in meta enables pagination to be added in a future phase without breaking
  the response shape

**Alternatives considered**:
- Flat array response — simpler but breaks Phase 3 AI layer which will need metadata
  for context window management; rejected per constitution Principle III

---

## Resolved Clarifications

All technical unknowns resolved in this research phase. No `NEEDS CLARIFICATION`
markers remain. The plan is ready for Phase 1 design execution.
