# Tasks: Phase 3.4 — SaaS UI/UX Refinement

**Feature**: `006-saas-ui-refinement`
**Branch**: `006-saas-ui-refinement`
**Input**: Design documents from `todo-web-app/specs/ui/`
**Prerequisites**: `saas-plan.md` ✅, `saas-refinement.md` (spec) ✅
**Tests**: Not requested — verification via manual acceptance criteria per task.

**Stylistic Rule**: All new/modified files must include a `// [Task]: T-3.4.x` comment at the top identifying the originating task ID.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.
**Non-regression rule**: Phase 3 auth, DB, and Chat API MUST remain fully functional after every task.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no cross-dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in all descriptions

---

## Phase 1: Setup — Foundation & Dependencies

**Purpose**: Install new packages, establish shared utilities, configure theme tokens, and extend global CSS. Must complete before any component work.

- [x] T-3.4.\1 Install `framer-motion ^11`, `tailwind-merge ^2`, and `clsx ^2` by updating `todo-web-app/frontend/package.json` and running `npm install` inside `todo-web-app/frontend/`
- [x] T-3.4.\1 [P] Create `todo-web-app/frontend/src/lib/utils.ts` exporting the `cn(...inputs: ClassValue[])` helper using `clsx` + `tailwind-merge` (`// [Task]: T-3.4.1`)
- [x] T-3.4.\1 [P] Create `todo-web-app/frontend/src/lib/animations.ts` exporting `fadeInUp`, `staggerContainer`, `slideInRight`, `springTransition`, `easeTransition`, and `reducedVariants` Framer Motion variants (`// [Task]: T-3.4.1`)
- [x] T-3.4.\1 Extend `todo-web-app/frontend/src/app/globals.css` with `@layer utilities` block defining `.mesh-bg-auth` and `.mesh-bg-landing` radial-gradient CSS classes and Geist font is already configured — update `metadata.title` in `app/layout.tsx` to "TodoAI" (`// [Task]: T-3.4.2`)
- [x] T-3.4.\1 Update `todo-web-app/frontend/src/middleware.ts` matcher to exclude `/login` and `/register` as public routes; keep backward-compat exclusions for `/sign-in` and `/sign-up` (`// [Task]: T-3.4.2`)

**Checkpoint**: `npm run build` inside `todo-web-app/frontend/` must pass with the three new packages resolved. `lib/utils.ts` and `lib/animations.ts` importable without TypeScript errors.

---

## Phase 2: Foundational — Landing Page Infrastructure

**Purpose**: Create the public-page shared components (`GlassNavbar`, `Footer`) that gate all landing page user story work. These block Phase 3.

**⚠️ CRITICAL**: GlassNavbar and Footer are required by US1 and must be complete before T-3.4.7 (HeroSection) and T-3.4.8 (BentoGrid) begin.

- [x] T-3.4.\1 [P] Create `todo-web-app/frontend/src/components/landing/GlassNavbar.tsx` as a Client Component with scroll-position-aware `backdrop-blur-md` transparency, product logo/name on the left, desktop nav links ("Features", "Sign In", "Get Started"), and a mobile hamburger menu toggling a vertical link list below the bar; active/scroll state via `useState` + `useEffect` scroll listener; classes composed with `cn()` (`// [Task]: T-3.4.3`)
- [x] T-3.4.\1 [P] Create `todo-web-app/frontend/src/components/landing/Footer.tsx` as a Server Component with a 4-column responsive grid (product name + tagline, Product links, Legal links, Social links) and copyright line at the bottom; dark background `bg-black/40 border-t border-white/10` (`// [Task]: T-3.4.3`)

**Checkpoint**: Render `GlassNavbar` and `Footer` in a test page; GlassNavbar is transparent at top and blurred after 20 px scroll; hamburger collapses links on < 768 px. Footer shows 4 columns on desktop, stacks to 2 on tablet, 1 on mobile.

---

## Phase 3: User Story 1 — First-Time Visitor Landing Page (Priority: P1) 🎯 MVP

**Goal**: A polished public landing page at `/` that communicates value, drives conversion to `/register`, and redirects authenticated users to `/dashboard`.

