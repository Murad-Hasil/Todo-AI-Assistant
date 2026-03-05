# Research: Phase 2.3 — Frontend Development & Integration

**Feature**: `004-nextjs-frontend`
**Date**: 2026-03-03

---

## Decision 1: Better Auth Configuration — JWT Plugin

**Decision**: Use `better-auth` with the built-in `jwt()` plugin

**Rationale**:
Better Auth v1.x uses database-backed sessions by default. The `jwt()` plugin adds stateless JWT issuance on top. When installed:
- Better Auth still manages sign-up/sign-in and stores a session record
- The JWT plugin exposes a `/api/auth/token` endpoint that returns a signed JWT for the current session
- The JWT contains `sub` (user ID), `exp`, and `iat` — matching the backend's expectations exactly
- The `BETTER_AUTH_SECRET` is used to sign the JWT with HS256 — same secret the FastAPI backend uses

**Configuration shape**:
```typescript
// src/lib/auth.ts (server-side)
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: { ... },  // Better Auth needs its own DB for sessions/users
  plugins: [jwt()],
  emailAndPassword: { enabled: true },
})
```

**Getting the token for API calls**:
- Server Components / Server Actions: `auth.api.getSession({ headers })` then call `/api/auth/token` internally
- Client Components: Use Better Auth's `createAuthClient` with `jwtClient()` plugin → `authClient.token()` returns the current JWT string

**Alternatives considered**:
- NextAuth.js (Auth.js v5): More complex JWT configuration for sharing with external APIs; Better Auth has cleaner native JWT support
- Manual JWT issuance: Would require a separate token endpoint; unnecessary complexity

---

## Decision 2: Better Auth Database for User Storage

**Decision**: Better Auth needs its own database table for users/sessions. Use the same Neon PostgreSQL instance with a separate schema or table prefix.

**Rationale**:
Better Auth manages `user`, `session`, `account`, and `verification` tables independently. These are NOT the same as the `tasks` table in Phase 2.1. Better Auth can share the same Neon database connection string — it creates its own tables via its own migration/sync mechanism.

**Important**: This is separate from the backend's `tasks` table. The backend does NOT have a `users` table FK (by design from Phase 2.1). The `user_id` in `tasks.user_id` matches the `id` in Better Auth's `user` table.

**Configuration**: Pass `DATABASE_URL` (same Neon connection string) to Better Auth's database config.

---

## Decision 3: Data Fetching Strategy — Client-Side API Calls + `revalidatePath`

**Decision**: Hybrid approach — Server Components for initial page render; Client Components with direct API calls for mutations; `revalidatePath` to refresh server data.

**Rationale**:

The user prompt suggests Server Actions + `revalidatePath`. This is correct for mutations, BUT there is a key constraint: our backend is an **external FastAPI service**, not a local database. This affects the pattern:

| Mutation Type | Approach | Why |
|---------------|----------|-----|
| Create task | Server Action → call FastAPI → `revalidatePath` | Can attach auth cookie server-side |
| Toggle complete | Client-side API call → optimistic update → revalidate | Faster UX; 1-field change |
| Delete task | Server Action → call FastAPI → `revalidatePath` | Destructive action; server validation preferred |
| Update task | Client-side API call → optimistic update | Inline edit flow |

**Filtering**: Client-side filter of already-fetched tasks (no additional API call on filter change). Dashboard fetches all tasks on load; `FilterBar` filters in-memory. This avoids round-trips for filter changes.

**Alternatives considered**:
- SWR or React Query: Adds a dependency; overkill for Phase 2.3 (no caching requirements); can be added in Phase 2.4
- All client-side API calls: Loses SSR benefit; initial paint shows loading skeleton instead of tasks
- All Server Actions: Latency on every interaction; not appropriate for checkbox toggles

---

## Decision 4: Next.js Middleware for Route Protection

**Decision**: Use `middleware.ts` at the `src/` root (or project root) with Better Auth's `auth.api.getSession()`

**Rationale**:
Next.js App Router middleware runs on the Edge and can check cookies before rendering any page. Better Auth provides `auth.api.getSession()` which works in middleware context.

**Pattern**:
```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
  if (session && (request.nextUrl.pathname === "/sign-in" || request.nextUrl.pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"] }
```

---

## Decision 5: Package Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `better-auth` | `^1.x` | Auth framework |
| `next` | `^14.x` | App Router framework |
| `typescript` | `^5.x` | Strict type checking |
| `tailwindcss` | `^3.x` | Utility-first CSS |
| `@types/react` | `^18.x` | React types |

**Better Auth database adapter**: `better-auth/adapters/drizzle` or generic SQL adapter. Since we already have a Neon PostgreSQL connection, use the PostgreSQL adapter.

---

## Decision 6: Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `BETTER_AUTH_SECRET` | Frontend `.env.local` (server-only) | JWT signing; must match backend value |
| `BETTER_AUTH_URL` | Frontend `.env.local` | Better Auth's own base URL |
| `DATABASE_URL` | Frontend `.env.local` | Neon PostgreSQL (for Better Auth user tables) |
| `NEXT_PUBLIC_API_URL` | Frontend `.env.local` | FastAPI backend base URL |

**Critical**: `BETTER_AUTH_SECRET` is a server-only variable (no `NEXT_PUBLIC_` prefix) to avoid leaking the signing secret to the browser. `NEXT_PUBLIC_API_URL` IS public (safe — it's just a URL).

---

## Decision 7: No `dependencies.py` / No Backend Changes

Phase 2.3 frontend integration requires **zero backend code changes**. The Phase 2.2 backend is production-ready:
- `app/auth.py` verifies HS256 JWTs with `BETTER_AUTH_SECRET` — no changes needed
- `routes/tasks.py` uses `/{user_id}/tasks` URL pattern — frontend must pass `user.id` (from Better Auth session) in the URL path
- `BETTER_AUTH_SECRET` must be identical on frontend and backend `.env` files
