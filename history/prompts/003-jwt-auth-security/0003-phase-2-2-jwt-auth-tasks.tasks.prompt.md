---
id: "0003"
title: Phase 2.2 JWT Auth Security Tasks
stage: tasks
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 003-jwt-auth-security
branch: 003-jwt-auth-security
user: brownie
command: /sp.tasks
labels: ["jwt", "pyjwt", "fastapi", "authentication", "tasks", "phase-2.2"]
links:
  spec: specs/003-jwt-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-jwt-auth-security/tasks.md
tests:
  - null
---

## Prompt

Generate a task list for Phase 2.2: Authentication & JWT Security in `/todo-web-app/specs/phase2-auth-tasks.md` based strictly on the plan `@/todo-web-app/specs/phase2-auth-plan.md`.

The task list must include:
1. DEPENDENCY & CONFIG TASKS:
   - T-2.2.1: Security Dependencies (Update `pyproject.toml` with `PyJWT` and `cryptography`).
   - T-2.2.2: Environment Setup (Define and load `BETTER_AUTH_SECRET` in the backend configuration).

2. SECURITY LOGIC TASKS:
   - T-2.2.3: JWT Verification Utility (Create `app/auth.py` with logic to decode HS256 JWTs and validate expiration/claims).
   - T-2.2.4: FastAPI Security Dependency (Create `app/dependencies.py` using `HTTPBearer` to extract the token and provide the authenticated user object to routes).

3. ROUTE REFACTORING TASKS:
   - T-2.2.5: Secure Task Endpoints (Update all endpoints in `routes/tasks.py` to require the `get_current_user` dependency).
   - T-2.2.6: Ownership Enforcement (Implement logic to ensure that if a `user_id` is provided in the URL, it MUST match the `user_id` from the JWT, otherwise return 403 Forbidden).

4. VERIFICATION CRITERIA:
   - T-2.2.4 is verified when an API call without a header returns 401 Unauthorized.
   - T-2.2.6 is verified when a user with Token A tries to access `user_id_B/tasks` and receives 403 Forbidden.

5. STYLISTIC RULES:
   - Use Task IDs in comments: `# [Task]: T-2.2.x`.
   - Maintain the stateless nature of the server (no local sessions).

## Response snapshot

Generated `specs/003-jwt-auth-security/tasks.md` with 15 tasks across 5 phases:

**Phase 1 (Setup)**: T001 add PyJWT to pyproject.toml, T002 uv sync, T003 update .env.example [3 tasks]
**Phase 2 (Foundational)**: T004–T006 add `better_auth_secret` to Settings with `@model_validator` startup validation [3 tasks]
**Phase 3 (US1+US2 P1)**: T007 replace auth.py body (full implementation provided inline), T008 run 401 scenarios [2 tasks]
**Phase 4 (US3 P2)**: T009–T011 verification-only — cross-user 403, JWT sub identity, health check bypass [3 tasks]
**Phase 5 (Polish)**: T012 startup crash test, T013–T014 CLAUDE.md updates, T015 mark complete [4 tasks]

Key corrections vs. user prompt:
- `cryptography` package NOT needed (PyJWT uses `hmac` for HS256; only RSA/EC needs `cryptography`)
- `dependencies.py` NOT created (routes already wire `Depends(get_current_user_id)` from `auth.py`)
- `routes/tasks.py` ZERO changes (Depends + _assert_owner already implemented in Phase 2.1)
- US3 tasks are verification-only (the ownership enforcement already exists)
- Full auth.py implementation provided inline in T007 for immediate executability

## Outcome

- ✅ Impact: 15 executable tasks across 5 phases; Phase 2.2 implementable in ~4 file changes.
- 🧪 Tests: No automated tests (manual verification via quickstart.md scenarios).
- 📁 Files: 1 file created — `specs/003-jwt-auth-security/tasks.md`.
- 🔁 Next prompts: `/sp.implement` to execute T001–T015.
- 🧠 Reflection: The Phase 2.1 architectural contract (identical function signature, pre-wired Depends) delivered exactly what it promised — Phase 2.2 is genuinely a body-only swap.

## Evaluation notes (flywheel)

- Failure modes observed: User prompt listed `dependencies.py` and route changes that aren't needed — task generation correctly overrides with evidence from research.md and code review.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run `/sp.implement` immediately — 4 file changes, ~15 min total.
