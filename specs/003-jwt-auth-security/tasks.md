# Tasks: Phase 2.2 — JWT Authentication & Security

**Input**: Design documents from `/specs/003-jwt-auth-security/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks are grouped by user story. US1 and US2 are both P1 and share the same auth layer implementation. US3 (P2) is already structurally satisfied — only verification is needed.

**⚠️ Critical Finding from research.md**: `routes/tasks.py` requires ZERO structural changes. All 6 route handlers already wire `Depends(get_current_user_id)` and `_assert_owner()` already enforces URL/token user_id matching with 403. This is a body-only replacement in `auth.py`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Dependency & Config)

**Purpose**: Add PyJWT library and environment variable skeleton before any auth logic can be written.

- [x] T001 Add `PyJWT>=2.8.0` to `dependencies` list in `todo-web-app/backend/pyproject.toml`
- [x] T002 Run `uv sync` in `todo-web-app/backend/` to install PyJWT and lock file
- [x] T003 [P] Add `BETTER_AUTH_SECRET=generate-a-random-32-char-string-here` to `todo-web-app/backend/.env.example`

**Checkpoint**: `import jwt` works in the backend virtualenv; `.env.example` documents the new variable.

---

## Phase 2: Foundational (Startup Validation — Blocks All Stories)

**Purpose**: Validate `BETTER_AUTH_SECRET` at startup so the app refuses to start with a misconfigured secret. Must complete before any auth logic is written.

**⚠️ CRITICAL**: No JWT verification can safely run until `BETTER_AUTH_SECRET` is validated at startup.

- [x] T004 Add `better_auth_secret: str = ""` field to `Settings` class in `todo-web-app/backend/app/db.py`
- [x] T005 Add `@model_validator(mode="after")` method `_require_auth_secret` to `Settings` in `todo-web-app/backend/app/db.py` that raises `ValueError("BETTER_AUTH_SECRET must be set")` if field is empty — import `model_validator` from `pydantic`
- [x] T006 Copy `todo-web-app/backend/.env.example` to `todo-web-app/backend/.env` (if not already present) and set a real `BETTER_AUTH_SECRET` value of at least 32 random characters

**Checkpoint**: Start the server with `BETTER_AUTH_SECRET` unset — confirm it crashes with a clear `ValueError`. Set `BETTER_AUTH_SECRET` — confirm it starts successfully.

---

## Phase 3: User Stories 1 & 2 — Secure API Access & Token Rejection (Priority: P1) 🎯 MVP

**Goal**: Replace the Phase 2.1 stub in `app/auth.py` with real HS256 JWT verification. A valid token grants access (US1). Any invalid, expired, or missing token returns 401 with an audit log entry (US2).

**Independent Test**:
1. Generate a valid JWT (see quickstart.md Scenario 1) → call `GET /api/{sub}/tasks` → expect 200
2. Call without Authorization header → expect 401 `{"detail": "Not authenticated"}`
3. Call with expired token → expect 401 `{"detail": "Token expired"}`

### Implementation for US1 & US2

- [x] T007 [US1][US2] Replace the entire body of `get_current_user_id()` in `todo-web-app/backend/app/auth.py` with real HS256 JWT verification — full implementation:

  ```python
  # [Task]: T-2.2.3
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

      Returns the sub claim as the user_id string.
      Raises HTTP 401 on any verification failure and writes an audit log entry.
      """
      if not authorization or not authorization.startswith("Bearer "):
          _audit.warning(
              '{"event": "auth_failure", "reason": "missing_header", "ts": "%s"}',
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

- [x] T008 [US2] Run quickstart.md Scenario 2 (missing header → 401), Scenario 3 (bad signature → 401), Scenario 4 (expired → 401) — verify each returns HTTP 401 with the correct `detail` message

**Checkpoint**: All three 401 scenarios pass. Valid token returns 200 with user's tasks. Audit log entries visible in server stdout for each rejection.

---

## Phase 4: User Story 3 — Token-Derived User Identity (Priority: P2)

**Goal**: Confirm that `user_id` is derived exclusively from the JWT `sub` claim — not from URL path parameters or request body. Verify that a user with Token A cannot access Token B's resources.

**Independent Test**: Run quickstart.md Scenario 5 (Token A accessing user_id_B/tasks → 403 Forbidden).

**⚠️ NOTE**: `routes/tasks.py` requires ZERO code changes. The `_assert_owner(user_id, current_user_id)` helper already enforces token/URL user_id matching with HTTP 403. This phase is a verification task, not an implementation task.

### Verification for US3

- [x] T009 [US3] Run quickstart.md Scenario 5 — generate a valid JWT for `sub: "test-user-001"`, call `GET /api/another-user/tasks` with that token — verify 403 `{"detail": "You do not have permission to access this resource."}`
- [x] T010 [US3] Run quickstart.md Scenario 1 — create a task via `POST /api/test-user-001/tasks` — confirm response `data.user_id` equals the JWT `sub` claim value (not any body field)
- [x] T011 [US3] Run quickstart.md Scenario 6 — call `GET /health` without any Authorization header — verify 200 OK (unauthenticated endpoint still works)

**Checkpoint**: Cross-user access returns 403; task creation stores JWT-derived user_id; health check is unprotected.

---

## Phase 5: Polish & Documentation

**Purpose**: Update documentation and run startup failure scenario.

- [x] T012 Run quickstart.md Scenario 7 — start server with empty `BETTER_AUTH_SECRET` — confirm immediate startup crash with `ValueError`
- [x] T013 [P] Update `Phase 2.2 Migration (JWT)` section in `todo-web-app/backend/CLAUDE.md` — change from "To wire real JWT in Phase 2.2" instructions to "Phase 2.2 complete — real JWT verification active via PyJWT in app/auth.py"
- [x] T014 [P] Add `BETTER_AUTH_SECRET` to the "Running Locally" section in `todo-web-app/backend/CLAUDE.md` under environment setup steps
- [x] T015 Mark T001–T014 complete in this tasks.md file

**Checkpoint**: Startup crash on missing secret confirmed. CLAUDE.md reflects Phase 2.2 as complete. All tasks checked off.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T001 and T003 are parallel
- **Phase 2 (Foundational)**: Depends on T001+T002 (PyJWT must be installed before Settings imports it)
- **Phase 3 (US1+US2)**: Depends on Phase 2 — `settings.better_auth_secret` must exist before `auth.py` uses it
- **Phase 4 (US3)**: Depends on Phase 3 — JWT verification must work before cross-user tests are meaningful
- **Phase 5 (Polish)**: Depends on Phase 4 — all verification complete before docs updated

### Task Dependencies (Sequential)

```
T001 → T002 → T004 → T005 → T007 → T008 → T009 → T010 → T011 → T012
T003 (parallel with T001)
T006 (parallel with T004/T005, after T003)
T013, T014 (parallel with each other, after T012)
T015 (final)
```

### Parallel Opportunities

| Parallel Group | Tasks | Can Run Together When |
|----------------|-------|-----------------------|
| Setup parallel | T001, T003 | Phase 1 start |
| Foundational parallel | T004, T005 | After T002 |
| Config file | T006 | After T003 |
| US3 verification | T009, T010, T011 | After T008, independently |
| Polish docs | T013, T014 | After T012 |

---

## Parallel Example: Phase 1

```bash
# Run together (different files, no dependencies):
Task T001: "Add PyJWT>=2.8.0 to pyproject.toml dependencies"
Task T003: "Add BETTER_AUTH_SECRET to .env.example"
# Then:
Task T002: "Run uv sync" (depends on T001)
```

---

## Implementation Strategy

### MVP (US1 + US2 only — Phases 1–3)

1. Complete Phase 1: Add PyJWT, run uv sync, update .env.example
2. Complete Phase 2: Add `better_auth_secret` to Settings with validator
3. Complete Phase 3: Replace `auth.py` body — real JWT verification active
4. **STOP and VALIDATE**: Test Scenarios 1–4 from quickstart.md
5. MVP ready — all API calls now require a valid JWT

### Full Delivery (all user stories — Phases 1–5)

1. Phases 1–3 (MVP above)
2. Phase 4: Run cross-user 403 tests, health check test (zero code changes)
3. Phase 5: Startup crash test, update CLAUDE.md
4. All 15 tasks complete ✅

---

## Notes

- **No `dependencies.py` needed**: Routes already wire `Depends(get_current_user_id)` from `app.auth`. Adding a separate module adds complexity with zero value (spec SC-006 requires zero route changes).
- **No route changes**: `routes/tasks.py` is untouched — the Phase 2.1 design specifically preserved the dependency contract for this transition.
- **Audit log**: Standard Python `logging` to stdout — no additional infrastructure required. Log level `WARNING` ensures visibility in production.
- **cryptography package**: PyJWT uses the standard library's `hmac` module for HS256 — the `cryptography` package is only needed for RSA/EC algorithms. Not required here.