**Independent Test**: Visit `http://localhost:3000/` without authentication. Verify the hero, feature grid, navbar, and footer all render. Click "Get Started" → navigates to `/register`. Hover a feature card → lift animation plays. Open DevTools → resize to 375 px → no horizontal scroll.

### Implementation for User Story 1

- [x] T-3.4.\1 [US1] Convert `todo-web-app/frontend/src/app/page.tsx` from a pure redirect to a Server Component that checks session via `auth.api.getSession()`; if session exists redirect to `/dashboard`, else render the `<LandingPage />` assembly (imports GlassNavbar, HeroSection, BentoGrid, Footer); add `// [Task]: T-3.4.4` comment
- [x] T-3.4.\1 [P] [US1] Create `todo-web-app/frontend/src/components/landing/HeroSection.tsx` as a Client Component with a full-viewport-height section using `.mesh-bg-landing`, fixed-navbar offset `pt-20`, centered flex layout, and Framer Motion `motion.div` with `variants={fadeInUp}` stagger: headline (`h1`), sub-headline (`p`), and two CTA buttons ("Get Started" → `/register`, "Sign In" → `/login`) each as child `motion.div` elements; call `useReducedMotion()` and substitute `reducedVariants(fadeInUp)` when true; `springTransition` on button hover (`whileHover={{ scale: 1.04 }}`); add `// [Task]: T-3.4.4` comment
- [x] T-3.4.10 [P] [US1] Create `todo-web-app/frontend/src/components/landing/BentoCard.tsx` as a Client Component with props `{ title, description, icon: LucideIcon, colSpan: 1 | 2, gradient: string }`: renders a `motion.div` card with `col-span-{colSpan}` via `cn()`, dark glass style `rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden relative`, an absolutely-positioned gradient accent `<div>` using inline `style={{ background: gradient }}`, the Lucide icon, title, and description; `whileHover={{ y: -4, scale: 1.01 }}` with `springTransition`; `useReducedMotion()` suppresses hover transform; add `// [Task]: T-3.4.5` comment
- [x] T-3.4.11 [US1] Create `todo-web-app/frontend/src/components/landing/BentoGrid.tsx` as a Server Component defining the 6-card feature data array inline (AI Chatbot col-span-2, MCP Integration col-span-1, Task Management col-span-1, JWT Auth col-span-1, Real-time Persistence col-span-1, Roman Urdu Support col-span-2) using Lucide icons `Bot`, `Wrench`, `CheckSquare`, `Shield`, `Database`, `Globe`; renders a `<section>` with `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[220px] gap-4 max-w-7xl mx-auto px-4 py-24`; maps cards to `<BentoCard>`; add `// [Task]: T-3.4.5` comment

**Checkpoint**: User Story 1 complete. `npm run dev` → visit `/` unauthenticated → full landing page with hero, 6 bento cards, glass navbar, and footer. Authenticated session → redirect to `/dashboard`. Mobile 375 px → single-column card stack.

---

## Phase 4: User Story 2 — Modernized Auth Pages (Priority: P2)

**Goal**: `/login` and `/register` pages with mesh-gradient backgrounds, centered card forms, inline validation, and animated page transitions; legacy `/sign-in` and `/sign-up` redirect to new routes.

**Independent Test**: Visit `/login` and `/register`. Verify mesh-gradient background. Submit empty form → inline validation messages appear within 100 ms adjacent to offending fields. Valid credentials → redirect to `/dashboard`. Mobile 375 px → full-width form card, tappable inputs (min 44 px tap target).

### Implementation for User Story 2

