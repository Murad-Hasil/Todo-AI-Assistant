# Research: Phase 2.2 — JWT Authentication & Security

**Feature**: `003-jwt-auth-security`
**Date**: 2026-03-03

---

## Decision 1: JWT Library — PyJWT

**Decision**: Use `PyJWT>=2.8.0`

**Rationale**:
- Actively maintained (Python Software Foundation endorsed)
- BSD license, zero native dependencies
- Clean HS256 decode API: `jwt.decode(token, secret, algorithms=["HS256"])`
- Enforces required claims via `options={"require": ["exp", "sub"]}` (raises `MissingRequiredClaimError` if absent)
- Distinct exception hierarchy for granular audit logging:
  - `jwt.ExpiredSignatureError` — expired token
  - `jwt.InvalidSignatureError` — wrong secret
  - `jwt.MissingRequiredClaimError` — missing `sub` or `exp`
  - `jwt.DecodeError` — malformed token (base catch-all)
  - All inherit from `jwt.InvalidTokenError`

**Alternatives considered**:
- `python-jose` — supports more algorithms (RSA, EC) but has had security CVEs (CVE-2024-33664) and is less actively maintained; overkill for HS256-only use case
- `authlib` — heavier, designed for OAuth2/OIDC server roles; not needed here

**Import pattern**:
```python
import jwt  # PyJWT package
```

---

## Decision 2: Better Auth JWT Payload Format

**Decision**: Use the standard `sub` claim as `user_id`

**Rationale**:
Better Auth (configured with `session.strategy: "jwt"`) issues standard JWTs with:
- `sub` — user's unique ID string (UUID or opaque identifier)
- `exp` — expiration timestamp (Unix seconds)
- `iat` — issued-at timestamp
- Optional: `email`, `name` (not required by backend)

The backend only needs `sub` — it maps directly to `task.user_id`. No decoding of additional claims is required for Phase 2.2.

**Constraint**: Better Auth and backend MUST share identical `BETTER_AUTH_SECRET` value. If Better Auth uses a prefix/suffix convention on the secret, that exact value must be replicated in the backend `.env`.

---

## Decision 3: BETTER_AUTH_SECRET Startup Validation

**Decision**: Validate in `Settings` using a Pydantic `model_validator`

**Rationale**:
- Pydantic-settings already owns environment variable loading in `db.py`
- Adding `better_auth_secret: str` to the existing `Settings` class keeps config centralized
- A `@model_validator(mode="after")` raises `ValueError` if the field is empty — this crashes the process at startup before any requests are served, satisfying FR-007
- No additional framework or startup hook needed

**Pattern**:
```python
class Settings(BaseSettings):
    better_auth_secret: str = ""

    @model_validator(mode="after")
    def _require_auth_secret(self) -> "Settings":
        if not self.better_auth_secret:
            raise ValueError("BETTER_AUTH_SECRET must be set")
        return self
```

---

## Decision 4: Audit Logging Strategy

**Decision**: Use Python's `logging` module with structured JSON-formatted log records

**Rationale**:
- Zero additional dependencies
- Output goes to stdout/stderr (captured by Neon/Vercel hosting log aggregators)
- `logging.getLogger("auth.audit")` gives a named logger easily filterable by log aggregators
- Log level `WARNING` is appropriate for security failures (visible by default in production)

**Log format**:
```python
logger.warning(
    '{"event": "auth_failure", "reason": "%s", "endpoint": "%s", "ts": "%s"}',
    reason, endpoint, datetime.utcnow().isoformat()
)
```

---

## Decision 5: Zero Route Changes — Existing Dependency Already Wired

**Decision**: `routes/tasks.py` requires NO changes

**Rationale**:
All 6 route handlers already declare `current_user_id: str = Depends(get_current_user_id)`.
The `_assert_owner(user_id, current_user_id)` helper already enforces that URL `{user_id}` matches the token-derived user ID (raises HTTP 403 if mismatched).
Replacing the *body* of `get_current_user_id` in `auth.py` automatically propagates real JWT verification to all routes — exactly the Phase 2.1 design intent.

**Files requiring changes for Phase 2.2**:

| File | Change Type |
|------|-------------|
| `pyproject.toml` | Add `PyJWT>=2.8.0` dependency |
| `app/db.py` | Add `better_auth_secret` to `Settings` with startup validation |
| `app/auth.py` | Replace stub body with real JWT verification |
| `.env.example` | Add `BETTER_AUTH_SECRET` variable |
| `backend/CLAUDE.md` | Mark Phase 2.2 migration complete |

**Files with ZERO changes**:
- `app/routes/tasks.py` — already wired
- `app/models.py` — JWT is stateless, no new DB columns
- `app/schemas.py` — response contracts unchanged
- `app/main.py` — CORS and router config unchanged
- `migrations/` — no schema changes
