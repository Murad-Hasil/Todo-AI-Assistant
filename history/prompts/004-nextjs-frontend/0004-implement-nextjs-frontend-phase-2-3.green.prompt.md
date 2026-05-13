---
id: "0004"
title: Implement Next.js Frontend Phase 2.3
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 004-nextjs-frontend
branch: 004-nextjs-frontend
user: brownie
command: /sp.implement
labels: ["nextjs", "better-auth", "tailwind", "frontend", "phase-2-3"]
links:
  spec: specs/004-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/ (scaffolded via create-next-app@14)
  - todo-web-app/frontend/src/lib/auth.ts
  - todo-web-app/frontend/src/lib/auth-client.ts
  - todo-web-app/frontend/src/lib/api.ts
  - todo-web-app/frontend/src/middleware.ts
  - todo-web-app/frontend/src/app/api/auth/[...all]/route.ts
  - todo-web-app/frontend/src/app/page.tsx
  - todo-web-app/frontend/src/app/sign-in/page.tsx
  - todo-web-app/frontend/src/app/sign-up/page.tsx
  - todo-web-app/frontend/src/app/dashboard/layout.tsx
  - todo-web-app/frontend/src/app/dashboard/page.tsx
  - todo-web-app/frontend/src/app/dashboard/actions.ts
  - todo-web-app/frontend/src/components/SignOutButton.tsx
  - todo-web-app/frontend/src/components/TaskList.tsx
  - todo-web-app/frontend/src/components/TaskItem.tsx
  - todo-web-app/frontend/src/components/AddTaskForm.tsx
  - todo-web-app/frontend/src/components/FilterBar.tsx
  - todo-web-app/frontend/.env.local
  - todo-web-app/frontend/.env.example
  - todo-web-app/frontend/CLAUDE.md
  - specs/004-nextjs-frontend/tasks.md (tasks marked [X])
tests:
  - npx tsc --noEmit → 0 errors (TypeScript strict mode passes)
  - T026: manual browser scenarios pending (requires running backend + frontend)
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/phase2-frontend-tasks.md` for Phase 2.3: Frontend Development & Integration.

STRICT IMPLEMENTATION RULES:
1. DIRECTORY ISOLATION: All frontend code must be placed strictly within `/todo-web-app/frontend/`.
2. READ-BEFORE-WRITE: Before generating code, read the Phase 2 Constitution, the Backend API spec (@/todo-web-app/specs/api/rest-endpoints.md), and the Phase 2.3 Plan/Spec.
3. TASK MAPPING: Implement tasks T-2.3.1 through T-2.3.10 in sequence. Every file must include a comment at the top referencing the Task ID, e.g., `// [Task]: T-2.3.x`.
4. NEXT.JS ARCHITECTURE: Use Next.js 14+ App Router. Use Server Components for data fetching. Use Client Components only for interactive elements.
5. API CONNECTIVITY: All backend calls MUST use the central client in `/todo-web-app/frontend/lib/api.ts`. Ensure the `Authorization: Bearer <token>` header is correctly extracted from the Better Auth session.
6. STYLING: Use Tailwind CSS utility classes. Ensure the UI is responsive and provides clear feedback for loading and error states.

## Response snapshot

Implemented all T001–T025 tasks for Phase 2.3 Next.js Frontend:

**Phase 1 (Setup)**: Scaffolded Next.js 14 project with TypeScript, Tailwind, App Router, src-dir. Installed better-auth, pg, lucide-react, @types/pg.

**Phase 2 (Foundation)**: Created `src/lib/auth.ts` (server Better Auth with JWT plugin + pg adapter), `src/lib/auth-client.ts` (client createAuthClient + jwtClient), `src/app/api/auth/[...all]/route.ts` (catch-all handler), `src/middleware.ts` (route protection), `src/lib/api.ts` (6 typed functions with Bearer injection + error types).

**Phase 3 (US1 Auth)**: Created `sign-in/page.tsx` and `sign-up/page.tsx` (controlled forms, loading states), `SignOutButton.tsx`, root `page.tsx` redirect.

**Phase 4 (US2 CRUD)**: Created `dashboard/layout.tsx` (nav + SignOutButton), `dashboard/actions.ts` (Server Actions with revalidatePath), `dashboard/page.tsx` (session check + getTasks), `TaskList.tsx`, `TaskItem.tsx` (toggle/delete/inline edit with Pencil/Trash2/Check icons), `AddTaskForm.tsx`.

**Phase 5 (US3 Filter)**: Created `FilterBar.tsx` (client-side All/Pending/Completed tabs), wired into dashboard page.

**Phase 6 (Polish)**: Responsive Tailwind classes (min-h-[44px] touch targets, sm: breakpoints), backend-unreachable error banner in dashboard, session-expired redirect in api.ts + banner in sign-in page, CLAUDE.md created.

TypeScript: `npx tsc --noEmit` → 0 errors.

## Outcome

- ✅ Impact: All T001–T025 implemented; full frontend stack ready for manual browser testing
- 🧪 Tests: TypeScript strict mode passes (0 errors); T026 manual browser scenarios require running backend+frontend
- 📁 Files: 19 files created/modified across frontend/src/ and specs/
- 🔁 Next prompts: Set BETTER_AUTH_SECRET in .env.local to match backend; run `npm run dev` and `uvicorn` backend; execute T026 quickstart scenarios
- 🧠 Reflection: The dashboard page fetches tasks server-side and passes the full array to FilterBar (client-side filter — no API round-trips on filter change). Server Actions call api.ts and revalidate /dashboard for immediate CRUD feedback.

## Evaluation notes (flywheel)

- Failure modes observed: TypeScript implicit any on tasks variable in dashboard/page.tsx — fixed with explicit Task[] type annotation
- Graders run and results (PASS/FAIL): TypeScript check PASS
- Prompt variant (if applicable): sp.implement with sp.checklist gate (all [x] — proceeded automatically)
- Next experiment (smallest change to try): Add SWR for optimistic mutations; add error boundaries; add password confirmation to sign-up form
