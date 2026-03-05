---
id: "0001"
title: Phase 2.2 JWT Auth Security Spec
stage: spec
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 003-jwt-auth-security
branch: 003-jwt-auth-security
user: brownie
command: /sp.specify
labels: ["jwt", "authentication", "security", "phase-2.2", "better-auth"]
links:
  spec: specs/003-jwt-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-jwt-auth-security/spec.md
  - specs/003-jwt-auth-security/api/auth-flow.md
  - specs/003-jwt-auth-security/api/security-rules.md
  - specs/003-jwt-auth-security/checklists/requirements.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 2.2: Authentication & JWT Security in the `/todo-web-app/specs/` directory, derived strictly from the Project PDF (Pages 7, 8, and 15).

The specification must cover:
1. AUTHENTICATION FLOW (@specs/api/auth-flow.md):
   - Frontend (Better Auth) logs in -> Issues JWT.
   - Frontend includes JWT in `Authorization: Bearer <token>` header for all API calls.
   - Backend extracts, verifies signature using `BETTER_AUTH_SECRET`, and decodes the token.
   - Backend identifies `user_id` from the decoded payload.

2. SECURITY CONSTRAINTS (@specs/api/security-rules.md):
   - All `/api/*` endpoints (except health checks) MUST require a valid JWT.
   - Missing or invalid tokens must return `401 Unauthorized`.
   - Token ownership enforcement: Users can ONLY see/modify tasks where `task.user_id == authenticated_user_id`.

3. SHARED SECRET LOGIC:
   - Define the requirement for `BETTER_AUTH_SECRET` environment variable on both frontend and backend.

4. ACCEPTANCE CRITERIA:
   - Successful JWT decode results in a populated `request.state.user` object in FastAPI.
   - Database queries in `routes/tasks.py` must transition from path-based `{user_id}` to token-derived `user_id`.
   - Unauthorized attempts must be logged (security auditing).

## Response snapshot

Created the complete Phase 2.2 specification across 4 files:

- **spec.md**: 3 user stories (US1: valid JWT access P1, US2: invalid token rejection P1, US3: token-derived identity P2), 10 FRs, 6 SCs, edge cases, assumptions.
- **api/auth-flow.md**: Step-by-step auth flow (login → JWT → Bearer header → verify → sub → user_id), error response table, Phase 2.1 → 2.2 transition table.
- **api/security-rules.md**: Protected endpoint table, token validity rules, user isolation rules, `BETTER_AUTH_SECRET` requirements, audit log fields, out-of-scope items.
- **checklists/requirements.md**: All quality items marked [x] — spec is ready for `/sp.plan`.

Key design decisions:
- Only `app/auth.py` body changes between Phase 2.1 and 2.2 (zero route changes).
- `user_id` from JWT `sub` claim only — never from request body or URL.
- HTTP 404 (not 403) for cross-user task access to prevent enumeration.
- App refuses to start if `BETTER_AUTH_SECRET` is absent.
- Audit log on every rejected token.

## Outcome

- ✅ Impact: Phase 2.2 spec fully defined; ready for technical planning (`/sp.plan`).
- 🧪 Tests: No tests run (spec stage).
- 📁 Files: 4 files created under `specs/003-jwt-auth-security/`.
- 🔁 Next prompts: `/sp.plan` for Phase 2.2 technical plan; then `/sp.tasks`; then `/sp.implement` to replace `auth.py` stub.
- 🧠 Reflection: The Phase 2.1 auth stub was designed with identical function signature to Phase 2.2, making the transition a single-file body swap — a clean architectural constraint enforced by the spec.

## Evaluation notes (flywheel)

- Failure modes observed: Write tool required read-first on template file created by create-new-feature.sh — always read before write even for freshly scaffolded files.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add PyJWT version constraint to pyproject.toml in the plan phase.
