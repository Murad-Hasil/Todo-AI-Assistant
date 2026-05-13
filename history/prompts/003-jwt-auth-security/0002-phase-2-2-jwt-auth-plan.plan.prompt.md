---
id: "0002"
title: Phase 2.2 JWT Auth Technical Plan
stage: plan
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 003-jwt-auth-security
branch: 003-jwt-auth-security
user: brownie
command: /sp.plan
labels: ["jwt", "pyjwt", "fastapi", "authentication", "phase-2.2", "planning"]
links:
  spec: specs/003-jwt-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-jwt-auth-security/plan.md
  - specs/003-jwt-auth-security/research.md
  - specs/003-jwt-auth-security/data-model.md
  - specs/003-jwt-auth-security/quickstart.md
  - specs/003-jwt-auth-security/contracts/auth-middleware.yaml
tests:
  - null
---

## Prompt

Generate the technical plan for Phase 2.2: Authentication & JWT Security in `/todo-web-app/specs/phase2-auth-plan.md` based strictly on the approved specs in `@/todo-web-app/specs/api/auth-flow.md` and `@/todo-web-app/specs/api/security-rules.md`.

The plan must include:
1. JWT VERIFICATION ENGINE:
   - Library: `PyJWT` or `python-jose`.
   - Secret Management: Use `BETTER_AUTH_SECRET` environment variable.
   - Algorithm: HS256 (standard for shared secret JWTs).
   - Logic: A utility function to decode and validate the `sub` (user_id), `email`, and expiration claims.

2. FASTAPI SECURITY DEPENDENCY:
   - Implement an `get_current_user` dependency using `HTTPBearer`.
   - Logic: Extract token -> Verify Signature -> Decode -> Return user data object.
   - Error Handling: Raise `HTTPException(status_code=401)` for invalid, expired, or missing tokens.

3. ROUTE REFACTORING STRATEGY:
   - Update `routes/tasks.py` to use the `get_current_user` dependency.
   - PDF Alignment: While the PDF mentions `/api/{user_id}/tasks`, it mandates that the backend MUST verify the token matches the ID in the URL.
   - Security Logic: If `token.user_id != url.user_id`, return `403 Forbidden`.

4. COMPONENT BREAKDOWN:
   - `app/auth.py`: JWT decoding and verification logic.
   - `app/dependencies.py`: FastAPI security dependencies.
   - `app/routes/tasks.py`: Refactored endpoints with protection.

5. ENVIRONMENT CONFIG:
   - Update `.env` requirements to include `BETTER_AUTH_SECRET`.

## Response snapshot

Generated 5 planning artifacts:

- **research.md**: 5 decisions — PyJWT>=2.8.0 chosen over python-jose (CVEs, overkill); Better Auth JWT `sub` claim as user_id; pydantic Settings `@model_validator` for startup validation; Python `logging` for audit events; zero route changes confirmed (existing Depends already wired).
- **data-model.md**: No new DB entities; JWT is stateless. Settings gains `better_auth_secret` field.
- **contracts/auth-middleware.yaml**: OpenAPI 3.1 cross-cutting auth layer contract with exception→response mapping.
- **quickstart.md**: 7 manual test scenarios covering valid token, missing token, bad signature, expired token, cross-user 403, health check bypass, and startup crash on missing secret.
- **plan.md**: Full implementation plan with constitution check (8/8 ✅), component designs, and execution order T-2.2.1 → T-2.2.6.

**Key architectural finding**: `routes/tasks.py` requires ZERO changes — it already wires `Depends(get_current_user_id)` and `_assert_owner()` enforces URL/token user_id matching with 403. Only `app/auth.py` body, `app/db.py` Settings, `pyproject.toml`, and `.env.example` change.

## Outcome

- ✅ Impact: Phase 2.2 technical plan complete; 6 implementation tasks defined (T-2.2.1 → T-2.2.6).
- 🧪 Tests: No tests run (plan stage).
- 📁 Files: 5 artifacts created in `specs/003-jwt-auth-security/`.
- 🔁 Next prompts: `/sp.tasks` for Phase 2.2 task list; then `/sp.implement`.
- 🧠 Reflection: Phase 2.1 was designed with identical function signature precisely so Phase 2.2 would be a single-file body swap — the architectural contract held perfectly.

## Evaluation notes (flywheel)

- Failure modes observed: User input mentioned `dependencies.py` and route changes, but existing code review showed routes are already fully wired — plan correctly overrides the prompt with evidence.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run `/sp.tasks` then `/sp.implement` immediately; implementation is 4 file changes.