- [x] T-3.4.12 [P] [US2] Create `todo-web-app/frontend/src/app/login/page.tsx` as a Client Component modelled on the existing `sign-in/page.tsx` logic (authClient.signIn.email, error state, loading state, redirect to `/dashboard`) but with restyled markup: `.mesh-bg-auth min-h-screen flex items-center justify-center px-4`; centered card `bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md`; inline per-field error spans below each input (not a top-level banner); Framer Motion `motion.div` wrapper with `fadeInUp` entrance; "Don't have an account? Register" link → `/register`; add `// [Task]: T-3.4.6` comment
- [x] T-3.4.13 [P] [US2] Create `todo-web-app/frontend/src/app/register/page.tsx` as a Client Component modelled on the existing `sign-up/page.tsx` logic (authClient.signUp.email, name + email + password fields, error state, redirect to `/dashboard`) with identical styling contract to `login/page.tsx`; add per-field inline validation for all three fields; "Already have an account? Sign in" link → `/login`; add `// [Task]: T-3.4.6` comment
- [x] T-3.4.14 [P] [US2] Modify `todo-web-app/frontend/src/app/sign-in/page.tsx` to a minimal Server Component that does `redirect("/login")`; add `// [Task]: T-3.4.6` backward-compat redirect comment
- [x] T-3.4.15 [P] [US2] Modify `todo-web-app/frontend/src/app/sign-up/page.tsx` to a minimal Server Component that does `redirect("/register")`; add `// [Task]: T-3.4.6` backward-compat redirect comment
- [x] T-3.4.16 [US2] Verify `todo-web-app/frontend/src/lib/auth.ts` and `todo-web-app/frontend/src/lib/auth-client.ts` do not hardcode `/sign-in` or `/sign-up` as callback URLs; update any `signInPage` or `redirectTo` references to `/login` and `/register` respectively; add `// [Task]: T-3.4.6` comment to changed lines

**Checkpoint**: User Story 2 complete. `/login` and `/register` render with mesh backgrounds. `/sign-in` and `/sign-up` redirect correctly. Per-field validation shows on failed submit. Successful login lands on `/dashboard`.

---

## Phase 5: User Story 3 — Dashboard Sidebar Navigation (Priority: P2)

**Goal**: Replace the top-nav bar with a persistent left sidebar on desktop; mobile sidebar as overlay toggled by hamburger; active-link highlighting; Escape key closes mobile overlay.

**Independent Test**: Log in → dashboard loads with sidebar visible on desktop (≥ 768 px). Click "Tasks" → active link highlighted. Resize to 375 px → sidebar hidden; hamburger visible; click hamburger → overlay slides in. Click a link → overlay closes. Press Escape → overlay closes.

### Implementation for User Story 3

- [x] T-3.4.17 Create `todo-web-app/frontend/src/components/dashboard/Sidebar.tsx` as a Client Component with props `{ isOpen: boolean, onClose: () => void, onChatOpen: () => void }`; desktop variant: `hidden md:flex flex-col w-64 min-h-screen bg-[#0d0d1a] border-r border-white/10 fixed left-0 top-0 z-30`; mobile variant: `AnimatePresence`-controlled `motion.div` with `slideInRight` from left (`x: "-100%"` → `x: 0`) overlay `w-full md:hidden` + backdrop `<motion.div onClick={onClose}>`; nav items: Tasks (`href="/dashboard"`, CheckSquare icon), Chat (button calling `onChatOpen`, MessageCircle icon), Settings (`href="/settings"`, Settings icon) and SignOutButton at the bottom; active state via `usePathname()` highlighting the matched href; Escape key `useEffect` calling `onClose`; all classes via `cn()`; add `// [Task]: T-3.4.7` comment
- [x] T-3.4.18 Create `todo-web-app/frontend/src/components/dashboard/DashboardShell.tsx` as a Client Component with props `{ userId: string, children: React.ReactNode }`; owns `sidebarOpen: boolean` (default false) and `chatOpen: boolean` (default false) state; renders the flex layout: `<div className="flex min-h-screen bg-[#0f0f1a]">` containing `<Sidebar>`, a mobile top bar `<div className="md:hidden fixed top-0 right-0 left-0 z-20 flex items-center px-4 h-14 bg-[#0d0d1a] border-b border-white/10">` with hamburger `<button onClick={() => setSidebarOpen(true)}>` (Menu icon from lucide-react) and product name, then a `<div className="flex-1 md:ml-64 pt-0 md:pt-0">` wrapping `<main className="p-6">{children}</main>`; also renders `<ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} userId={userId} />`; add `// [Task]: T-3.4.7` comment
- [x] T-3.4.19 [US3] Modify `todo-web-app/frontend/src/app/dashboard/layout.tsx` from the current top-nav layout to a Server Component that reads the session via `auth.api.getSession()`, extracts `userId`, and renders `<DashboardShell userId={userId}>{children}</DashboardShell>`; remove the old `<nav>` and `<main>` wrapper; add `// [Task]: T-3.4.7` comment

