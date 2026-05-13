# Implementation Plan: Phase 2.2 — JWT Authentication & Security

**Branch**: `003-jwt-auth-security` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-jwt-auth-security/spec.md`

## Summary

Replace the Phase 2.1 JWT stub in `app/auth.py` with real HS256 JWT verification using PyJWT and the shared `BETTER_AUTH_SECRET`. All 6 task CRUD endpoints already use `Depends(get_current_user_id)` — the dependency injection is already wired. Only `app/auth.py` body, `app/db.py` Settings, `pyproject.toml`, and `.env.example` require changes. Zero modifications to `routes/tasks.py`, `models.py`, `schemas.py`, or migrations.

## Technical Context

**Language/Version**: Python 3.13
**Primary Dependencies**: FastAPI 0.115+, PyJWT>=2.8.0 (NEW), pydantic-settings 2.3+
**Storage**: Neon Serverless PostgreSQL — no schema changes; JWT is stateless
**Testing**: pytest + httpx (existing test suite extended with auth test cases)
**Target Platform**: Linux server (Neon/FastAPI deployment)
**Project Type**: Web API backend (monorepo: `/todo-web-app/backend/`)
**Performance Goals**: JWT verification < 10ms p95 (in-memory, no DB lookup)
**Constraints**: Single file body change; zero route modifications; startup crash on missing secret
**Scale/Scope**: Multi-user; each user scoped by JWT `sub` claim

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ | Spec at `specs/003-jwt-auth-security/`, task IDs in all files |
| II. Read-Before-Write | ✅ | All affected files read before modification |
| III. Non-Destructive Integration | ✅ | Function signature unchanged; Phase 3 unaffected |
| IV. API-First Architecture | ✅ | Auth is a dependency layer; all routes still under `/api/` |
| V. Multi-User Data Isolation | ✅ | `user_id` from verified JWT `sub`; `_assert_owner()` enforces URL match |
| VI. JWT Security Contract | ✅ | `Authorization: Bearer` only; dedicated dependency; raises 401 on any failure |
| VII. Monorepo Pattern | ✅ | All changes in `todo-web-app/backend/`; CLAUDE.md updated |
| VIII. Code Quality Standards | ✅ | PEP8, Black ≤88 chars, type hints on all public functions |

## Project Structure

### Documentation (this feature)

```text
specs/003-jwt-auth-security/
├── spec.md              # Feature requirements
├── plan.md              # This file
├── research.md          # Library choice, startup validation, audit logging decisions
├── data-model.md        # No new DB entities; Settings field extension documented
├── quickstart.md        # 7 manual test scenarios
├── contracts/
│   └── auth-middleware.yaml  # OpenAPI 3.1 auth layer contract
├── api/
│   ├── auth-flow.md     # Step-by-step auth flow
│   └── security-rules.md    # Protected endpoints, isolation, audit rules
└── checklists/
    └── requirements.md  # All items ✅
```

### Source Code (changed files only)

```text
todo-web-app/backend/
├── pyproject.toml               # ADD: PyJWT>=2.8.0 to dependencies
├── .env.example                 # ADD: BETTER_AUTH_SECRET variable
├── app/
│   ├── db.py                    # ADD: better_auth_secret to Settings + startup validator
│   └── auth.py                  # REPLACE body of get_current_user_id() with real JWT verification
└── CLAUDE.md                    # UPDATE: Phase 2.2 migration section → complete
```

**Files with ZERO changes** (by design):

```text
app/models.py          # Task table unchanged; no new columns
app/schemas.py         # Request/response contracts unchanged
app/routes/tasks.py    # Already uses Depends(get_current_user_id) + _assert_owner()
app/main.py            # CORS, router mount, health check unchanged
migrations/            # No schema migration needed (stateless JWT)
```

## Complexity Tracking

No constitution violations. No complexity exceptions required.

---

## Phase 0: Research (Complete)

See [research.md](research.md) for full decision records. Summary:

### Decision R-1: PyJWT (not python-jose)

- `PyJWT>=2.8.0` — actively maintained, zero native deps, clean HS256 API
- Distinct exception hierarchy for granular audit logging:
  - `jwt.ExpiredSignatureError` → log reason `expired_token`
  - `jwt.MissingRequiredClaimError` → log reason `missing_sub`
  - `jwt.DecodeError` (catch-all) → log reason `invalid_token`
- `options={"require": ["exp", "sub"]}` enforces both claims at decode time

### Decision R-2: Zero Route Changes

The Phase 2.1 design already wired `Depends(get_current_user_id)` into all 6 routes and implemented `_assert_owner()` for URL/token user_id matching (403 on mismatch). Replacing only the function *body* in `auth.py` propagates real JWT verification everywhere automatically.

### Decision R-3: Settings-based Startup Validation

`Settings.better_auth_secret` validated via `@model_validator(mode="after")` — process crashes at startup if absent, satisfying FR-007 with zero added infrastructure.

### Decision R-4: Python logging for Audit Events

`logging.getLogger("auth.audit")` at WARNING level. Structured JSON-like string format captured by hosting log aggregators. Zero new dependencies.

---

## Phase 1: Design & Contracts (Complete)

### Component 1: `pyproject.toml` — Add PyJWT Dependency

```toml
dependencies = [
    "fastapi>=0.115.0",
    "sqlmodel>=0.0.21",
    "psycopg2-binary>=2.9.9",
    "pydantic-settings>=2.3.0",
    "alembic>=1.13.0",
    "uvicorn[standard]>=0.30.0",
    "python-dotenv>=1.0.0",
    "PyJWT>=2.8.0",             # Phase 2.2: JWT verification
]
```

### Component 2: `app/db.py` — Settings Extension

Add `better_auth_secret: str = ""` with a `@model_validator` that raises `ValueError` if empty. The existing `Settings` class already uses pydantic-settings — no structural change needed.

```python
# pseudocode — exact code in auth.py for reference
from pydantic import model_validator

