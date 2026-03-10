# Data Model: Phase 5.2 — Audit Logs & Statestore Fix

**Branch**: `009-audit-statestore` | **Date**: 2026-03-09

---

## Entities

### AuditEvent (message payload — NOT a DB table)

Published to the `task-events` Kafka topic via Dapr pubsub. Immutable once published. Not persisted in the application database.

```json
{
  "action": "created | updated | deleted",
  "task_id": "uuid-string",
  "user_id": "uuid-string",
  "timestamp": "2026-03-09T12:00:00.000000+00:00"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | string | Enum: `"created"`, `"updated"`, `"deleted"` |
| `task_id` | string (UUID) | Must be a valid UUID from the tasks table |
| `user_id` | string | Must match authenticated user — never empty |
| `timestamp` | string (ISO 8601) | UTC, generated at publish time |

**Validation**: If `task_id` or `user_id` is empty/None → do NOT publish; log WARNING.

---

### Task (existing — NO schema changes)

Unchanged from Phase 2. Reproduced here for reference only.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | string | FK to Better Auth users — always scoped |
| `title` | string | Required |
| `description` | string \| None | Optional |
| `completed` | bool | Default False |
| `created_at` | datetime | Auto-set on create |
| `updated_at` | datetime | Auto-updated on mutation |

---

### Dapr State Entry (infrastructure validation only in this phase)

Managed by Dapr `state.postgresql` component. Stored in `dapr_state` table (Neon PostgreSQL — pre-created in Phase 5.1).

| Field | Type | Notes |
|-------|------|-------|
| `key` | string | Namespaced by Dapr: `<app-id>||<key>` |
| `value` | jsonb | Arbitrary JSON payload |
| `isbinary` | bool | False for JSON values |
| `etag` | varchar(50) | Optimistic concurrency |
| `expiredtime` | timestamptz | Nullable — for TTL use |
| `updatedate` | timestamptz | Auto-updated |

---

## State Transitions

### Task Lifecycle → Audit Events

```
Task Created ──────────────────→ publish { action: "created", ... }
     │
     ├── Task Updated ──────────→ publish { action: "updated", ... }
     │   (title, description,
     │    or completion toggled)
     │
     └── Task Deleted ──────────→ publish { action: "deleted", ... }
```

**Note**: `op_complete_task` and `toggle_task_completion` both trigger `action: "updated"` (they modify task state). Only hard deletes trigger `action: "deleted"`.

---

## No Schema Migrations Required

- `tasks` table: unchanged
- `conversations`, `messages` tables: unchanged
- `dapr_state`, `dapr_metadata`: already created manually in Phase 5.1 (Neon PostgreSQL)
- No Alembic migration needed for this phase