**Checkpoint**: User Story 3 complete. Dashboard shows sidebar on desktop. Mobile hamburger triggers animated overlay. Active link highlighted. Escape and link-click close the overlay. Existing task CRUD (add, toggle, delete) still functions correctly.

---

## Phase 6: User Story 4 — Slide-Out Chat Drawer (Priority: P3)

**Goal**: A Framer Motion `AnimatePresence` slide-out drawer opens the existing `ChatWindow` from the right side; integrates with existing Phase 3 Chat API without any backend changes; closable via close button or backdrop.

**Independent Test**: Click Chat in the sidebar → drawer animates in from the right. Type a message → backend Chat API responds in the thread. Click the ✕ button or click outside the drawer → drawer slides closed. Open on 375 px → drawer occupies full screen width. Conversation state is NOT lost when closing and reopening (conversationId preserved in URL).

### Implementation for User Story 4

- [x] T-3.4.20 [US4] Create `todo-web-app/frontend/src/components/chat/ChatDrawer.tsx` as a Client Component with props `{ isOpen: boolean, onClose: () => void, userId: string }`; uses Framer Motion `AnimatePresence`; when `isOpen`: renders a backdrop `motion.div` (`fixed inset-0 bg-black/50 z-40 md:block hidden`) with `onClick={onClose}` and a drawer `motion.div` (`fixed right-0 top-0 h-full w-full md:w-[420px] z-50 bg-[#0d0d1a] border-l border-white/10 flex flex-col`) with `initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}` and `transition={springTransition}`; drawer header: product name + `<button onClick={onClose}><X /></button>`; drawer body: `<Suspense fallback={null}><ChatWindow userId={userId} /></Suspense>`; existing `ChatWindow` is imported unchanged; add `// [Task]: T-3.4.9` comment

**Checkpoint**: User Story 4 complete. Drawer opens/closes with spring animation. Chat sends and receives messages via the existing `/api/chat` endpoint. conversationId URL sync inside ChatWindow still works. No backend changes made.

---

## Phase 7: User Story 5 — Refined Task List (Priority: P3)

**Goal**: Replace the plain task list with an animated card-grid view featuring priority badges (Low/Normal/High/Urgent); add/delete animations; mobile-first single-column stack.

**Independent Test**: Log in → task list renders as card grid (not a plain list). Each task shows a colored priority badge. Create a task → it fades/slides in. Delete a task → it fades out before DOM removal. Resize to 375 px → single-column card stack. Tasks with no `priority` attribute show "Normal" badge.

### Implementation for User Story 5

- [x] T-3.4.21 [P] [US5] Create `todo-web-app/frontend/src/components/tasks/TaskPriorityBadge.tsx` as a Server Component with prop `{ priority: "Low" | "Normal" | "High" | "Urgent" }`; renders a `<span>` pill badge using the color map: Low=`bg-slate-500/20 text-slate-300 border-slate-500/30`, Normal=`bg-blue-500/20 text-blue-300 border-blue-500/30`, High=`bg-amber-500/20 text-amber-300 border-amber-500/30`, Urgent=`bg-red-500/20 text-red-300 border-red-500/30`; base classes `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium`; add `// [Task]: T-3.4.8` comment
- [x] T-3.4.22 [US5] Create `todo-web-app/frontend/src/components/tasks/TaskCardGrid.tsx` as a Client Component with props matching the existing `TaskList` props (`tasks: Task[]`, `userId: string`); renders a `motion.div` container with `variants={staggerContainer} initial="hidden" animate="visible"` and a `grid grid-cols-1 sm:grid-cols-2 gap-3` layout; wraps each task card in `AnimatePresence` with `<motion.div key={task.id} variants={fadeInUp} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}`; each card: `rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3`; shows task title, completion toggle (existing logic from TaskItem), `<TaskPriorityBadge priority={task.priority ?? "Normal"} />`, and delete button; imports `useReducedMotion()` — if true uses `reducedVariants` on all motion elements; add `// [Task]: T-3.4.8` comment
- [x] T-3.4.23 [US5] Modify `todo-web-app/frontend/src/app/dashboard/page.tsx` to render `<TaskCardGrid tasks={tasks} userId={userId} />` in place of the existing `<FilterBar>` component for the task list display; keep `<AddTaskForm>` and the fetch logic untouched; remove the two-column `lg:grid-cols-[1fr_380px]` grid (chat now lives in the drawer); update imports; add `// [Task]: T-3.4.8` comment

