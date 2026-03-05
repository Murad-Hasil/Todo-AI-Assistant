# UI Architecture — Phase 2.3

**Feature**: `004-nextjs-frontend`
**Created**: 2026-03-03

## Framework & Routing

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS — utility classes only, no inline `style` props
- **Package manager**: npm or pnpm

## Page Structure

```
/todo-web-app/frontend/
├── src/
│   └── app/
│       ├── layout.tsx            # Root layout — fonts, global styles, auth provider
│       ├── page.tsx              # Root redirect → /dashboard or /sign-in
│       ├── sign-in/
│       │   └── page.tsx          # Sign-in page (Server Component shell)
│       ├── sign-up/
│       │   └── page.tsx          # Sign-up page (Server Component shell)
│       └── dashboard/
│           ├── page.tsx          # Task dashboard (Server Component shell)
│           └── layout.tsx        # Dashboard layout — auth guard, nav bar
```

## Component Strategy

| Component Type | When to Use | Examples |
|----------------|-------------|---------|
| Server Component (default) | Static layout, data that can be fetched on server, no user interaction | Page shells, layout wrappers, task list initial load |
| Client Component (`"use client"`) | User interaction required — state, events, browser APIs | Sign-in form, add-task form, task item checkbox/delete, filter tabs |

**Rule**: Start every component as a Server Component. Only add `"use client"` when a specific interactive behaviour cannot be achieved without it.

## Auth Guard Pattern

- `app/dashboard/layout.tsx` checks the current session server-side.
- If no valid session exists → immediate redirect to `/sign-in`.
- All dashboard child pages are automatically protected.
- No client-side auth checks needed in individual task components.

## Shared Components

```
src/
├── components/
│   ├── TaskList.tsx          # Client Component — renders + manages task items
│   ├── TaskItem.tsx          # Client Component — individual task with checkbox/edit/delete
│   ├── AddTaskForm.tsx       # Client Component — controlled form for task creation
│   ├── FilterBar.tsx         # Client Component — All/Pending/Completed tab switcher
│   └── ui/
│       ├── Button.tsx        # Reusable button with loading state
│       ├── Input.tsx         # Reusable text input
│       └── ErrorBanner.tsx   # Global error display
└── lib/
    ├── api.ts                # Centralized API client (see api-client.md)
    └── auth.ts               # Better Auth client configuration
```

## Responsive Breakpoints

Follow Tailwind CSS default breakpoints:

| Breakpoint | Width | Layout Target |
|------------|-------|---------------|
| (default) | 0–639px | Mobile — single column, stacked controls |
| `sm` | 640px+ | Tablet — wider form, side-by-side filter tabs |
| `lg` | 1024px+ | Desktop — constrained max-width container |

All interactive elements must have minimum tap target size of 44×44px on mobile.

## Error Handling

- Network errors (fetch fails): Display `ErrorBanner` with "Unable to connect. Please try again."
- 401 responses from backend: Redirect to `/sign-in?reason=session_expired`
- 403 responses: Display "Access denied" inline (should not occur in normal use)
- 422 validation errors: Map field-level errors to form inputs
- 5xx responses: Display generic error banner; log to console
