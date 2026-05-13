---
id: "0003"
title: Phase 2 Backend API DB Tasks
stage: tasks
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 002-backend-api-db
branch: 002-backend-api-db
user: brownie
command: /sp.tasks
labels: ["tasks","phase-2","backend","fastapi","sqlmodel","neon","alembic","pydantic","crud","filtering","sorting"]
links:
  spec: specs/002-backend-api-db/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-api-db/tasks.md
tests:
  - null
---

## Prompt

Generate a task list for Phase 2.1: Backend API & Database in `/todo-web-app/specs/phase2-backend-tasks.md` based strictly on the plan `@/todo-web-app/specs/phase2-backend-plan.md`.

The task list must include:
1. INFRASTRUCTURE TASKS:
   - T-2.1.1: Backend Scaffolding (Initialize `uv` in `/todo-web-app/backend`, add dependencies: `fastapi`, `sqlmodel`, `psycopg2-binary`, `pydantic-settings`).
   - T-2.1.2: Database Configuration (Implement `db.py` with session management and environment variable loading for `DATABASE_URL`).

2. MODEL TASKS:
   - T-2.1.3: SQLModel Definitions (Create `models.py` with `User` and `Task` tables, including relationships and indexes defined in the spec).
   - T-2.1.4: Pydantic Schemas (Create `schemas.py` for `TaskCreate`, `TaskRead`, and `TaskUpdate` to ensure API contract validation).

3. ROUTE TASKS:
   - T-2.1.5: Task CRUD Implementation (Implement GET, POST, PUT, DELETE, PATCH endpoints in `routes/tasks.py` with filtering and sorting logic).
   - T-2.1.6: App Assembly (Wire everything into `main.py`, including CORS middleware and status health-check endpoint).

4. VERIFICATION CRITERIA:
   - Each task must define a manual verification step.

5. STYLISTIC RULES:
   - Use Task IDs in comments: `# [Task]: T-2.1.x`.
   - Ensure all database sessions are handled via FastAPI dependency injection.

## Response snapshot

Generated `specs/002-backend-api-db/tasks.md` with 27 tasks across 6 phases:
- Phase 1 (Setup/T-2.1.1): T001–T005 — uv init, dependencies, directory structure, .env.example, .gitignore
- Phase 2 (Foundational/T-2.1.2): T006–T009 — __init__.py, db.py (NullPool+get_session), auth.py stub, Alembic init
- Phase 3 (US1/T-2.1.3–T-2.1.6): T010–T019 — models.py, schemas.py, Alembic migration, router scaffold, 5 CRUD endpoints, main.py
- Phase 4 (US2): T020 — PATCH /complete toggle endpoint
- Phase 5 (US3): T021–T022 — status filter + sort query params on GET list
- Phase 6 (Polish): T023–T027 — README, CLAUDE.md, updated_at validation, user isolation check, quickstart run
Each task has an inline Verify step. Parallel opportunities mapped for phases 1, 2, 3.

## Outcome

- ✅ Impact: 27 executable tasks; 3 parallel batches identified; MVP = Phase 1+2+3 (T001–T019)
- 🧪 Tests: Not requested — manual verification steps embedded in each task
- 📁 Files: specs/002-backend-api-db/tasks.md
- 🔁 Next prompts: /sp.implement or /python-logic-skill to begin executing tasks
- 🧠 Reflection: Task granularity matches plan components exactly; all sessions via Depends(get_session); JWT stub clearly marked for Phase 2.2 replacement

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): phase-2-backend-tasks
- Next experiment (smallest change to try): run /sp.implement starting with Phase 1+2 setup tasks
