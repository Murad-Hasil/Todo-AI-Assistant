# Frontend — Agent Context (Phase 3.4)

**Project**: Next.js 14+ Todo Web App Frontend
**Feature**: `006-saas-ui-refinement`
**Constitution**: `.specify/memory/constitution.md` v2.1.0

## Purpose

This is the Phase 3.4 frontend for the Todo Web App. Phase 3.3 added the AI chat side panel. Phase 3.4 is a full SaaS UI/UX refinement: landing page, modernized auth pages, sidebar navigation, animated chat drawer, and task card grid.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — title "TodoAI", Geist fonts
│   ├── page.tsx                    # Landing page (authenticated users → /dashboard)
│   ├── globals.css                 # Tailwind + .mesh-bg-auth, .mesh-bg-landing utilities
│   ├── api/auth/[...all]/route.ts  # Better Auth catch-all handler
│   ├── login/
│   │   ├── page.tsx                # Wraps LoginForm in Suspense (useSearchParams boundary)
│   │   └── LoginForm.tsx           # Client Component — email/password with inline validation
│   ├── register/page.tsx           # Client Component — name/email/password with inline validation
│   ├── sign-in/page.tsx            # Backward-compat redirect → /login
│   ├── sign-up/page.tsx            # Backward-compat redirect → /register
│   └── dashboard/
│       ├── layout.tsx              # Server Component — auth check → DashboardShell
│       ├── page.tsx                # Server Component — fetches tasks → TaskCardGrid
│       └── actions.ts              # Server Actions: createTaskAction, toggleTaskAction, deleteTaskAction, updateTaskAction
├── components/
│   ├── SignOutButton.tsx            # Client Component (do not modify)
│   ├── TaskList.tsx                 # Server Component (legacy, kept for compat)
│   ├── TaskItem.tsx                 # Client Component (legacy, kept for compat)
│   ├── AddTaskForm.tsx              # Client Component (create task form)
│   ├── FilterBar.tsx               # Client Component (legacy)
│   ├── landing/                    # Phase 3.4 — Public landing page components
│   │   ├── GlassNavbar.tsx         # Client Component — scroll-aware glass navbar
│   │   ├── HeroSection.tsx         # Client Component — animated hero with Framer Motion
│   │   ├── BentoCard.tsx           # Client Component — animated feature card
│   │   ├── BentoGrid.tsx           # Server Component — 6-card feature grid
│   │   └── Footer.tsx              # Server Component — 4-column responsive footer
│   ├── dashboard/                  # Phase 3.4 — Dashboard layout components
│   │   ├── Sidebar.tsx             # Client Component — desktop fixed + mobile overlay sidebar
│   │   └── DashboardShell.tsx      # Client Component — owns sidebarOpen + chatOpen state
│   ├── tasks/                      # Phase 3.4 — Task display components
│   │   ├── TaskCardGrid.tsx        # Client Component — animated 2-col card grid with Framer Motion
│   │   └── TaskPriorityBadge.tsx   # Server Component — Low/Normal/High/Urgent colored badge
│   └── chat/                       # Phase 3.3 — AI Chat UI (all Client Components)
│       ├── ChatWindow.tsx          # READ-ONLY — owns conversation state + URL sync
│       ├── ChatDrawer.tsx          # Phase 3.4 — AnimatePresence slide-out chat drawer
│       ├── MessageBubble.tsx       # READ-ONLY — single message bubble
│       └── ChatInput.tsx           # READ-ONLY — textarea + send button
└── lib/
    ├── auth.ts                      # Server-side Better Auth instance (READ-ONLY)
    ├── auth-client.ts               # Client-side auth client (READ-ONLY)
    ├── api.ts                       # Typed API client (READ-ONLY) — Task has no priority field
    ├── server-token.ts              # Server-side JWT signing (READ-ONLY)
    ├── utils.ts                     # cn() helper — clsx + tailwind-merge
    └── animations.ts                # Framer Motion variants: fadeInUp, staggerContainer, slideInRight, springTransition, easeTransition, reducedVariants
```

## Required Environment Variables

Create `.env.local` (never commit):

```env
# Must match backend BETTER_AUTH_SECRET exactly
BETTER_AUTH_SECRET=<secret>

# This Next.js app base URL
BETTER_AUTH_URL=http://localhost:3000

# Neon PostgreSQL (for Better Auth user/session tables)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# FastAPI backend base URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Dev Server

