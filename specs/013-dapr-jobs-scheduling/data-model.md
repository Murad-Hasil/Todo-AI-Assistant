# Data Model: Phase 5.5 — Intelligent Scheduling with Dapr Jobs API

**Branch**: `013-dapr-jobs-scheduling` | **Date**: 2026-04-02

## No New Database Tables

Phase 5.5 introduces NO new SQLModel tables or Alembic migrations.

Job state is persisted exclusively in the Dapr State Store (Neon PostgreSQL via the
`todoai-statestore` component). The Dapr Scheduler owns the `dapr_state` and
`dapr_metadata` tables (pre-created in Phase 5.2). Application code never reads or
writes these tables directly.

---

## Pydantic Schemas (New — for API validation)

These Pydantic models live in `app/schemas.py` as new additions.

### ScheduleReminderRequest (MCP → backend)

```python
class ScheduleReminderRequest(BaseModel):
    user_id: str                          # JWT-extracted user identifier
    task_id: int                          # Target task (must exist and belong to user)
    reminder_time_natural_language: str   # e.g. "in 10 minutes", "tomorrow at 9am"
```

### ScheduleReminderResponse (backend → MCP)

```python
class ScheduleReminderResponse(BaseModel):
    job_name: str          # e.g. "reminder-user123-42-1743600000"
    due_time_utc: str      # ISO 8601 UTC — e.g. "2026-04-02T14:30:00Z"
    task_title: str        # Resolved task title (for agent confirmation message)
```

### JobTriggerPayload (Dapr → backend callback)

```python
class JobTriggerPayload(BaseModel):
    task_id: int
    user_id: str
    type: str = "reminder"
```

This is the `data` field extracted from the Dapr job callback body. Dapr wraps it in:
```json
{
  "name": "reminder-user123-42-1743600000",
  "data": { "task_id": 42, "user_id": "user123", "type": "reminder" }
}
```

---

## Internal Job Naming Convention

```
reminder-{user_id}-{task_id}-{unix_timestamp_seconds}
```

Examples:
- `reminder-abc123-42-1743600000`
- `reminder-def456-7-1743700800`

The Unix timestamp suffix ensures uniqueness even when the same user schedules
multiple reminders for the same task at different times.

---

## Dapr Jobs API Payload Contract

### Schedule Job Request (backend → Dapr sidecar)

```
POST http://localhost:3500/v1.0-alpha1/jobs/{job-name}
Content-Type: application/json

{
  "dueTime": "2026-04-02T14:30:00Z",
  "data": {
    "task_id": 42,
    "user_id": "user123",
    "type": "reminder"
  }
}
```

### Job Callback (Dapr sidecar → backend)

```
POST /job/{job-name}
Content-Type: application/json

{
  "name": "reminder-user123-42-1743600000",
  "data": {
    "task_id": 42,
    "user_id": "user123",
    "type": "reminder"
  }
}
```

Dapr delivers this to the app's HTTP channel (`http://localhost:{APP_PORT}/job/{job-name}`).

---

## Reminder Kafka Event (reuses existing schema)

The callback handler calls `publish_reminder_event()` from `app/logic/events.py` (unchanged).
This publishes to the `reminders` topic with the existing payload format:

```json
{
  "action": "reminder",
  "task_id": "42",
  "task_title": "Submit the report",
  "user_id": "user123",
  "timestamp": "2026-04-02T14:30:00.000000"
}
```

The Notification Service at `/on-reminder` already consumes this exact format (Phase 5.3).
**Zero changes** to `events.py` or the Notification Service.
