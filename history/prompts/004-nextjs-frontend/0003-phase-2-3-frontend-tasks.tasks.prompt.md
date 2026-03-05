---
id: "0003"
title: Phase 2.3 Frontend Task List
stage: tasks
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 004-nextjs-frontend
branch: 004-nextjs-frontend
user: brownie
command: /sp.tasks
labels: ["nextjs", "better-auth", "typescript", "tailwind", "tasks", "phase-2.3", "lucide-react"]
links:
  spec: specs/004-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-nextjs-frontend/tasks.md
tests:
  - null
---

## Prompt

Generate a task list for Phase 2.3: Frontend Development & Integration in `/todo-web-app/specs/phase2-frontend-tasks.md` based strictly on the plan `@/todo-web-app/specs/phase2-frontend-plan.md`.

The task list must include:
1. SETUP & CONFIGURATION:
   - T-2.3.1: Next.js Scaffolding (Initialize Next.js 14+ in `/todo-web-app/frontend/`, configure Tailwind CSS and TypeScript).
   - T-2.3.2: Environment Setup (Define `NEXT_PUBLIC_BACKEND_URL` and `BETTER_AUTH_SECRET` in `.env.local`).

2. CORE UTILITIES:
   - T-2.3.3: API Client Implementation (Create `lib/api.ts` with a fetch wrapper that automatically injects the `Authorization: Bearer <token>` header).
   - T-2.3.4: Better Auth Client (Configure `lib/auth.ts` for frontend session management and JWT retrieval).

3. AUTHENTICATION UI:
   - T-2.3.5: Signup & Login Pages (Implement responsive forms using Tailwind; integrate with Better Auth client).
   - T-2.3.6: Auth Middleware (Implement Next.js middleware to protect the `/dashboard` path).

4. DASHBOARD & CRUD UI:
   - T-2.3.7: Dashboard Layout (Implement the main navigation and user profile display).
   - T-2.3.8: Task List & Item Components (Implement display logic for tasks; status checkboxes; delete/edit buttons).
   - T-2.3.9: Task Entry Component (Implement the form to create new tasks with Title and Description).
   - T-2.3.10: Integration & Revalidation (Wire UI components to the API client; implement `revalidatePath` or optimistic updates for a seamless experience).

5. VERIFICATION CRITERIA:
   - T-2.3.6 is verified when an unauthenticated user is redirected from `/dashboard` to `/login`.
   - T-2.3.10 is verified when a new task created in the UI appears in the Neon DB and the Task List simultaneously.

6. STYLISTIC RULES:
   - Use Task IDs in comments: `// [Task]: T-2.3.x`.
   - Use Lucide-react icons for UI actions (edit/delete/check) to match a "polished" look.

## Response snapshot

Generated `specs/004-nextjs-frontend/tasks.md` with 26 tasks across 6 phases:

**Phase 1 — Setup (T001–T004)**: Scaffold Next.js 14+ with `create-next-app`, install `better-auth pg lucide-react @types/pg`, create `.env.local` (4 required vars) and `.env.example`.

**Phase 2 — Foundational (T005–T009)**: `src/lib/auth.ts` (server Better Auth with `jwt()` plugin + `pg` adapter), `src/lib/auth-client.ts` (client `createAuthClient` + `jwtClient()`), `src/app/api/auth/[...all]/route.ts` (Better Auth Next.js handler), `src/middleware.ts` (route protection), `src/lib/api.ts` (6 typed functions + `fetchWithAuth` with Bearer injection + 401 → session-expired redirect).

**Phase 3 — US1 Auth (T010–T013)**: `sign-in/page.tsx`, `sign-up/page.tsx` (parallel), `SignOutButton.tsx`, root `page.tsx` (session-based redirect).

**Phase 4 — US2 CRUD (T014–T019)**: `dashboard/layout.tsx` with nav, `dashboard/actions.ts` (Server Actions + `revalidatePath`), `dashboard/page.tsx` (Server Component, fetches tasks), `TaskList.tsx`, `TaskItem.tsx` (Pencil/Trash2 icons, inline edit, optimistic toggle), `AddTaskForm.tsx` (validation, loading state).

**Phase 5 — US3 Filter (T020–T021)**: `FilterBar.tsx` (client-side array filter, 3 tabs), wire into dashboard page.

**Phase 6 — Polish (T022–T026)**: Responsive Tailwind audit (375px), backend-error banner, session-expired redirect in api.ts, `frontend/CLAUDE.md`, manual quickstart.md validation run.

Key additions from user input: `lucide-react` in T002; `<Pencil />`, `<Trash2 />`, `<Check />` icons in TaskItem; `// [Task]: T-2.3.x` comment mapping in Notes section.

## Outcome

- ✅ Impact: 26 tasks across 6 phases — US1 and US2 are P1 MVP; US3 and US4 are P2 polish.
- 🧪 Tests: No automated test tasks (not requested); 10 manual quickstart.md scenarios covered in T026.
- 📁 Files: 1 file created — `specs/004-nextjs-frontend/tasks.md`.
- 🔁 Next prompts: `/sp.implement` to execute all tasks.
- 🧠 Reflection: Critical dependency chain: Phase 2 → Phase 3 → Phase 4 → Phase 5. `auth.ts` (T005) must exist before middleware (T008) and dashboard page (T016). Server Actions (T015) before dashboard page (T016). `auth-client.ts` (T006) before `api.ts` (T009) since `fetchWithAuth` calls `authClient.token()`.

## Evaluation notes (flywheel)

- Failure modes observed: None — tasks map directly from plan.md execution order.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): During implementation, verify `authClient.token()` returns a non-null value inside a Next.js Server Action — if null, pass the token explicitly from the Client Component that calls the action.
