---
id: "0001"
title: Phase 2.3 Frontend Development Spec
stage: spec
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 004-nextjs-frontend
branch: 004-nextjs-frontend
user: brownie
command: /sp.specify
labels: ["nextjs", "frontend", "better-auth", "tailwind", "typescript", "phase-2.3"]
links:
  spec: specs/004-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-nextjs-frontend/spec.md
  - specs/004-nextjs-frontend/ui/architecture.md
  - specs/004-nextjs-frontend/ui/auth-pages.md
  - specs/004-nextjs-frontend/ui/dashboard.md
  - specs/004-nextjs-frontend/ui/api-client.md
  - specs/004-nextjs-frontend/checklists/requirements.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 2.3: Frontend Development & Integration in the `/todo-web-app/specs/` directory, derived strictly from the Project PDF (Pages 7, 11, and 12).

The specification must cover:
1. UI ARCHITECTURE (@specs/ui/architecture.md): Framework: Next.js 14+ (App Router) with TypeScript. Styling: Tailwind CSS. Component Strategy: Server Components by default; Client Components only for interactivity.
2. AUTHENTICATION UI (@specs/ui/auth-pages.md): Sign-up and Sign-in pages using Better Auth. Better Auth must issue JWT tokens that the backend can verify.
3. TODO DASHBOARD (@specs/ui/dashboard.md): Task List (Title, Status, Created Date). Add Task form. Task Item actions (Delete, Update). Filtering by all/pending/completed.
4. API CLIENT (@specs/ui/api-client.md): All backend calls through `@/lib/api.ts`. Automatically attach JWT to Authorization header.
5. ACCEPTANCE CRITERIA: Redirect to login if no session. Responsive UI. CRUD changes reflected immediately.

## Response snapshot

Created 6 files for Phase 2.3 spec:

- **spec.md**: 4 user stories (US1: sign-up/sign-in P1, US2: task CRUD P1, US3: filter P2, US4: responsive P2), 15 FRs, 6 SCs, 6 edge cases, 6 assumptions.
- **ui/architecture.md**: Page structure tree, Server vs Client Component decision table, responsive breakpoints, error handling contract.
- **ui/auth-pages.md**: Sign-up/sign-in field specs, Better Auth JWT config requirements (strategy: jwt, algorithm: HS256, shared secret), redirect logic table.
- **ui/dashboard.md**: ASCII layout mockup, task list columns, add-task form, edit-task behaviour, filter tabs, mobile layout spec.
- **ui/api-client.md**: 6 typed helper functions (getTasks, createTask, getTask, updateTask, deleteTask, toggleTask), error handling contract table, TypeScript types required.
- **checklists/requirements.md**: All 12 quality items ✅.

Key design decisions:
- US1 and US2 are both P1 (co-equal MVP requirements)
- US3 and US4 are P2 (valuable but independently deliverable after P1)
- Better Auth must be configured with `session.strategy: "jwt"` to issue JWTs
- `BETTER_AUTH_SECRET` must match backend value exactly
- API client handles 401 → redirect to `/sign-in?reason=session_expired`
- Out of scope: social login, password reset, offline mode, real-time sync

## Outcome

- ✅ Impact: Phase 2.3 spec fully defined; 4 user stories, 15 FRs, 6 SCs — ready for `/sp.plan`.
- 🧪 Tests: No tests run (spec stage).
- 📁 Files: 6 files created in `specs/004-nextjs-frontend/`.
- 🔁 Next prompts: `/sp.plan` for Phase 2.3 technical plan (Next.js setup, Better Auth config, component architecture, API client design).
- 🧠 Reflection: The Better Auth → JWT → backend verification chain requires careful configuration coordination. The API client is the single point of failure for auth header attachment — centralizing it prevents auth bypass bugs.

## Evaluation notes (flywheel)

- Failure modes observed: None — straightforward spec from well-defined requirements.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Confirm Better Auth JWT session strategy in the plan phase — this is the highest-risk integration point.
