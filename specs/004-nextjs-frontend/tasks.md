# Tasks: Phase 2.3 — Frontend Development & Integration

**Input**: Design documents from `/specs/004-nextjs-frontend/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

**Style rule**: Every source file MUST include a top-of-file comment: `// [Task]: T-2.3.x` matching the user-facing task ID it implements. Use `lucide-react` icons (`Pencil`, `Trash2`, `Check`) for all UI action buttons.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- All paths relative to `todo-web-app/frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project and install all dependencies before any feature work.

- [X] T001 Scaffold Next.js 14+ project: `npx create-next-app@14 todo-web-app/frontend --typescript --tailwind --app --src-dir --no-git` — verify `src/app/`, `tailwind.config.js`, `tsconfig.json` (strict mode) are created
- [X] T002 Install additional dependencies in `todo-web-app/frontend/`: `npm install better-auth pg lucide-react` and `npm install -D @types/pg`
- [X] T003 [P] Create `todo-web-app/frontend/.env.local` with all 4 vars: `BETTER_AUTH_SECRET` (matches backend), `BETTER_AUTH_URL=http://localhost:3000`, `DATABASE_URL=<neon-connection-string>`, `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [X] T004 [P] Create `todo-web-app/frontend/.env.example` with all 4 vars documented (placeholder values, no real secrets)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure and API client that ALL user stories depend on. MUST complete before Phase 3+.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create `src/lib/auth.ts` (server-side Better Auth instance): `betterAuth({ secret: process.env.BETTER_AUTH_SECRET, baseURL: process.env.BETTER_AUTH_URL, database: new Pool({ connectionString: process.env.DATABASE_URL }), plugins: [jwt()], emailAndPassword: { enabled: true } })` — import `{ betterAuth }` from `"better-auth"`, `{ jwt }` from `"better-auth/plugins"`, `{ Pool }` from `"pg"`
- [X] T006 [P] Create `src/lib/auth-client.ts` (client-side auth client, add `"use client"` directive): `createAuthClient({ baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "", plugins: [jwtClient()] })` — import `{ createAuthClient }` from `"better-auth/react"`, `{ jwtClient }` from `"better-auth/client/plugins"` — export as `authClient`
- [X] T007 Create `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all Next.js route handler: `import { auth } from "@/lib/auth"; import { toNextJsHandler } from "better-auth/next-js"; export const { GET, POST } = toNextJsHandler(auth.handler);`
- [X] T008 Create `src/middleware.ts` — protect `/dashboard/**`, redirect auth users away from `/sign-in` and `/sign-up`: use `auth.api.getSession({ headers: request.headers })` from `@/lib/auth`; export `config = { matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"] }` (depends on T005)
- [X] T009 Create `src/lib/api.ts` — typed fetch wrapper with Bearer token injection: implement `fetchWithAuth(path, options)` that calls `authClient.token()`, sets `Authorization: Bearer <token>` header, prefixes URL with `process.env.NEXT_PUBLIC_API_URL`; implement all 6 typed functions: `getTasks(userId, params?)`, `createTask(userId, input)`, `getTask(userId, taskId)`, `updateTask(userId, taskId, input)`, `deleteTask(userId, taskId)`, `toggleTask(userId, taskId)`; on 401 response call `router.push("/sign-in?reason=session_expired")`; export TypeScript types: `Task`, `TaskCreateInput`, `TaskUpdateInput`, `TaskListResponse`, `TaskSingleResponse`, `StatusFilter`, `SortOrder` (depends on T006)

**Checkpoint**: Foundation ready — auth is configured, API client is implemented, route protection active.

---

## Phase 3: User Story 1 — Account Creation & Sign-In (Priority: P1) 🎯 MVP

**Goal**: A new visitor can register and sign in; authenticated users reach the dashboard; unauthenticated users are blocked from `/dashboard`.

**Independent Test**: Open incognito browser → navigate to `/dashboard` → verify redirect to `/sign-in` → register with new email/password → verify redirect to `/dashboard` → sign out → verify redirect to `/sign-in`.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `src/app/sign-in/page.tsx` (`"use client"`): email/password controlled form; on submit call `authClient.signIn.email({ email, password })`; on success `router.push("/dashboard")`; on error display message without clearing email field; show loading indicator on submit button; add `// [Task]: T-2.3.5` comment at top
- [X] T011 [P] [US1] Create `src/app/sign-up/page.tsx` (`"use client"`): name/email/password controlled form; on submit call `authClient.signUp.email({ name, email, password })`; on success `router.push("/dashboard")`; on error display message; add `// [Task]: T-2.3.5` comment at top
- [X] T012 [US1] Create `src/components/SignOutButton.tsx` (`"use client"`): button that calls `authClient.signOut()` then `router.push("/sign-in")`; add `// [Task]: T-2.3.7` comment at top
- [X] T013 [US1] Create `src/app/page.tsx` — root redirect: Server Component that calls `auth.api.getSession({ headers: headers() })`; if session exists redirect to `/dashboard`, else redirect to `/sign-in`; add `// [Task]: T-2.3.1` comment at top

