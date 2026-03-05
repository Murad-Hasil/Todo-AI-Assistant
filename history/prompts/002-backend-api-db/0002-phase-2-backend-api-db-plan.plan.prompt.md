---
id: "0002"
title: Phase 2 Backend API DB Plan
stage: plan
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 002-backend-api-db
branch: 002-backend-api-db
user: brownie
command: /sp.plan
labels: ["plan","phase-2","backend","fastapi","sqlmodel","neon","postgresql","alembic","pydantic","jwt-stub"]
links:
  spec: specs/002-backend-api-db/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-api-db/plan.md
  - specs/002-backend-api-db/research.md
  - specs/002-backend-api-db/data-model.md
  - specs/002-backend-api-db/quickstart.md
  - specs/002-backend-api-db/contracts/tasks-api.yaml
tests:
  - null
---

## Prompt

Generate the technical plan for Phase 2.1: Backend API & Database in `/todo-web-app/specs/phase2-backend-plan.md` based strictly on the approved specs in `@/todo-web-app/specs/api/` and `@/todo-web-app/specs/database/`.

The plan must include:
1. BACKEND ARCHITECTURE:
   - Framework: FastAPI with Python 3.13.
   - ORM: SQLModel (integrating SQLAlchemy and Pydantic).
   - Database: Connection pooling for Neon Serverless PostgreSQL using `DATABASE_URL`.
2. COMPONENT BREAKDOWN:
   - `models.py`: Definitions for `User` and `Task` SQLModels with appropriate relationships and field constraints.
   - `db.py`: Database engine initialization and a session dependency (`get_session`) for FastAPI.
   - `routes/tasks.py`: Implementation of the CRUD endpoints using FastAPI `APIRouter`.
   - `main.py`: Application entry point, CORS middleware configuration, and router registration.
3. DATA VALIDATION:
   - Define Pydantic "Create" and "Read" schemas to separate internal DB models from external API contracts.
   - Implement error handling for 404 (Not Found) and 422 (Validation Error).
4. PROJECT STRUCTURE:
   - Root: `/todo-web-app/backend/`
   - Source: `/todo-web-app/backend/app/` (containing models, routes, and db).
5. SECURITY STUB:
   - For this sub-phase (2.1), implement endpoints with a placeholder for user validation until the JWT middleware is added in Phase 2.2.

## Response snapshot

Generated 5 plan artifacts for `002-backend-api-db`:
- `plan.md`: Full implementation plan — constitution check (all 8 principles ✅), component
  specs for db.py/models.py/schemas.py/auth.py/routes/tasks.py/main.py, validation strategy,
  complexity tracking (2 acknowledged deferrals: JWT stub + app-layer FK), risk register
- `research.md`: 8 decisions — psycopg2 sync driver, NullPool for Neon, Alembic migrations,
  Pydantic schema separation, app-layer FK enforcement, CORS via env, auth stub safeguard,
  response envelope shape
- `data-model.md`: Task entity fields, SQLModel class sketch, all Pydantic schemas, query
  param enums, state transition diagram, index rationale
- `quickstart.md`: Full developer setup — env, migrations, curl examples, test commands,
  troubleshooting table, Phase 2.2 migration notes
- `contracts/tasks-api.yaml`: OpenAPI 3.1 contract for all 6 endpoints with full schema
  definitions, error responses, and security scheme
Agent context updated via update-agent-context.sh.

## Outcome

- ✅ Impact: Complete backend plan for Phase 2.1; all 6 endpoints designed; constitution ✅; ready for /sp.tasks
- 🧪 Tests: N/A — plan artifact; test strategy defined in plan.md (pytest + httpx)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/tasks-api.yaml
- 🔁 Next prompts: /sp.tasks to generate implementation task list for 002-backend-api-db
- 🧠 Reflection: NullPool decision is critical for Neon serverless; JWT stub design ensures Phase 2.2 is a drop-in swap

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): phase-2-backend-plan
- Next experiment: run /sp.tasks to generate granular task list; then /sp.implement
