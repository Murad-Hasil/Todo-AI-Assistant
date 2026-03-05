# Authentication Pages — Phase 2.3

**Feature**: `004-nextjs-frontend`
**Created**: 2026-03-03

## Overview

Two pages: `/sign-up` and `/sign-in`. Both use Better Auth for credential management and session issuance. Better Auth must be configured to issue HS256 JWTs compatible with the Phase 2.2 backend verification.

## Sign-Up Page (`/sign-up`)

### Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email | email input | YES | Valid email format |
| Password | password input | YES | Minimum 8 characters |
| Confirm Password | password input | YES | Must match Password field |

### Behaviour

- Submit button disabled until all fields are valid.
- On success → redirect to `/dashboard`.
- On error (duplicate email, weak password) → display inline error message below relevant field.
- "Already have an account? Sign in" link → `/sign-in`.

## Sign-In Page (`/sign-in`)

### Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email | email input | YES | Valid email format |
| Password | password input | YES | Non-empty |

### Behaviour

- On success → redirect to `/dashboard` (or the page the user was trying to reach before being redirected to sign-in).
- On error (wrong credentials) → display "Invalid email or password." banner; email field NOT cleared.
- "Don't have an account? Sign up" link → `/sign-up`.
- Optional: "Session expired" message if arriving from a 401 redirect (`?reason=session_expired` query param).

## Better Auth Configuration Requirements

To make backend JWT verification work, Better Auth MUST be configured with:

| Setting | Value | Reason |
|---------|-------|--------|
| Session strategy | `jwt` | Issues tokens the backend can verify stateless-ly |
| JWT algorithm | `HS256` | Matches backend PyJWT configuration |
| JWT secret | Same value as backend `BETTER_AUTH_SECRET` | Shared signing secret |
| `sub` claim | User's unique ID | Backend uses `sub` as `user_id` |

Environment variable required on frontend:

```
BETTER_AUTH_SECRET=<same value as backend>
BETTER_AUTH_URL=http://localhost:3000  # (or production URL)
```

## Session Storage

Better Auth manages the session cookie/storage internally. The frontend application does not directly store or manipulate the JWT — it retrieves it via Better Auth's client SDK when needed to attach to API requests.

## Sign-Out

- Available from the dashboard navigation bar.
- Calls Better Auth's `signOut()` method, which clears the session.
- Immediately redirects to `/sign-in`.
- No confirmation dialog required.

## Redirect Logic

| Condition | Redirect To |
|-----------|-------------|
| Unauthenticated user visits `/dashboard` | `/sign-in` |
| Authenticated user visits `/sign-in` | `/dashboard` |
| Authenticated user visits `/sign-up` | `/dashboard` |
| Successful sign-in | `/dashboard` |
| Successful sign-up | `/dashboard` |
| Sign-out | `/sign-in` |
| Backend returns 401 | `/sign-in?reason=session_expired` |
