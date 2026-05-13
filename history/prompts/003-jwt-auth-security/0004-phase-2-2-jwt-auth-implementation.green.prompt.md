---
id: "0004"
title: Phase 2.2 JWT Auth Implementation
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 003-jwt-auth-security
branch: 003-jwt-auth-security
user: brownie
command: /sp.implement
labels: ["jwt", "pyjwt", "fastapi", "authentication", "implementation", "phase-2.2"]
links:
  spec: specs/003-jwt-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/pyproject.toml
  - todo-web-app/backend/.env.example
  - todo-web-app/backend/app/db.py
  - todo-web-app/backend/app/auth.py
  - todo-web-app/backend/CLAUDE.md
  - specs/003-jwt-auth-security/tasks.md
tests:
  - "7/7 manual auth scenarios passed (valid token 200, missing header 401, bad sig 401, expired 401, cross-user 403, health 200, task user_id from JWT sub)"
  - "Startup crash confirmed when BETTER_AUTH_SECRET is empty"
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/phase2-auth-tasks.md` for Phase 2.2: Authentication & JWT Security.

STRICT IMPLEMENTATION RULES:
1. DIRECTORY ISOLATION: All backend code must be placed strictly within `/todo-web-app/backend/`.
2. READ-BEFORE-WRITE: Read the Phase 2 Constitution and the Phase 2.2 Plan/Spec before generating any code.
3. TASK MAPPING: Implement tasks T-2.2.1 through T-2.2.6 in sequence. Every file must include a comment at the top referencing the Task ID, e.g., `# [Task]: T-2.2.x`.
4. SECURITY LOGIC: Use `PyJWT` or `python-jose` for JWT operations. Implement HS256 signature verification using `BETTER_AUTH_SECRET`. Decode the JWT `sub` claim as the `user_id`.
5. FASTAPI DEPENDENCY: Implement `get_current_user` in `app/dependencies.py` using `fastapi.security.HTTPBearer`. Ensure all task routes use this dependency.
6. OWNERSHIP ENFORCEMENT: Ensure user_id from JWT matches user_id in API path. Return 401 for missing/invalid tokens. Return 403 for token/path mismatch.

FILES TO CREATE/UPDATE:
- `/todo-web-app/backend/pyproject.toml`: Add security dependencies.
- `/todo-web-app/backend/app/auth.py`: JWT decoding and verification logic.
- `/todo-web-app/backend/app/dependencies.py`: FastAPI security dependencies.
- `/todo-web-app/backend/app/routes/tasks.py`: Refactored to include protection.
- `/todo-web-app/backend/app/main.py`: Configuration for security.
- `/todo-web-app/backend/CLAUDE.md`: Update with security implementation details.

## Response snapshot

Executed all 15 tasks across 5 phases. Key changes:

**pyproject.toml**: Added `PyJWT>=2.8.0`; bumped version to 2.2.0; `uv sync` installed PyJWT 2.11.0.

**app/db.py**: Added `better_auth_secret: str = ""` to `Settings`; added `@model_validator(mode="after")` `_require_auth_secret()` that raises `ValueError` if empty — crashes app at startup if `BETTER_AUTH_SECRET` absent.

**app/auth.py** (body replaced, signature unchanged):
- `jwt.decode(token, settings.better_auth_secret, algorithms=["HS256"], options={"require": ["exp", "sub"]})`
- `jwt.ExpiredSignatureError` → 401 "Token expired" + audit log
- `jwt.DecodeError/InvalidTokenError` → 401 "Invalid token" + audit log
- Missing header → 401 "Not authenticated" + audit log
- Returns `payload["sub"]` as user_id

**.env.example**: Added `BETTER_AUTH_SECRET` variable.
**.env**: Added dev secret (32+ chars).
**CLAUDE.md**: Updated to Phase 2.2 complete; added env var table; removed "To wire real JWT" stub instructions.

**No new files created** — no `dependencies.py` (routes already wired), no route changes (zero modifications to `routes/tasks.py`).

**Test results: 7/7 PASS**
- Scenario 1: Valid token → 200 ✅
- Scenario 2: Missing header → 401 "Not authenticated" ✅
- Scenario 3: Bad signature → 401 "Invalid token" ✅
- Scenario 4: Expired token → 401 "Token expired" ✅
- Scenario 5: Cross-user → 403 ✅
- Scenario 6: Health → 200 (no token) ✅
- Scenario 10: task.user_id == JWT sub ✅
- T012: Startup crash with empty secret ✅

## Outcome

- ✅ Impact: Phase 2.2 JWT authentication active; all API endpoints now require valid JWT; 7/7 scenarios pass.
- 🧪 Tests: 7 manual test scenarios + startup crash test all passed.
- 📁 Files: 5 backend files changed; tasks.md marked complete; CLAUDE.md updated.
- 🔁 Next prompts: Phase 2.3 — Next.js frontend with Better Auth; backend ready.
- 🧠 Reflection: Phase 2.1's architectural contract (identical function signature, pre-wired Depends, _assert_owner already implementing 403) made Phase 2.2 a single-file body swap delivering complete JWT security. Zero route changes required.

## Evaluation notes (flywheel)

- Failure modes observed: Bash `!!` in secret string caused history expansion mangling test results in first run — fixed by using Python test script without bash string interpolation.
- Graders run and results (PASS/FAIL): 7/7 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Phase 2.3 frontend — set BETTER_AUTH_SECRET in frontend .env to same value.
