---
id: "0002"
title: Phase 2.3 Frontend Technical Plan
stage: plan
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 004-nextjs-frontend
branch: 004-nextjs-frontend
user: brownie
command: /sp.plan
labels: ["nextjs", "better-auth", "typescript", "tailwind", "plan", "phase-2.3"]
links:
  spec: specs/004-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-nextjs-frontend/research.md
  - specs/004-nextjs-frontend/data-model.md
  - specs/004-nextjs-frontend/quickstart.md
  - specs/004-nextjs-frontend/plan.md
  - specs/004-nextjs-frontend/contracts/frontend-api-contract.yaml
tests:
  - null
---

## Prompt

Generate the technical plan for Phase 2.3: Frontend Development & Integration in `/todo-web-app/specs/phase2-frontend-plan.md` based strictly on the approved specs in `@/todo-web-app/specs/ui/`.

The plan must include:
1. FRONTEND ARCHITECTURE:
   - Framework: Next.js 14+ (App Router).
   - Language: TypeScript with strict type checking.
   - Styling: Tailwind CSS for responsive utility-first design.
   - Folder Structure:
     - `/app`: Pages and layouts (Dashboard, Login, Register).
     - `/components`: Reusable UI components (TaskItem, TaskForm, Navbar).
     - `/lib`: API client (`api.ts`) and Auth configuration (`auth.ts`).

2. BETTER AUTH INTEGRATION:
   - Configuration: Setup Better Auth client to handle signup/signin.
   - JWT Handling: Ensure the client-side session provides the JWT required by the backend.
   - Middleware: Implement Next.js middleware to protect the `/dashboard` route, redirecting unauthenticated users to `/login`.

3. API CLIENT STRATEGY (@/lib/api.ts):
   - Implementation: A typed wrapper around `fetch`.
   - Authorization: A helper to automatically inject the `Authorization: Bearer <token>` header into every outgoing request to the FastAPI backend.
   - Base URL: Configurable via `NEXT_PUBLIC_BACKEND_URL`.

4. COMPONENT BREAKDOWN:
   - Server Components: Main dashboard layout and initial task fetching for SEO/Performance.
   - Client Components: Interactive elements like the "Add Task" modal, "Complete" toggle, and "Delete" button.

5. STATE MANAGEMENT & DATA FETCHING:
   - Use Next.js `server actions` or `route handlers` for data mutations.
   - Implement `revalidatePath` to ensure the UI stays in sync with the database after updates.

## Response snapshot

Generated 5 design artifacts for Phase 2.3:

- **research.md**: 7 decisions — Better Auth `jwt()` plugin for HS256 JWT issuance, Better Auth's PostgreSQL adapter sharing the Neon instance, hybrid data fetching (Server Components for initial load + Client Components for mutations + `revalidatePath`), Next.js `middleware.ts` pattern for route protection, package versions, env vars configuration, zero backend changes.

- **data-model.md**: TypeScript types (`Task`, `TaskCreateInput`, `TaskUpdateInput`, `TaskListResponse`, `TaskSingleResponse`, `StatusFilter`, `SortOrder`), Better Auth auto-managed tables (`user`, `session`, `account`, `verification`), frontend session shape, no new backend tables or migrations.

- **contracts/frontend-api-contract.yaml**: OpenAPI 3.1 spec for all 6 task endpoints — `getTasks`, `createTask`, `getTask`, `updateTask`, `deleteTask`, `toggleTask`. All routes include `Authorization: Bearer` and use `userId` path param matching JWT sub.

- **quickstart.md**: 10 integration test scenarios covering sign-up flow, route protection, create/toggle/delete tasks, filter tabs, JWT expiry handling, auth header verification, form validation, and responsive layout.

- **plan.md**: Full implementation plan — 8-principle constitution check (all ✅), component specs for `auth.ts`, `auth-client.ts`, `api.ts`, `middleware.ts`, dashboard page (Server Component), `TaskItem`/`AddTaskForm`/`FilterBar` (Client Components), execution order (Phases A–H: scaffold → auth → API client → auth pages → dashboard → filtering → polish → docs), env vars table.

Key design decisions:
- `better-auth` with `jwt()` plugin issues stateless HS256 JWTs; `authClient.token()` fetches current JWT for API calls
- `BETTER_AUTH_SECRET` is server-only (no `NEXT_PUBLIC_` prefix) and must match backend value exactly
- Better Auth uses `pg` adapter (not Drizzle) on the same Neon PostgreSQL instance
- Client-side filtering (no API round-trip on filter change) satisfies SC-002 (<500ms)
- All 6 task endpoints through a single `src/lib/api.ts` module with `fetchWithAuth` helper

## Outcome

- ✅ Impact: Phase 2.3 technical plan complete; 5 design artifacts ready for `/sp.tasks`.
- 🧪 Tests: No tests run (plan stage); 10 manual integration scenarios in quickstart.md.
- 📁 Files: 5 files created in `specs/004-nextjs-frontend/` (research.md, data-model.md, contracts/frontend-api-contract.yaml, quickstart.md, plan.md).
- 🔁 Next prompts: `/sp.tasks` to generate task list for Phase 2.3 implementation; then `/sp.implement`.
- 🧠 Reflection: The `authClient.token()` call before every API request is the critical integration point — if the JWT plugin is not configured on both server (`auth.ts`) and client (`auth-client.ts`), `token()` will return null and all API calls will fail with 401. The quickstart Scenario 8 specifically validates this.

## Evaluation notes (flywheel)

- Failure modes observed: None — plan follows established patterns from Phase 2.2 backend planning.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Verify `authClient.token()` works in a Next.js 14 Server Action context — this is the highest-risk integration point for Phase 2.3 implementation.