```bash
cd todo-web-app/frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

## Phase 3.4 Key Design Decisions

### Dark Theme
- Dashboard background: `bg-[#0f0f1a]`
- Sidebar/drawer background: `bg-[#0d0d1a]`
- All new UI uses dark glass aesthetic with `border-white/10`, `bg-white/5` panels

### Auth Routes
- `/login` → new mesh-gradient auth page (primary)
- `/register` → new mesh-gradient register page (primary)
- `/sign-in` → redirects to `/login` (backward compat)
- `/sign-up` → redirects to `/register` (backward compat)
- `api.ts` 401 handler still redirects to `/sign-in?reason=session_expired` (READ-ONLY; sign-in redirects automatically)

### Framer Motion Patterns
- Always call `useReducedMotion()` and pass `reducedVariants(...)` when true
- `springTransition` for hover/tap effects; `easeTransition` for page entries
- ChatDrawer uses `[&>div]:h-full [&>div]:rounded-none [&>div]:border-0` to override ChatWindow inner div without modifying ChatWindow.tsx

### useSearchParams Suspense Boundary
- LoginPage wraps LoginForm (which uses useSearchParams) in a Suspense boundary
- This is required for Next.js 16 static prerendering to succeed
- Pattern: `page.tsx` = thin Suspense shell; `LoginForm.tsx` = interactive client component

### Task Priority
- `Task` type in `api.ts` has NO priority field
- `TaskCardGrid` always passes `priority="Normal"` to `TaskPriorityBadge`
- Never add a priority field to api.ts without a backend schema change

## Better Auth Configuration Notes

- `BETTER_AUTH_SECRET` **must be identical** in `frontend/.env.local` and `backend/.env`
- The JWT plugin (`better-auth/plugins` → `jwt()`) issues HS256 tokens verified by the FastAPI backend
- Better Auth creates its own `user`, `session`, `account`, `verification` tables in the same Neon DB
- `auth.ts` (server-only) — use in Server Components, Server Actions, and middleware
- `auth-client.ts` (client-only, `"use client"`) — use in Client Components for sign-in/sign-up/token

## API Client

All backend calls go through `src/lib/api.ts` (READ-ONLY):
- Automatically attaches `Authorization: Bearer <jwt>` from `/api/token` route
- Base URL from `NEXT_PUBLIC_API_URL`
- 401 responses trigger redirect to `/sign-in?reason=session_expired` (sign-in redirects to /login)
- Phase 2 functions: `getTasks`, `createTask`, `getTask`, `updateTask`, `deleteTask`, `toggleTask`
- Phase 3.3 functions: `sendChat(userId, message, conversationId?)`, `getChatHistory(userId, conversationId)`
- Custom error classes: `NotFoundError`, `ForbiddenError`, `ServerError`, `NetworkError`

## Chat UI — Phase 3.3 Notes (preserved, do not modify)

### ChatWindow Component (`components/chat/ChatWindow.tsx`)
- Exports the `ChatMessage` interface — imported by `MessageBubble.tsx`
- Reads `?conversation_id=<UUID>` from the URL on mount as authoritative initial state
- Uses `router.replace()` (not `push`) to sync `conversationId` into the URL without polluting browser history
- Uses `router.refresh()` (not `revalidatePath`) after write tool calls — `revalidatePath` is unavailable in Client Component context
- Requires `<Suspense fallback={null}>` wrapper in parent due to `useSearchParams()` usage
- Three `useEffect` auto-scroll hooks: instant on history load, smooth on message append, smooth on `isLoading`
- `cancelled` flag pattern in history fetch `useEffect` prevents stale state updates after unmount

### RTL / Urdu Support
- `detectRTL(text)` uses `/[\u0600-\u06FF]/g` regex with >10% threshold
- `isRTL` is computed **once** at message creation and stored — never recomputed on render
- `dir="rtl"` HTML attribute applied to bubble `<div>` — required for the browser bidirectional text algorithm
- Roman Urdu (Latin script) correctly returns `isRTL: false`

### Tool Status Labels
- Write tools (`add_task`, `complete_task`, `delete_task`, `update_task`) → `"Updating Tasks…"`
- Read tools (`list_tasks`) → `"Fetching Tasks…"`
- No tool calls yet → `"Thinking…"`
- `lastToolCalls` carries tool names from the **previous** response (predicts current response category)

### Error Handling
| Error class | User message |
|-------------|-------------|
| `ForbiddenError` | "Access denied." |
| `NetworkError` | "Unable to reach server. Check your connection." |
| `ServerError` (503) | "AI service unavailable. Please try again." |
| `ServerError` (other) | "Something went wrong. Please try again." |
| `NotFoundError` (history) | Reset conversationId; redirect to `/dashboard` |
| `NotFoundError` (send) | Reset conversationId; show "Conversation expired. Please resend." |

## Architecture Rules

1. **Server Components** for data fetching (`dashboard/page.tsx`, landing components)
2. **Client Components** only for interactive elements (`"use client"` required as first line)
3. **Server Actions** (`"use server"`) in `actions.ts` for mutations — call `revalidatePath("/dashboard")` after each
4. **No direct DB access** from frontend JS — all data via FastAPI REST API
5. **Chat Client Components** use `router.refresh()` for task list revalidation (Server Action context not available)
6. **useSearchParams** always requires Suspense boundary wrapping — use shell pattern (page.tsx = Suspense, Form.tsx = interactive)

## Task ID Reference

| Task ID | File |
|---------|------|
| T-2.3.1 | `app/page.tsx` (root redirect, now landing page) |
| T-2.3.2 | `.env.local`, `.env.example` |
| T-2.3.3 | `lib/api.ts` |
| T-2.3.4 | `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts` |
| T-2.3.5 | `app/sign-in/page.tsx`, `app/sign-up/page.tsx` |
| T-2.3.6 | `middleware.ts` |
| T-2.3.7 | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/SignOutButton.tsx` |
| T-2.3.8 | `components/TaskList.tsx`, `components/TaskItem.tsx`, `components/FilterBar.tsx` |
| T-2.3.9 | `components/AddTaskForm.tsx` |
| T-2.3.10 | `app/dashboard/actions.ts` |
| T-3.3.1 | `components/chat/ChatWindow.tsx`, `components/chat/MessageBubble.tsx`, `components/chat/ChatInput.tsx` |
| T-3.3.2 | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/chat/ChatWindow.tsx` |
| T-3.3.3 | `components/chat/ChatWindow.tsx` (ConversationState, conversationId URL sync) |
| T-3.3.4 | `lib/api.ts` (getChatHistory), `components/chat/ChatWindow.tsx` (history fetch effect) |
| T-3.3.5 | `lib/api.ts` (sendChat), `components/chat/ChatWindow.tsx` (handleSend) |
| T-3.3.6 | `components/chat/ChatWindow.tsx` (auto-scroll, TypingIndicator) |
| T-3.3.7 | `components/chat/ChatWindow.tsx` (detectRTL), `components/chat/MessageBubble.tsx` (dir attr) |
| T-3.3.8 | `components/chat/ChatWindow.tsx` (router.refresh after write tool_calls) |
| T-3.4.1 | `package.json` (framer-motion, tailwind-merge, clsx) |
| T-3.4.2 | `lib/utils.ts` (cn helper) |
| T-3.4.3 | `lib/animations.ts` (Framer Motion variants) |
| T-3.4.4 | `app/globals.css` (.mesh-bg-auth, .mesh-bg-landing), `app/layout.tsx` (metadata title) |
| T-3.4.5 | `middleware.ts` (/login, /register public routes) |
| T-3.4.6 | `components/landing/GlassNavbar.tsx` |
| T-3.4.7 | `components/landing/Footer.tsx` |
| T-3.4.8 | `app/page.tsx` (landing page) |
| T-3.4.9 | `components/landing/HeroSection.tsx` |
| T-3.4.10 | `components/landing/BentoCard.tsx` |
| T-3.4.11 | `components/landing/BentoGrid.tsx` |
| T-3.4.12 | `app/login/page.tsx` + `app/login/LoginForm.tsx` |
| T-3.4.13 | `app/register/page.tsx` |
| T-3.4.14 | `app/sign-in/page.tsx` (redirect) |
| T-3.4.15 | `app/sign-up/page.tsx` (redirect) |
| T-3.4.16 | Verified auth.ts + auth-client.ts (no hardcoded sign-in/sign-up URLs) |
| T-3.4.17 | `components/dashboard/Sidebar.tsx` |
| T-3.4.18 | `components/dashboard/DashboardShell.tsx` |
| T-3.4.19 | `app/dashboard/layout.tsx` (now uses DashboardShell) |
| T-3.4.20 | `components/chat/ChatDrawer.tsx` |
| T-3.4.21 | `components/tasks/TaskPriorityBadge.tsx` |
| T-3.4.22 | `components/tasks/TaskCardGrid.tsx` |
| T-3.4.23 | `app/dashboard/page.tsx` (now uses TaskCardGrid) |
