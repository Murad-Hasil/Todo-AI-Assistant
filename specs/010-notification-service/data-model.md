# Data Model: Phase 5.3 — Event-Driven Notification Service

**Branch**: `010-notification-service`
**Date**: 2026-03-09

---

## Entities

### ReminderEvent (Event Payload — no DB table)

Published to the `reminders` Kafka topic by the backend when a task title contains a trigger keyword.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | YES | Always `"reminder"` |
| `task_id` | string (UUID) | YES | ID of the task that triggered the reminder |
| `task_title` | string | YES | Full title of the task (for log message — no DB lookup needed by consumer) |
| `user_id` | string | YES | Authenticated user who created the task |
| `timestamp` | string (ISO 8601) | YES | UTC timestamp of task creation |

**Validation rules**:
- `action` MUST be `"reminder"` — any other value is rejected by the notification service
- `task_id` MUST be a valid UUID string
- `task_title` MUST be non-empty — if absent, notification service logs a WARNING and skips
- `user_id` MUST be non-empty — if absent, notification service logs a WARNING and skips

---

### CloudEvent Envelope (Dapr-added wrapper)

Dapr wraps every published message in a CloudEvents v1.0 envelope before delivery to the subscriber. The notification service receives this envelope and extracts the `data` field.

| Field | Type | Description |
|-------|------|-------------|
| `specversion` | string | Always `"1.0"` |
| `type` | string | `"com.dapr.event.sent"` |
| `source` | string | `"todo-backend"` |
| `topic` | string | `"reminders"` |
| `pubsubname` | string | `"todoai-pubsub"` |
| `data` | object | The `ReminderEvent` payload |
| `datacontenttype` | string | `"application/json"` |

---

### Subscription (Dapr Manifest — not a DB entity)

Declarative configuration binding the Kafka topic to the notification service endpoint.

| Field | Value |
|-------|-------|
| `pubsubname` | `todoai-pubsub` |
| `topic` | `reminders` |
| `route` | `/on-reminder` |
| `scope` | `todo-notification-service` (only this app-id receives the topic) |

---

## No Database Schema Changes

The notification service is stateless — it processes events and logs output, no tables created or modified. The main backend's `Task` SQLModel table is unchanged (FR-002, Constitution Principle III).

---

## State Transitions

```
Task Created (title contains "remind me"/"alert")
    │
    ▼ (backend: BackgroundTask after commit)
ReminderEvent published → reminders topic
    │
    ▼ (Dapr delivers to todo-notification-service /on-reminder)
Notification logged: "[REMINDER]: Hey User {user_id}, your task '{task_title}' is due now!"
    │
    ▼
HTTP 200 returned to Dapr (acknowledge delivery)
```
