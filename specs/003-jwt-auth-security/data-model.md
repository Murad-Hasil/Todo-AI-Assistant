# Data Model: Phase 2.2 — JWT Authentication & Security

**Feature**: `003-jwt-auth-security`
**Date**: 2026-03-03

## Summary

Phase 2.2 introduces **no new database entities**. JWT verification is stateless — tokens are validated in memory using the shared `BETTER_AUTH_SECRET` and discarded after each request. No token storage, blacklist table, or session table is required.

## Existing Entity: Task (unchanged)

| Column       | Type            | Constraints                          | Notes                         |
|--------------|-----------------|--------------------------------------|-------------------------------|
| `id`         | UUID            | PRIMARY KEY, NOT NULL                | Auto-generated                |
| `user_id`    | VARCHAR         | NOT NULL, INDEX                      | Populated from JWT `sub` claim |
| `title`      | VARCHAR(200)    | NOT NULL                             |                               |
| `description`| TEXT            | NULLABLE                             |                               |
| `completed`  | BOOLEAN         | NOT NULL, DEFAULT FALSE              |                               |
| `created_at` | TIMESTAMPTZ     | NOT NULL, DEFAULT NOW()              |                               |
| `updated_at` | TIMESTAMPTZ     | NOT NULL, DEFAULT NOW(), ON UPDATE   |                               |

`task.user_id` is the join point between the database and the JWT identity. In Phase 2.1, `user_id` was populated with the hardcoded stub value `"dev-user-id"`. In Phase 2.2, `user_id` is populated from the verified JWT `sub` claim — the column definition is unchanged.

## JWT Token (in-memory, not persisted)

The JWT payload decoded by the backend:

| Claim | Type   | Required | Notes                          |
|-------|--------|----------|--------------------------------|
| `sub` | string | YES      | Used as `user_id` in all queries |
| `exp` | number | YES      | Unix timestamp; validated by PyJWT |
| `iat` | number | NO       | Issued-at; not validated       |

No new migration is needed for Phase 2.2.

## Configuration Entity: Settings (extended)

The `Settings` class in `app/db.py` gains one new field:

| Field                | Source              | Required | Default | Notes                          |
|----------------------|---------------------|----------|---------|--------------------------------|
| `better_auth_secret` | `BETTER_AUTH_SECRET`| YES      | `""`    | Startup validation: empty → crash |