**Checkpoint**: User Story 5 complete. Task list renders as animated card grid with priority badges. Add triggers enter animation; delete triggers exit animation. FilterBar tabs (All/Pending/Completed) still function if retained alongside TaskCardGrid, or are removed — agent may retain for usability.

---

## Phase 8: Polish — Global Interaction & Motion Enhancements

**Purpose**: Apply staggered list animations, spring hover transitions, and reduced-motion compliance across all interactive elements. Also verify non-regression of all Phase 3 flows.

- [x] T-3.4.24 [P] Add `whileHover={{ scale: 1.04 }}` with `springTransition` and `whileTap={{ scale: 0.97 }}` to all CTA buttons in `HeroSection.tsx` and to the primary submit buttons in `login/page.tsx` and `register/page.tsx`; verify `useReducedMotion()` suppresses these transforms; add `// [Task]: T-3.4.10` comment to each file
- [x] T-3.4.25 [P] Add `whileHover={{ y: -2 }}` with `easeTransition` to each `BentoCard` in `BentoCard.tsx`; ensure hover animation is ARIA-safe (no color-only change for hover state — combined with lift); add `// [Task]: T-3.4.10` comment
- [x] T-3.4.26 [P] Add `motion.li` with `variants={fadeInUp}` to the Sidebar nav items in `Sidebar.tsx` when the mobile overlay opens (only animate on mount); desktop sidebar items are static (no re-mount animation); add `// [Task]: T-3.4.10` comment
- [x] T-3.4.27 Perform accessibility pass: verify all interactive elements (buttons, links, cards) have visible focus rings (`focus-visible:ring-2`); verify WCAG 2.1 AA contrast for text on dark backgrounds; verify `prefers-reduced-motion` suppresses all animations by testing in Chrome DevTools (Rendering → Emulate CSS media → prefers-reduced-motion: reduce); add `// [Task]: T-3.4.10` comments to any modified files
- [x] T-3.4.28 Run non-regression check: start the full stack (`npm run dev` frontend + `uvicorn` backend), log in with a valid test account, create 3 tasks, toggle one, delete one, open the Chat drawer, send a message, verify the Groq LLM responds, verify conversation history persists across drawer close/re-open

**Checkpoint**: All 15 items in `saas-plan.md` acceptance checklist pass. No console errors. `npm run build` completes without TypeScript errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (`npm install` must complete) — blocks Phases 3–8
- **Phase 3 (US1 — Landing)**: Depends on Phase 2; T-3.4.8 depends on T-3.4.6 and T-3.4.7 (GlassNavbar/Footer)
- **Phase 4 (US2 — Auth)**: Depends on Phase 1 only (no shared component dependencies); can run in parallel with Phase 3
- **Phase 5 (US3 — Sidebar)**: Depends on Phase 2; T-3.4.19 depends on T-3.4.17 and T-3.4.18
- **Phase 6 (US4 — Chat Drawer)**: Depends on T-3.4.17 and T-3.4.18 (DashboardShell must exist); ChatWindow unchanged
- **Phase 7 (US5 — Task List)**: Depends on T-3.4.19 (dashboard layout must be sidebar-based); T-3.4.23 depends on T-3.4.21 and T-3.4.22
- **Phase 8 (Polish)**: Depends on all story phases complete

### User Story Dependencies