**Checkpoint**: US1 fully functional — sign-up, sign-in, sign-out, and route protection all work independently.

---

## Phase 4: User Story 2 — Create, View, and Manage Tasks (Priority: P1)

**Goal**: Signed-in user can create tasks, view their task list, toggle completion, delete tasks, and edit task content. Changes reflect immediately.

**Independent Test**: Sign in → create 3 tasks → mark 1 complete (verify strikethrough) → delete 1 (verify removal) → edit 1 title (verify updated text) → all changes visible without page reload.

### Implementation for User Story 2

- [X] T014 [US2] Create `src/app/dashboard/layout.tsx` (Server Component): renders children with a nav bar that includes the app name and `<SignOutButton />`; add `// [Task]: T-2.3.7` comment at top
- [X] T015 [US2] Create `src/app/dashboard/actions.ts` — Server Actions: `createTaskAction(userId, formData)`, `deleteTaskAction(userId, taskId)`, `toggleTaskAction(userId, taskId)`, `updateTaskAction(userId, taskId, formData)` — each calls the corresponding `api.ts` function then `revalidatePath("/dashboard")`; add `"use server"` directive; add `// [Task]: T-2.3.10` comment at top
- [X] T016 [US2] Create `src/app/dashboard/page.tsx` (Server Component): call `auth.api.getSession({ headers: headers() })` — if no session redirect to `/sign-in`; call `getTasks(userId)` from `@/lib/api`; render `<AddTaskForm userId={userId} />` above `<TaskList tasks={tasks} userId={userId} />`; wrap in try/catch to show error banner if backend unreachable; add `// [Task]: T-2.3.7` comment at top
- [X] T017 [P] [US2] Create `src/components/TaskList.tsx` (Server Component): accepts `tasks: Task[]` and `userId: string` props; if empty render `<p>No tasks yet. Add one above.</p>`; map over tasks rendering `<TaskItem task={task} userId={userId} />` for each; add `// [Task]: T-2.3.8` comment at top
- [X] T018 [US2] Create `src/components/TaskItem.tsx` (`"use client"`): displays task title, created date, completion checkbox; checkbox calls `toggleTaskAction` (optimistic toggle); `<Pencil />` icon button (from `lucide-react`) opens inline edit mode with input + save/cancel; `<Trash2 />` icon button calls `deleteTaskAction`; strikethrough styling when `task.completed`; show loading state on all buttons to prevent double-click; add `// [Task]: T-2.3.8` comment at top
- [X] T019 [US2] Create `src/components/AddTaskForm.tsx` (`"use client"`): controlled inputs for title (required, max 200 chars) and description (optional); validates title not empty before submit; calls `createTaskAction(userId, formData)` on submit; clears form on success; shows loading state on submit button; add `// [Task]: T-2.3.9` comment at top

**Checkpoint**: US2 fully functional — full CRUD operations work, changes reflect immediately via `revalidatePath`.

---

## Phase 5: User Story 3 — Filter Tasks by Status (Priority: P2)

**Goal**: User can filter task list by "All", "Pending", or "Completed" with instant client-side response (no API round-trip).

**Independent Test**: Create 5 tasks, complete 2. Click "Completed" → 2 shown. Click "Pending" → 3 shown. Click "All" → 5 shown. Verify no network requests on filter change.

### Implementation for User Story 3

- [X] T020 [US3] Create `src/components/FilterBar.tsx` (`"use client"`): accepts `tasks: Task[]` as props and manages `activeFilter` state (`"all" | "pending" | "completed"`); renders 3 tab buttons with active styling; computes `filteredTasks` by filtering the `tasks` array client-side; renders `<TaskList tasks={filteredTasks} userId={userId} />` below tabs; add `// [Task]: T-2.3.8` comment at top
- [X] T021 [US3] Update `src/app/dashboard/page.tsx` to pass tasks and userId to `<FilterBar tasks={tasks} userId={userId} />` instead of directly to `<TaskList />`; verify no API call on filter tab change via browser DevTools Network tab

**Checkpoint**: US3 fully functional — client-side filtering works across all 3 states.

---

