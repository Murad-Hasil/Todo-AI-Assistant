# API Client — Phase 2.3

**Feature**: `004-nextjs-frontend`
**Created**: 2026-03-03

## Purpose

A single TypeScript module (`src/lib/api.ts`) that:
1. Knows the backend base URL (from environment variable)
2. Automatically attaches the authenticated user's JWT to every request
3. Handles 401 responses by triggering a sign-in redirect
4. Provides typed helper functions for each task operation

## Environment Variable

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Must be set in `.env.local` for development and in the deployment environment for production.

## Request Contract

Every call to a protected endpoint MUST include:

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

The JWT is obtained from Better Auth's client SDK — the API client calls Better Auth's `getSession()` (or equivalent) to retrieve the current token before each request.

## Exported Functions

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getTasks(userId, params)` | GET | `/api/{userId}/tasks?status=&sort=` | Fetch user's task list with optional filters |
| `createTask(userId, data)` | POST | `/api/{userId}/tasks` | Create a new task |
| `getTask(userId, taskId)` | GET | `/api/{userId}/tasks/{taskId}` | Fetch a single task |
| `updateTask(userId, taskId, data)` | PUT | `/api/{userId}/tasks/{taskId}` | Update title/description |
| `deleteTask(userId, taskId)` | DELETE | `/api/{userId}/tasks/{taskId}` | Delete a task |
| `toggleTask(userId, taskId)` | PATCH | `/api/{userId}/tasks/{taskId}/complete` | Toggle completion |

## Error Handling Contract

| HTTP Status | Action |
|-------------|--------|
| 200/201/204 | Return parsed response data |
| 401 | Clear session + redirect to `/sign-in?reason=session_expired` |
| 403 | Throw `ForbiddenError` (should not occur in normal use) |
| 404 | Throw `NotFoundError` with task ID |
| 422 | Throw `ValidationError` with field-level messages from response body |
| 5xx | Throw `ServerError`; caller displays generic error banner |
| Network failure | Throw `NetworkError`; caller displays connection error banner |

## Response Shape (from backend)

Single task response:
```json
{ "data": { "id": "uuid", "user_id": "str", "title": "str", "description": "str|null", "completed": bool, "created_at": "iso8601", "updated_at": "iso8601" } }
```

Task list response:
```json
{ "data": [...tasks], "meta": { "total": N } }
```

## TypeScript Types

The API client MUST export TypeScript types for:
- `Task` — the task object shape
- `TaskCreateInput` — `{ title: string; description?: string }`
- `TaskUpdateInput` — `{ title: string; description?: string | null }`
- `TaskListResponse` — `{ data: Task[]; meta: { total: number } }`
- `TaskSingleResponse` — `{ data: Task }`

## Out of Scope

- Request caching or deduplication (Next.js fetch caching or SWR can be layered on top, but the API client itself is stateless)
- Retry logic (single attempt per call; the caller handles failure UX)
- Request cancellation (AbortController can be added in Phase 2.4 if needed)
