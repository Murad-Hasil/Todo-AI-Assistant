# Implementation Plan: Phase 2.3 — Frontend Development & Integration

**Branch**: `004-nextjs-frontend` | **Date**: 2026-03-03 | **Spec**: specs/004-nextjs-frontend/spec.md
**Input**: Feature specification from `/specs/004-nextjs-frontend/spec.md`

## Summary

Build a Next.js 14+ (App Router) TypeScript frontend that connects to the Phase 2.2 FastAPI backend. The frontend uses Better Auth with the `jwt()` plugin for email/password authentication, issues HS256 JWTs shared with the backend, protects routes via Next.js middleware, and exposes a centralized typed API client (`src/lib/api.ts`) that attaches Bearer tokens to all backend requests. All task CRUD operations go through the backend REST API. No backend changes are required.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14.x (App Router), better-auth ^1.x, tailwindcss ^3.x, @types/react ^18.x
**Storage**: Neon Serverless PostgreSQL (for Better Auth user/session tables — same instance as backend)
**Testing**: Manual browser scenarios (quickstart.md); no automated frontend test framework in Phase 2.3
**Target Platform**: Browser (modern Chromium/Firefox/Safari), Node.js 20+ for server runtime
**Project Type**: Web application (frontend only — `todo-web-app/frontend/`)
**Performance Goals**: Task list changes visible in <500ms (SC-002); initial page load <3s on broadband
**Constraints**: Zero backend code changes; `BETTER_AUTH_SECRET` identical between frontend and backend; no social login; no offline mode
**Scale/Scope**: Single user session per browser; up to ~100 tasks per user (no pagination required in Phase 2.3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| P1 — Spec-Driven | ✅ PASS | spec.md, ui/*.md, research.md, data-model.md, contracts/ all complete |
| P2 — API First | ✅ PASS | All task operations via FastAPI REST; no direct DB access from frontend JS |
| P3 — Multi-User Isolation | ✅ PASS | Better Auth session scopes every API call by user_id; path contains userId |
| P4 — JWT Security | ✅ PASS | `BETTER_AUTH_SECRET` shared; `jwt()` plugin issues HS256 JWTs; Bearer header on all calls |
| P5 — Read-Before-Write | ✅ PASS | All existing backend contracts confirmed before new frontend code; zero backend edits |
| P6 — No Destructive Integration | ✅ PASS | Phase 2.3 adds only frontend; Phase 2.2 backend entirely unchanged |
| P7 — Monorepo Pattern | ✅ PASS | Frontend in `todo-web-app/frontend/`; root CLAUDE.md maintained |
| P8 — Pydantic/Strict Typing | ✅ PASS | TypeScript strict mode; all API types in `src/lib/api.ts`; no `any` types |

**Post-design re-check**: All 8 principles satisfied. No gate violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-nextjs-frontend/
├── plan.md                          # This file
├── spec.md                          # Feature requirements
├── research.md                      # Phase 0 output — 7 decisions
├── data-model.md                    # TypeScript types + Better Auth tables
├── quickstart.md                    # Integration test scenarios
├── contracts/
│   └── frontend-api-contract.yaml  # OpenAPI 3.1 for all 6 task endpoints
├── ui/
│   ├── architecture.md             # Page tree, Server/Client component table
│   ├── auth-pages.md               # Sign-up/sign-in specs
│   ├── dashboard.md                # ASCII layout, filter bar
│   └── api-client.md               # 6 typed functions, error contract
└── checklists/
    └── requirements.md             # All [x] quality checklist
```

### Source Code

```text
todo-web-app/frontend/              # Next.js 14+ App Router project
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (html, body, font, globals.css)
│   │   ├── page.tsx                # Root → redirect to /dashboard or /sign-in
│   │   ├── sign-in/
│   │   │   └── page.tsx            # Sign-in page (Client Component)
│   │   ├── sign-up/
│   │   │   └── page.tsx            # Sign-up page (Client Component)
│   │   └── dashboard/
│   │       ├── layout.tsx          # Dashboard layout (Server Component — checks session)
│   │       └── page.tsx            # Dashboard page (Server Component — fetches tasks)
│   ├── components/
│   │   ├── TaskList.tsx            # Server Component: renders task items from props
│   │   ├── TaskItem.tsx            # Client Component: toggle, delete, inline edit
│   │   ├── AddTaskForm.tsx         # Client Component: controlled form, Server Action submit
│   │   ├── FilterBar.tsx           # Client Component: "All" / "Pending" / "Completed" tabs
│   │   └── SignOutButton.tsx       # Client Component: calls authClient.signOut()
│   ├── lib/
│   │   ├── auth.ts                 # Server-side Better Auth instance (betterAuth + jwt())
│   │   ├── auth-client.ts          # Client-side auth client (createAuthClient + jwtClient())
│   │   └── api.ts                  # Typed API client (fetch wrapper + Bearer injection)
│   └── middleware.ts               # Route protection — redirect /dashboard if no session
├── .env.local                      # BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL, NEXT_PUBLIC_API_URL
├── .env.example                    # Documented template (no secrets)
├── next.config.js                  # Next.js config (no special settings for Phase 2.3)
├── tailwind.config.js              # Tailwind config
├── postcss.config.js               # PostCSS config (required by Tailwind)
├── tsconfig.json                   # TypeScript strict mode
├── package.json                    # Dependencies
└── CLAUDE.md                       # Frontend agent context
```

**Structure Decision**: Single Next.js project in `todo-web-app/frontend/`. Backend in `todo-web-app/backend/` is untouched. Standard Next.js App Router conventions: `app/` for pages/layouts, `components/` for UI, `lib/` for auth and API client.

---

## Phase 0: Research Summary

Full decisions documented in `research.md`. Key points for implementation:

1. **Better Auth JWT Plugin**: Use `betterAuth({ plugins: [jwt()] })`. Exposes `/api/auth/token` endpoint. Client uses `createAuthClient({ plugins: [jwtClient()] })` → `authClient.token()` returns current JWT string.

2. **Shared Secret**: `BETTER_AUTH_SECRET` (server-only, no `NEXT_PUBLIC_` prefix) must exactly match `BETTER_AUTH_SECRET` in backend `.env`. Used to sign/verify HS256 JWTs.

3. **Better Auth Database**: Better Auth manages `user`, `session`, `account`, `verification` tables in the same Neon PostgreSQL instance. `DATABASE_URL` passed to Better Auth's PostgreSQL adapter. No Drizzle/Prisma ORM needed — use `better-auth/adapters/pg` with `pg` package.

4. **Data Fetching**: Server Components for initial task list (dashboard page server-renders the list). Client Components (TaskItem, AddTaskForm) for mutations. Server Actions call backend → `revalidatePath('/dashboard')`. Client-side filter: filter already-fetched array in component state, no API round-trip.

5. **Middleware**: `src/middleware.ts` using `auth.api.getSession()`. Protects `/dashboard/**`. Redirects authenticated users away from `/sign-in` and `/sign-up`.

---

## Phase 1: Component Specifications

### 1.1 `src/lib/auth.ts` (Server-Side)

```typescript
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  plugins: [jwt()],
  emailAndPassword: { enabled: true },
})
```

**Key constraint**: `BETTER_AUTH_SECRET` is server-only. Never use `NEXT_PUBLIC_BETTER_AUTH_SECRET`.

### 1.2 `src/lib/auth-client.ts` (Client-Side)

```typescript
"use client"
import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "",
  plugins: [jwtClient()],
})
```

**Note**: `NEXT_PUBLIC_AUTH_URL` = the Next.js app base URL (same origin as frontend).

### 1.3 `src/lib/api.ts` (Typed API Client)

The API client:
- Calls `authClient.token()` before every request to get the current JWT
- Sets `Authorization: Bearer <token>` on every request
- Sets base URL from `NEXT_PUBLIC_API_URL`
- On 401 response: redirects to `/sign-in?reason=session_expired`
- Throws typed errors for 404, 422, 500

```typescript
// Exports: getTasks, createTask, getTask, updateTask, deleteTask, toggleTask
// All functions accept userId as first argument (from Better Auth session)
// All functions use the shared fetchWithAuth helper
```

Full typed function signatures are defined in `specs/004-nextjs-frontend/ui/api-client.md`.

### 1.4 `src/middleware.ts`

```typescript
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
  if (session && (request.nextUrl.pathname === "/sign-in" ||
                  request.nextUrl.pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"]
}
```

### 1.5 Dashboard Page (`src/app/dashboard/page.tsx`)

- Server Component
- Calls `auth.api.getSession({ headers: headers() })` — if no session, redirect (middleware handles first, this is a safety net)
- Calls `getTasks(userId)` directly from the server (no fetch wrapper needed — uses internal call with token from session)
- Renders `<TaskList tasks={tasks} />` and `<AddTaskForm userId={userId} />`
- Passes `userId` down to components that need to call the API

### 1.6 `AddTaskForm` (Client Component)

- `"use client"` directive
- Controlled input for title and description
- On submit: calls Server Action `createTaskAction(formData)` which calls `createTask(userId, input)` and `revalidatePath('/dashboard')`
- Shows loading state during submission; prevents double-submit
- Clears form on success

### 1.7 `TaskItem` (Client Component)

- `"use client"` directive
- Props: `task: Task`, `userId: string`
- Checkbox calls `toggleTask(userId, task.id)` → optimistic update → `revalidatePath`
- Delete button calls `deleteTask(userId, task.id)` → `revalidatePath`
- Edit: inline input field swap; calls `updateTask(userId, task.id, input)` on save

### 1.8 `FilterBar` (Client Component)

- `"use client"` directive
- Props: `tasks: Task[]`, `onChange: (filtered: Task[]) => void`
- Three tabs: "All" / "Pending" / "Completed"
- Filters `tasks` array client-side on tab click
- Active tab highlighted with Tailwind class

---

## Phase 1: Data Model

See `specs/004-nextjs-frontend/data-model.md` for TypeScript types.

**Critical types** defined in `src/lib/api.ts`:
- `Task` — full task object
- `TaskCreateInput` — `{ title: string; description?: string }`
- `TaskUpdateInput` — `{ title: string; description?: string | null }`
- `TaskListResponse` — `{ data: Task[]; meta: { total: number } }`
- `TaskSingleResponse` — `{ data: Task }`

---

## Phase 1: API Contracts

Full OpenAPI 3.1 spec in `specs/004-nextjs-frontend/contracts/frontend-api-contract.yaml`.

| Operation | Method | Path | Request | Response |
|-----------|--------|------|---------|----------|
| getTasks | GET | `/api/{userId}/tasks` | — | `TaskListResponse` |
| createTask | POST | `/api/{userId}/tasks` | `TaskCreateInput` | `TaskSingleResponse` 201 |
| getTask | GET | `/api/{userId}/tasks/{taskId}` | — | `TaskSingleResponse` |
| updateTask | PUT | `/api/{userId}/tasks/{taskId}` | `TaskUpdateInput` | `TaskSingleResponse` |
| deleteTask | DELETE | `/api/{userId}/tasks/{taskId}` | — | 204 |
| toggleTask | PATCH | `/api/{userId}/tasks/{taskId}/complete` | — | `TaskSingleResponse` |

All requests include `Authorization: Bearer <jwt>`. `userId` in path MUST match JWT `sub`.

---

## Execution Order

### Phase A: Project Scaffold
1. `npx create-next-app@14 todo-web-app/frontend --typescript --tailwind --app --src-dir`
2. Install additional dependencies: `better-auth`, `pg`, `@types/pg`
3. Create `.env.local` with all 4 required env vars
4. Create `.env.example` (no secrets)

### Phase B: Auth Setup
5. Create `src/lib/auth.ts` (server Better Auth instance)
6. Create `src/lib/auth-client.ts` (client auth client)
7. Create `src/middleware.ts` (route protection)
8. Create `src/app/api/auth/[...all]/route.ts` (Better Auth catch-all route handler)

### Phase C: API Client
9. Create `src/lib/api.ts` with all 6 typed functions and `fetchWithAuth` helper

### Phase D: Auth Pages (US1)
10. Create `src/app/sign-in/page.tsx`
11. Create `src/app/sign-up/page.tsx`
12. Create `src/components/SignOutButton.tsx`

### Phase E: Dashboard (US2)
13. Create `src/app/dashboard/layout.tsx`
14. Create `src/app/dashboard/page.tsx`
15. Create `src/components/TaskList.tsx`
16. Create `src/components/TaskItem.tsx` (toggle, delete, inline edit)
17. Create `src/components/AddTaskForm.tsx`

### Phase F: Filtering (US3)
18. Create `src/components/FilterBar.tsx`
19. Wire FilterBar into dashboard page

### Phase G: Polish (US4 + Edge Cases)
20. Verify responsive Tailwind classes at 375px
21. Add loading indicators to forms and buttons
22. Add empty-state message to task list
23. Add backend-unreachable error banner

### Phase H: Documentation & Context
24. Create `todo-web-app/frontend/CLAUDE.md`
25. Update root CLAUDE.md with Phase 2.3 active technologies

---

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `BETTER_AUTH_SECRET` | `frontend/.env.local` (server-only) | JWT signing; MUST match backend value |
| `BETTER_AUTH_URL` | `frontend/.env.local` | Better Auth base URL (e.g., `http://localhost:3000`) |
| `DATABASE_URL` | `frontend/.env.local` | Neon PostgreSQL (for Better Auth user/session tables) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | FastAPI backend base URL |

**Critical**: `BETTER_AUTH_SECRET` has no `NEXT_PUBLIC_` prefix — never expose the signing secret to the browser.

---

## Complexity Tracking

No constitution violations. All complexity is justified by the feature requirements:

| Decision | Justification |
|----------|--------------|
| Server Components + Client Components (hybrid) | Server Components enable SSR task list; Client Components enable immediate UI feedback for mutations. Neither pattern alone satisfies both requirements. |
| Better Auth `pg` adapter (not Drizzle) | Avoids adding a third ORM dependency; `pg` is already in the Node ecosystem and required for Neon access. |
| Client-side filtering (no API round-trip) | API filter parameter exists but client-side avoids network round-trips on every filter change, giving instant feedback (SC-002). |