class Settings(BaseSettings):
    database_url: str = ""
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    better_auth_secret: str = ""          # NEW

    @model_validator(mode="after")
    def _require_auth_secret(self) -> "Settings":
        if not self.better_auth_secret:
            raise ValueError(
                "BETTER_AUTH_SECRET must be set. "
                "Add it to your .env file."
            )
        return self
```

**Note**: This validator runs at startup (when `settings = Settings()` is called in `db.py`). If `BETTER_AUTH_SECRET` is absent or empty, the process exits before serving any requests.

### Component 3: `app/auth.py` — Real JWT Verification

Replace the entire body of `get_current_user_id()`. The function signature is **identical** to Phase 2.1.

```python
# [Task]: T-2.2.1
"""
JWT authentication dependency.

Phase 2.2: Real HS256 JWT verification using PyJWT and BETTER_AUTH_SECRET.
The function signature is IDENTICAL to Phase 2.1 — zero route changes required.
"""
import logging
from datetime import datetime, timezone

import jwt
from fastapi import Header, HTTPException, status

from app.db import settings

_audit = logging.getLogger("auth.audit")


async def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract and verify the authenticated user ID from the JWT.

    Returns the `sub` claim as the user_id string.
    Raises HTTP 401 on any verification failure and writes an audit log entry.
    """
    endpoint_hint = "unknown"  # enriched by request middleware if available

    if not authorization or not authorization.startswith("Bearer "):
        _audit.warning(
            '{"event": "auth_failure", "reason": "missing_header", '
            '"ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        user_id: str = payload["sub"]
        if not user_id:
            raise jwt.InvalidTokenError("Empty sub claim")
        return user_id

    except jwt.ExpiredSignatureError:
        _audit.warning(
            '{"event": "auth_failure", "reason": "expired_token", "ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.DecodeError, jwt.InvalidTokenError):
        _audit.warning(
            '{"event": "auth_failure", "reason": "invalid_token", "ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

### Component 4: `.env.example` — Add BETTER_AUTH_SECRET

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
BETTER_AUTH_SECRET=generate-a-random-32-char-string-here
```

### Component 5: `backend/CLAUDE.md` — Update Migration Section

Mark Phase 2.2 complete; update the "Running Locally" section to document `BETTER_AUTH_SECRET` requirement.

---

## Route Refactoring Strategy (No Changes Required)

The user's plan input mentions updating `routes/tasks.py`. After reviewing the existing code:

- All 6 route handlers already declare `current_user_id: str = Depends(get_current_user_id)`.
- `_assert_owner(user_id, current_user_id)` already enforces `url.user_id == token.user_id` → returns 403 on mismatch. This matches the PDF requirement exactly.
- Database queries already filter by `user_id` (FR-005 satisfied).

**Conclusion**: Zero structural changes to `routes/tasks.py`. The existing route architecture was designed for this exact Phase 2.2 transition. Modifying routes would add complexity without value and violates the spec's SC-006.

---

## Execution Order

```
T-2.2.1  Add PyJWT to pyproject.toml + uv sync
T-2.2.2  Add better_auth_secret to Settings in db.py (startup validation)
T-2.2.3  Update .env.example with BETTER_AUTH_SECRET
T-2.2.4  Replace body of get_current_user_id() in auth.py
T-2.2.5  Update backend/CLAUDE.md (Phase 2.2 complete)
T-2.2.6  Manual test — run quickstart.md scenarios 1–7
```

All tasks are sequential (T-2.2.2 must precede T-2.2.4 because `auth.py` imports `settings`).

---

## ADR Suggestion

📋 **Architectural decision detected**: Keeping `get_current_user_id()` as the single auth entrypoint (no separate `dependencies.py`) to maintain Phase 2.1 contract and zero-route-change guarantee.
Document reasoning and tradeoffs? Run `/sp.adr jwt-single-auth-entrypoint`
