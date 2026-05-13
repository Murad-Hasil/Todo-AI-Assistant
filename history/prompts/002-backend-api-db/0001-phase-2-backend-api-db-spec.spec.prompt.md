---
id: "0001"
title: Phase 2 Backend API DB Spec
stage: spec
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 002-backend-api-db
branch: 002-backend-api-db
user: brownie
command: /sp.specify
labels: ["spec","phase-2","backend","api","database","fastapi","sqlmodel","jwt","neon","postgresql"]
links:
  spec: specs/002-backend-api-db/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-api-db/spec.md
  - specs/002-backend-api-db/database/schema.md
  - specs/002-backend-api-db/api/rest-endpoints.md
  - specs/002-backend-api-db/checklists/requirements.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 2.1: Backend API & Database in the `/todo-web-app/specs/` directory, derived strictly from the Project PDF (Pages 7, 12, and 14).

The specification must cover:
1. DATABASE SCHEMA (@specs/database/schema.md):
   - Table `users`: Managed by Better Auth (id, email, name, created_at).
   - Table `tasks`: id (Primary Key), user_id (Foreign Key -> users.id), title (1-200 chars), description (optional, max 1000), completed (boolean, default false), created_at, updated_at.
   - Required Indexes: `user_id` (for filtering) and `completed` (for status filtering).

2. REST API ENDPOINTS (@specs/api/rest-endpoints.md):
   - GET `/api/{user_id}/tasks`: List all tasks for a specific user.
   - POST `/api/{user_id}/tasks`: Create a new task.
   - GET `/api/{user_id}/tasks/{id}`: Get specific task details.
   - PUT `/api/{user_id}/tasks/{id}`: Update task title/description.
   - DELETE `/api/{user_id}/tasks/{id}`: Remove a task.
   - PATCH `/api/{user_id}/tasks/{id}/complete`: Toggle task completion.

3. QUERY PARAMETERS:
   - Support `status` ("all", "pending", "completed").
   - Support `sort` ("created", "title", "due_date").

4. ACCEPTANCE CRITERIA:
   - API must return JSON responses.
   - Backend must use SQLModel for all DB operations.
   - Data validation must use Pydantic (referenced in Backend CLAUDE.md Page 12).

## Response snapshot

Created branch `002-backend-api-db` and 4 spec artifacts:
- `specs/002-backend-api-db/spec.md` — main feature spec with 3 user stories (P1: task CRUD,
  P2: completion toggle, P3: filter/sort), 12 FRs, 6 SCs, edge cases, assumptions
- `specs/002-backend-api-db/database/schema.md` — full schema for `users` (Better Auth) and
  `tasks` tables; 3 indexes (user_id, completed, composite); FK cascade delete; migration notes
- `specs/002-backend-api-db/api/rest-endpoints.md` — all 6 endpoints with request/response
  contracts, error taxonomy, 404-not-403 security pattern, global auth rules
- `specs/002-backend-api-db/checklists/requirements.md` — all items passed; ready for /sp.plan

## Outcome

- ✅ Impact: Full spec suite for Phase 2.1 Backend API & Database created; all 6 endpoints contracted
- 🧪 Tests: N/A — spec artifact, no code tests
- 📁 Files: specs/002-backend-api-db/spec.md, database/schema.md, api/rest-endpoints.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan to generate architecture plan for 002-backend-api-db
- 🧠 Reflection: Spec is clean, complete, and free of NEEDS CLARIFICATION markers; due_date deferral documented

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): phase-2-backend-spec
- Next experiment: run /sp.plan with backend architecture for FastAPI + SQLModel + Neon
