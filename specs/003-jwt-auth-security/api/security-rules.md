# Security Rules — Phase 2.2

**Feature**: `003-jwt-auth-security`
**Created**: 2026-03-03

## Protected Endpoints

All `/api/*` endpoints MUST require a valid JWT. The ONLY exception is:

| Endpoint  | Auth Required | Reason                      |
|-----------|---------------|-----------------------------|
| `GET /health` | NO        | Infrastructure liveness check — no user data exposed |
| All `/api/*`  | YES       | User data access requires verified identity |

## Token Requirements

A token is considered **valid** only when ALL of the following are true:

1. The `Authorization` header is present and has the format `Bearer <token>`.
2. The token decodes successfully using `BETTER_AUTH_SECRET` and HS256 algorithm.
3. The `exp` claim is in the future (token is not expired).
4. The `sub` claim is present and non-empty.

Any violation of the above MUST result in HTTP 401. The specific failure reason MUST be logged but MUST NOT be revealed in the response body (to avoid leaking implementation details to attackers).

## User Isolation Rules

1. **Token-derived identity only**: `user_id` MUST be extracted from the JWT `sub` claim. Path parameters, query parameters, and request body fields MUST NOT influence `user_id`.
2. **All queries scoped**: Every database query MUST include `WHERE task.user_id == user_id` using the verified `user_id`.
3. **Cross-user access**: If a task is not found for the authenticated `user_id`, respond with HTTP 404 (not 403). This prevents enumeration of other users' task IDs.

## Shared Secret Requirements

- `BETTER_AUTH_SECRET` MUST be set identically on both frontend (Better Auth) and backend (FastAPI).
- The backend MUST validate this variable at startup. If absent or empty, the application MUST refuse to start.
- The secret MUST NOT be committed to source control. Use `.env` files excluded by `.gitignore`.
- Minimum entropy: treat as a password — use a randomly generated string of at least 32 characters.

## Audit Logging Requirements

Every rejected authentication attempt MUST produce a log entry containing:

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| `timestamp` | ISO 8601 UTC datetime                               |
| `event`     | `"auth_failure"`                                    |
| `endpoint`  | Request path (e.g., `GET /api/tasks`)               |
| `reason`    | One of: `missing_header`, `invalid_token`, `expired_token`, `missing_sub` |
| `source_ip` | Client IP address (if available from ASGI scope)    |

Successful authentications do NOT need to be logged (to avoid log volume issues at scale).

## Out of Scope for Phase 2.2

- Token refresh / sliding sessions (handled by Better Auth on the frontend)
- Role-based access control (RBAC) — all authenticated users have equal task permissions
- Rate limiting on auth failures (deferred to infrastructure layer)
- Token revocation / blocklist (Better Auth handles session termination)
- HTTPS enforcement (handled by the hosting platform — Vercel / FastAPI deployment)
