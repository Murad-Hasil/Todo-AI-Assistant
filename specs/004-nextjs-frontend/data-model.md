# Data Model: Phase 2.3 — Frontend Development & Integration

**Feature**: `004-nextjs-frontend`
**Date**: 2026-03-03

## Summary

Phase 2.3 adds frontend-side TypeScript types and a new concern: **Better Auth's user and session tables** in the shared Neon PostgreSQL database. The backend `tasks` table is unchanged. No new backend migrations needed.

---

## Frontend TypeScript Types (src/lib/api.ts)

### Task

```typescript
export interface Task {
  id: string          // UUID
  user_id: string     // Matches Better Auth user.id
  title: string       // Max 200 chars
  description: string | null
  completed: boolean
  created_at: string  // ISO 8601
  updated_at: string  // ISO 8601
}
```

### API Input Types

```typescript
export interface TaskCreateInput {
  title: string        // Required, max 200 chars
  description?: string // Optional
}

export interface TaskUpdateInput {
  title: string           // Required
  description?: string | null
}
```

### Response Envelopes

```typescript
export interface TaskSingleResponse {
  data: Task
}

export interface TaskListResponse {
  data: Task[]
  meta: { total: number }
}
```

### Filter/Sort Parameters

```typescript
export type StatusFilter = "all" | "pending" | "completed"
export type SortOrder = "created" | "title" | "due_date"
```

---

## Better Auth Database Tables (auto-created by Better Auth)

Better Auth creates and manages these tables in the shared Neon PostgreSQL database. The backend never reads these tables directly.

| Table | Managed By | Key Columns |
|-------|------------|-------------|
| `user` | Better Auth | `id` (UUID), `email`, `name`, `createdAt` |
| `session` | Better Auth | `id`, `userId` (FK → user.id), `expiresAt` |
| `account` | Better Auth | `id`, `userId`, `providerId`, `accountId` |
| `verification` | Better Auth | `id`, `identifier`, `value`, `expiresAt` |

**Critical link**: `tasks.user_id` (backend) = `user.id` (Better Auth). This is the cross-service identity bridge — no FK constraint enforced, by design (Phase 2.1 Research Decision 5).

---

## Frontend Session State

The frontend holds the user session in memory (via Better Auth's client SDK). The session shape relevant to the frontend:

```typescript
interface Session {
  user: {
    id: string    // This is the user_id passed to backend API calls
    email: string
    name?: string
  }
  token: string   // JWT string — attached to every API request
}
```

---

## No New Backend Tables or Migrations

Phase 2.3 is frontend-only. Zero changes to:
- `tasks` table schema
- Alembic migrations
- FastAPI models or schemas
