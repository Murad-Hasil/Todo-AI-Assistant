# Authentication Flow — Phase 2.2

**Feature**: `003-jwt-auth-security`
**Created**: 2026-03-03

## Overview

Phase 2.2 replaces the Phase 2.1 JWT stub with real token verification. The flow is:

```
Frontend (Better Auth) → issues JWT on login
Client                 → includes JWT in Authorization header
Backend (FastAPI)      → extracts, verifies, decodes JWT
Backend                → uses decoded sub claim as user_id
```

## Step-by-Step Flow

### 1. User Login (Frontend)

- User submits credentials to the Better Auth frontend login handler.
- Better Auth validates credentials and issues a signed HS256 JWT.
- JWT payload contains at minimum:
  - `sub` — the user's unique ID string (used as `user_id` on the backend)
  - `exp` — expiration timestamp (Unix epoch seconds)
  - `iat` — issued-at timestamp

### 2. Authenticated API Request (Client)

- The frontend stores the JWT (in memory or a secure cookie — handled by Better Auth).
- For every API call to `/api/*`, the frontend includes:
  ```
  Authorization: Bearer <jwt-token>
  ```

### 3. Token Extraction & Verification (Backend)

- FastAPI extracts the `Authorization` header value.
- The `get_current_user_id()` function in `app/auth.py`:
  1. Strips the `Bearer ` prefix.
  2. Decodes the token using `BETTER_AUTH_SECRET` and HS256 algorithm.
  3. Validates `exp` claim (raises 401 if expired).
  4. Validates `sub` claim is present and non-empty (raises 401 if missing).
  5. Returns `sub` as the `user_id` string.
- On any failure: raises HTTP 401 and writes a security audit log entry.

### 4. User Identity Propagation

- `user_id` returned by `get_current_user_id()` is injected into route handlers via `Depends()`.
- All database queries in `routes/tasks.py` use this `user_id` with `WHERE task.user_id == user_id`.
- No route handler reads `user_id` from the request body or URL path.

## Environment Variables

| Variable             | Owner    | Required | Description                                    |
|----------------------|----------|----------|------------------------------------------------|
| `BETTER_AUTH_SECRET` | Both     | YES      | Shared HS256 signing secret                    |
| `ENVIRONMENT`        | Backend  | NO       | Set to `production` to disable stub fallback   |

## Transition from Phase 2.1

Only `app/auth.py` changes between Phase 2.1 and Phase 2.2:

| Phase   | `get_current_user_id()` behaviour         |
|---------|-------------------------------------------|
| 2.1     | Returns `"dev-user-id"` (stub)            |
| 2.2     | Verifies JWT and returns `sub` claim      |

The function signature remains identical — `routes/tasks.py` requires zero modifications.

## Error Responses

| Condition                        | HTTP Status | Response Body                          |
|----------------------------------|-------------|----------------------------------------|
| Missing `Authorization` header   | 401         | `{"detail": "Not authenticated"}`      |
| Malformed token format           | 401         | `{"detail": "Invalid token"}`          |
| Invalid signature                | 401         | `{"detail": "Invalid token"}`          |
| Expired token                    | 401         | `{"detail": "Token expired"}`          |
| Missing `sub` claim              | 401         | `{"detail": "Invalid token"}`          |