| Story | Blocks | Blocked By |
|-------|--------|------------|
| US1 (Landing) | Nothing | Phase 2 (GlassNavbar, Footer) |
| US2 (Auth) | Nothing | Phase 1 (npm install) |
| US3 (Sidebar) | US4, US5 | Phase 2 (DashboardShell pattern) |
| US4 (Chat Drawer) | Nothing | US3 (DashboardShell must exist) |
| US5 (Task List) | Nothing | US3 (dashboard layout rearchitected) |

### Parallel Opportunities

- T-3.4.2 and T-3.4.3 can run in parallel (different files)
- T-3.4.6 and T-3.4.7 can run in parallel (GlassNavbar ≠ Footer)
- T-3.4.9 (HeroSection) and T-3.4.10 (BentoCard) can run in parallel
- T-3.4.12, T-3.4.13, T-3.4.14, T-3.4.15 can all run in parallel (separate files)
- T-3.4.17 (Sidebar) and T-3.4.18 (DashboardShell) can run in parallel
- T-3.4.21 (TaskPriorityBadge) and T-3.4.22 (TaskCardGrid) can run in parallel after T-3.4.21 spec is clear
- T-3.4.24, T-3.4.25, T-3.4.26 can all run in parallel (different files)

---

## Parallel Example: Phase 3 (Landing Page)

```
Parallel group A (after Phase 2):
  Task: T-3.4.9 — HeroSection.tsx
  Task: T-3.4.10 — BentoCard.tsx

Sequential after group A:
  Task: T-3.4.11 — BentoGrid.tsx (imports BentoCard)

Sequential after T-3.4.6, T-3.4.7:
  Task: T-3.4.8 — app/page.tsx (imports GlassNavbar, HeroSection, BentoGrid, Footer)
```

---

## Implementation Strategy

### MVP First (User Story 1 — Landing Page)

1. Complete Phase 1: Install deps, create `lib/utils.ts`, `lib/animations.ts`, extend `globals.css`
2. Complete Phase 2: `GlassNavbar.tsx`, `Footer.tsx`
3. Complete Phase 3: `HeroSection.tsx`, `BentoCard.tsx`, `BentoGrid.tsx`, `app/page.tsx`
4. **STOP and VALIDATE**: Visit `/` unauthenticated — full landing page renders; CTA → `/register`; mobile responsive; hover animations play
5. Demo-ready landing page shipped

### Incremental Delivery

1. Phase 1–3 → Landing page MVP (**demo/deploy**)
2. Phase 4 → Modern auth pages (**converted users see polish immediately**)
3. Phase 5 → Sidebar dashboard (**authenticated UX overhauled**)
4. Phase 6 → Chat drawer (**chat UX non-intrusive and animated**)
5. Phase 7 → Refined task list (**task management visually complete**)
6. Phase 8 → Motion polish + regression (**ship-ready**)

---

## Task Count Summary

| Phase | Tasks | User Story | Parallelizable |
|-------|-------|-----------|---------------|
| Phase 1 — Setup | 5 | — | 2 |
| Phase 2 — Foundational | 2 | — | 2 |
| Phase 3 — US1 Landing | 4 | US1 (P1) | 2 |
| Phase 4 — US2 Auth | 5 | US2 (P2) | 4 |
| Phase 5 — US3 Sidebar | 3 | US3 (P2) | 1 |
| Phase 6 — US4 Chat Drawer | 1 | US4 (P3) | 0 |
| Phase 7 — US5 Task List | 3 | US5 (P3) | 1 |
| Phase 8 — Polish | 5 | — | 3 |
| **Total** | **28** | — | **15** |

---

## Notes

- `// [Task]: T-3.4.x` comment required in every created or modified file
- `[P]` tasks write to different files with no incomplete shared dependencies — safe to run concurrently
- ChatWindow, ChatInput, MessageBubble — **do not modify** (Phase 3.3 logic preserved)
- Backend routes, auth.py, models.py, mcp/ — **do not modify** (Phase 3 API contract preserved)
- If `task.priority` is absent from the Task model, default to `"Normal"` in TaskPriorityBadge display only — no backend schema change required
- Commit after each phase checkpoint for clean rollback points