## Phase 6: User Story 4 & Polish — Responsive Layout and Edge Cases (Priority: P2)

**Purpose**: Mobile responsiveness, loading states, error handling, and documentation.

- [X] T022 Audit all components for responsive Tailwind classes: verify no horizontal scroll at 375px; use `sm:`, `md:`, `lg:` breakpoints; ensure buttons/inputs meet 44px minimum touch target; fix any overflow or hidden elements found at mobile viewport
- [X] T023 [P] Add backend-unreachable error banner: in `src/app/dashboard/page.tsx` wrap `getTasks()` in try/catch; on error render `<div className="...">Unable to reach server. Please try again later.</div>` instead of task list
- [X] T024 [P] Add session-expired redirect in `src/lib/api.ts`: ensure `fetchWithAuth` catches 401 responses and calls `window.location.href = "/sign-in?reason=session_expired"` from client context; in `src/app/sign-in/page.tsx` read `reason` query param and show banner "Your session expired. Please sign in again."
- [X] T025 Create `todo-web-app/frontend/CLAUDE.md`: document project purpose (Phase 2.3 frontend), directory structure, env vars required, how to run dev server, Better Auth configuration note (BETTER_AUTH_SECRET must match backend), API client location and pattern
- [X] T026 Run all 10 quickstart.md scenarios manually against running backend and frontend; mark any failures; fix blockers before declaring Phase 2.3 complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1 Auth)**: Depends on Phase 2 — can proceed after T005-T009 complete
- **Phase 4 (US2 CRUD)**: Depends on Phase 2 + Phase 3 (needs auth session to identify user)
- **Phase 5 (US3 Filter)**: Depends on Phase 4 (TaskList must exist before FilterBar wraps it)
- **Phase 6 (Polish)**: Depends on all feature phases complete

### Within Each Phase

- Phase 2: T005 → T006 [P] → T007 (needs T005) → T008 (needs T005) → T009 (needs T006)
- Phase 3: T010 [P] and T011 [P] in parallel → T012 → T013
- Phase 4: T014 [P] and T015 → T016 (needs T015) → T017 [P] and T018 → T019
- Phase 5: T020 → T021 (integrates T020 into dashboard)
- Phase 6: T022–T024 in parallel → T025 → T026

### Parallel Opportunities

```text
Phase 1:  T001 → T002 → (T003 [P] + T004 [P])
Phase 2:  T005 → (T006 [P] + T007) → T008 → T009
Phase 3:  (T010 [P] + T011 [P]) → T012 → T013
Phase 4:  T014 → T015 → T016 → (T017 [P] + T018) → T019
Phase 5:  T020 → T021
Phase 6:  (T022 [P] + T023 [P] + T024 [P]) → T025 → T026
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only — Auth & Task CRUD)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (auth, API client, middleware)
3. Complete Phase 3: US1 (sign-up, sign-in, sign-out)
4. **VALIDATE**: Run quickstart.md Scenarios 1 and 2 — route protection confirmed
5. Complete Phase 4: US2 (dashboard, task CRUD)
6. **VALIDATE**: Run quickstart.md Scenarios 3, 4, 5, 8, 9 — CRUD confirmed

### Full Delivery

7. Complete Phase 5: US3 (filter bar)
8. **VALIDATE**: Run quickstart.md Scenario 6 — filtering confirmed
9. Complete Phase 6: Polish (responsive + edge cases)
10. **VALIDATE**: Run quickstart.md Scenario 7 (JWT expiry) and 10 (375px layout)
11. Phase 2.3 complete — ready for Phase 3 (AI Chatbot integration)

---

## Notes

- All `"use client"` directives must be the very first line of the file (before imports)
- `BETTER_AUTH_SECRET` must be identical in `frontend/.env.local` and `backend/.env`
- Better Auth's `auth.api.getSession()` is for Server Components and middleware only — never call it in Client Components
- Client Components use `authClient.useSession()` hook or `authClient.token()` for JWT retrieval
- `revalidatePath("/dashboard")` must be called in Server Actions (not Client Components)
- Use `lucide-react` `<Pencil />`, `<Trash2 />`, `<Check />`, `<Plus />` icons consistently
- Every source file must include `// [Task]: T-2.3.x` comment at the top where x maps to: T-2.3.1=scaffold, T-2.3.2=env, T-2.3.3=api.ts, T-2.3.4=auth.ts/auth-client.ts, T-2.3.5=sign-in/sign-up pages, T-2.3.6=middleware, T-2.3.7=dashboard layout/page, T-2.3.8=TaskList/TaskItem/FilterBar, T-2.3.9=AddTaskForm, T-2.3.10=actions.ts/revalidation
