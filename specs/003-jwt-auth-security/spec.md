# Feature Specification: JWT Authentication & Security

**Feature Branch**: `003-jwt-auth-security`
**Created**: 2026-03-03
**Status**: Draft
**Phase**: 2.2 — Authentication & JWT Security

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure API Access with Valid JWT (Priority: P1)

As an authenticated user, when I include a valid JWT in my API requests, the backend recognizes my identity and returns only my tasks — no other user's data is ever visible to me.

**Why this priority**: Core security requirement. Without this, the application cannot safely serve multiple users. All CRUD endpoints depend on a verified identity.

**Independent Test**: Issue a valid JWT from the frontend login flow, call `GET /api/tasks`, and confirm only tasks belonging to the authenticated user are returned.

**Acceptance Scenarios**:

1. **Given** a valid JWT issued by Better Auth, **When** the client sends `Authorization: Bearer <token>` to `GET /api/tasks`, **Then** the backend returns HTTP 200 with only the authenticated user's tasks.
2. **Given** a valid JWT, **When** the client creates a task via `POST /api/tasks`, **Then** the task is saved with `user_id` extracted from the token (not from any request body field).
3. **Given** a valid JWT for User A, **When** User A requests a task that belongs to User B, **Then** the backend returns HTTP 404 (not 403, to avoid revealing existence).

---

### User Story 2 - Rejection of Invalid or Missing Tokens (Priority: P1)

As a system administrator, I need all API endpoints (except the health check) to reject requests that lack a valid JWT, so the application data is never exposed to unauthenticated callers.

**Why this priority**: Co-equal with US1 — a system that accepts valid tokens but fails to reject invalid ones provides no security guarantees.

**Independent Test**: Send requests without an `Authorization` header and with a malformed/expired token to any protected endpoint; confirm all return HTTP 401 with a consistent error format.

**Acceptance Scenarios**:

1. **Given** no `Authorization` header, **When** the client calls any `/api/*` endpoint (except `/health`), **Then** the backend returns HTTP 401 with `{"detail": "Not authenticated"}`.
2. **Given** a malformed token (wrong format, invalid signature, expired), **When** the client calls any protected endpoint, **Then** the backend returns HTTP 401.
3. **Given** a token signed with the wrong secret, **When** the client calls any protected endpoint, **Then** the backend returns HTTP 401 and logs a security audit event.
4. **Given** the `/health` endpoint, **When** any client calls it without a token, **Then** the backend returns HTTP 200 (health check is unauthenticated).

---

### User Story 3 - Token-Derived User Identity (Priority: P2)

As a developer, I want the backend to derive `user_id` exclusively from the verified JWT payload (the `sub` claim), so that user impersonation through crafted request parameters is impossible.

**Why this priority**: Architectural integrity — ensures no path parameter or request body field can override identity, even if a bug elsewhere exposes the parameter.

**Independent Test**: Call any task endpoint without placing `user_id` in the request body or URL; verify the returned tasks match the token's `sub` claim.

**Acceptance Scenarios**:

1. **Given** a valid JWT with `sub: "user-abc"`, **When** the client POSTs a task with no `user_id` field in the body, **Then** the task is stored with `user_id = "user-abc"`.
2. **Given** a valid JWT with `sub: "user-abc"`, **When** the client includes `user_id: "user-xyz"` in the request body, **Then** the server ignores the body field and uses `"user-abc"` from the token.
3. **Given** the backend startup, **When** `BETTER_AUTH_SECRET` environment variable is absent or empty, **Then** the application refuses to start and logs a fatal configuration error.

---

### Edge Cases

- What happens when the JWT `exp` claim is exactly at the current timestamp? → Treat as expired; return 401.
- What happens when the JWT payload is missing the `sub` claim? → Return 401; log as malformed token.
- What happens when `BETTER_AUTH_SECRET` is rotated mid-session? → Tokens signed with the old secret fail verification and return 401.
- What happens when the `Authorization` header has extra whitespace or wrong casing? → Return 401 (strict header parsing).
- What happens when both frontend and backend use different `BETTER_AUTH_SECRET` values? → All tokens fail verification; return 401.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All `/api/*` endpoints MUST require a valid `Authorization: Bearer <token>` header, with the sole exception of `/health`.
- **FR-002**: The backend MUST verify the JWT signature using the `BETTER_AUTH_SECRET` environment variable (HS256 algorithm).
- **FR-003**: The backend MUST extract the `user_id` from the JWT `sub` claim after successful verification.
- **FR-004**: Requests with a missing, malformed, expired, or incorrectly-signed JWT MUST receive HTTP 401 with a consistent JSON error body.
- **FR-005**: The `user_id` used in all database queries MUST come exclusively from the decoded JWT payload — never from request parameters or body.
- **FR-006**: The backend MUST log a security audit event (timestamp, endpoint, failure reason) for every rejected token.
- **FR-007**: The `BETTER_AUTH_SECRET` environment variable MUST be validated at application startup; the app MUST refuse to start if it is absent or empty.
- **FR-008**: The frontend (Better Auth) and backend MUST share the same `BETTER_AUTH_SECRET` value to ensure tokens issued by the frontend can be verified by the backend.
- **FR-009**: The existing `routes/tasks.py` MUST require zero structural changes when the auth stub is replaced with real JWT verification.
- **FR-010**: The `auth.py` module body MUST be the only file changed to transition from Phase 2.1 stub to Phase 2.2 real JWT.

### Key Entities

- **JWT Token**: A signed HS256 token issued by Better Auth on the frontend, containing `sub` (user ID), `exp` (expiration), and `iat` (issued-at) claims.
- **Verified User**: The authenticated identity derived from a successfully decoded JWT — represented as a `user_id` string used to scope all database queries.
- **BETTER_AUTH_SECRET**: A shared secret string present as an environment variable on both the frontend and backend services.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests to protected endpoints without a valid JWT are rejected with HTTP 401 — zero unauthorized data exposures.
- **SC-002**: Token verification adds no more than 10ms of latency to any API response (measured at p95).
- **SC-003**: All 6 task CRUD endpoints continue to pass their Phase 2.1 tests after JWT is wired in — zero regressions.
- **SC-004**: Every rejected token attempt is captured in the audit log within 1 second of the rejection event.
- **SC-005**: Application startup fails with a clear error message when `BETTER_AUTH_SECRET` is not configured — detectable in under 5 seconds.
- **SC-006**: Zero code changes required in `routes/tasks.py` when replacing the Phase 2.1 stub with Phase 2.2 real JWT verification.

## Assumptions

- Better Auth issues standard HS256 JWTs with a `sub` claim containing the user's unique ID string.
- The `BETTER_AUTH_SECRET` is a stable, pre-shared value managed via environment variables (not rotated automatically).
- Audit logging writes to standard output (captured by the hosting platform's log aggregator); a dedicated log storage system is out of scope for Phase 2.2.
- Clock skew between token issuer and verifier is assumed to be negligible (< 1 second) in the deployment environment.
- Phase 2.3 (AI Chatbot integration) will reuse the same auth mechanism without changes.
