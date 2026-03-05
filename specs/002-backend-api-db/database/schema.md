# Database Schema Specification

**Feature**: `002-backend-api-db`
**Source**: Project PDF Pages 12, 14
**Status**: Draft
**Last Updated**: 2026-03-03

## Overview

The application uses two tables: `users` (owned by Better Auth) and `tasks`
(owned by the backend service). All task queries MUST scope results to the
authenticated `user_id`.

---

## Table: `users`

**Owner**: Better Auth (external auth provider)
**Note**: This table is created and managed entirely by Better Auth. The
backend service MUST NOT issue DDL statements against this table. It is
referenced here for FK contract documentation only.

| Column       | Type                        | Constraints                        |
|--------------|-----------------------------|------------------------------------|
| `id`         | `VARCHAR` / `UUID`          | PRIMARY KEY                        |
| `email`      | `VARCHAR(255)`              | NOT NULL, UNIQUE                   |
| `name`       | `VARCHAR(255)`              | NULLABLE                           |
| `created_at` | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, DEFAULT `now()`          |

---

## Table: `tasks`

**Owner**: Backend FastAPI service
**Managed by**: SQLModel ORM migrations

| Column        | Type                       | Constraints                                      |
|---------------|----------------------------|--------------------------------------------------|
| `id`          | `UUID`                     | PRIMARY KEY, DEFAULT `gen_random_uuid()`         |
| `user_id`     | `VARCHAR` / `UUID`         | NOT NULL, FOREIGN KEY → `users.id` ON DELETE CASCADE |
| `title`       | `VARCHAR(200)`             | NOT NULL, CHECK `length(title) >= 1`             |
| `description` | `TEXT`                     | NULLABLE, CHECK `length(description) <= 1000`    |
| `completed`   | `BOOLEAN`                  | NOT NULL, DEFAULT `false`                        |
| `created_at`  | `TIMESTAMP WITH TIME ZONE` | NOT NULL, DEFAULT `now()`                        |
| `updated_at`  | `TIMESTAMP WITH TIME ZONE` | NOT NULL, DEFAULT `now()`, updated on every write |

### Constraints

- `title` MUST be non-empty (length ≥ 1) and MUST NOT exceed 200 characters.
- `description` is optional (NULL permitted) and MUST NOT exceed 1000 characters
  when provided.
- `completed` defaults to `false` on creation.
- `created_at` is set once at insert; it MUST NOT be updated.
- `updated_at` MUST be updated on every `UPDATE` operation (enforce via trigger
  or ORM event listener).
- On `users.id` deletion, all associated `tasks` rows MUST be cascade-deleted.

---

## Required Indexes

| Index Name                  | Table   | Column(s)               | Purpose                              |
|-----------------------------|---------|-------------------------|--------------------------------------|
| `idx_tasks_user_id`         | `tasks` | `user_id`               | Efficient per-user task list queries |
| `idx_tasks_completed`       | `tasks` | `completed`             | Efficient status filter queries      |
| `idx_tasks_user_completed`  | `tasks` | `(user_id, completed)`  | Composite: per-user status filter    |

**Rationale for composite index**: The most common query pattern is
`WHERE user_id = ? AND completed = ?`; the composite index covers this without
needing both single-column indexes to be merged at query time.

---

## Entity Relationship

```
users (Better Auth)
  id PK ──────────────────────┐
  email                       │ FK (CASCADE DELETE)
  name                        │
  created_at                  │
                              ▼
                         tasks
                           id PK
                           user_id FK → users.id
                           title
                           description
                           completed
                           created_at
                           updated_at
```

---

## Migration Notes

- The `users` table is provisioned by Better Auth before any backend migrations run.
- All `tasks` table DDL MUST be managed via SQLModel/Alembic migrations; no
  manual DDL is permitted in production.
- The `updated_at` column MUST be kept current via an ORM-level `onupdate` hook
  (not a raw database trigger) to keep the logic portable across environments.
