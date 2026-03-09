# API Contract: Phase 5.3 — Notification Service

**Branch**: `010-notification-service`
**Date**: 2026-03-09

---

## Notification Service — POST /on-reminder

**Purpose**: Dapr-invoked endpoint — receives CloudEvents from the `reminders` topic and logs the reminder message.

**Called by**: Dapr sidecar (not by users or other services directly)

### Request

```
POST /on-reminder
Content-Type: application/json
```

**Body** (CloudEvents v1.0 envelope from Dapr):

```json
{
  "specversion": "1.0",
  "type": "com.dapr.event.sent",
  "source": "todo-backend",
  "topic": "reminders",
  "pubsubname": "todoai-pubsub",
  "id": "<uuid>",
  "time": "2026-03-09T04:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "action": "reminder",
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_title": "remind me to call doctor",
    "user_id": "user_alice",
    "timestamp": "2026-03-09T04:00:00+00:00"
  }
}
```

### Response — Success (200 OK)

```json
{}
```

**⚠️ CRITICAL**: Dapr requires HTTP 200 to acknowledge message delivery. Any non-2xx response causes Dapr to retry delivery.

### Response — Malformed Event (200 OK + WARNING log)

Even for malformed events, the service MUST return 200 to prevent Dapr retry storms. The warning is logged internally.

### Error Handling

| Scenario | Behaviour | Log |
|----------|-----------|-----|
| Valid event | Log REMINDER message, return 200 | INFO |
| Missing `task_title` or `user_id` | Return 200, skip REMINDER log | WARNING |
| Missing `data` field | Use body as-is (fallback), return 200 | WARNING |
| Unhandled exception | Return 200 (prevent retry storm), log ERROR | ERROR |

---

## Backend — Reminder Trigger (Extension to existing create_task route)

**Existing endpoint**: `POST /api/{user_id}/tasks` — unchanged signature and response.

**New behaviour** (additive only, BackgroundTask):

After successful `op_create_task()`, check keyword in title:

```python
# Pseudo-code — actual implementation in routes/tasks.py
if any(kw in body.title.lower() for kw in ["remind me", "alert"]):
    background_tasks.add_task(
        publish_reminder_event,
        str(task.id),
        task.title,
        user_id
    )
```

**No change to HTTP response shape** — task creation returns `TaskSingleResponse` as before.

---

## events.py Extension — publish_reminder_event

**Module**: `todo-web-app/backend/app/logic/events.py`

**New function signature**:

```python
def publish_reminder_event(task_id: str, task_title: str, user_id: str) -> None:
    """Publish a reminder event to the reminders topic via Dapr sidecar.

    Fire-and-forget: never raises. Same retry contract as publish_task_event.
    Endpoint: http://localhost:3500/v1.0/publish/todoai-pubsub/reminders
    """
```

**Payload**:
```json
{
  "action": "reminder",
  "task_id": "<uuid string>",
  "task_title": "<full title>",
  "user_id": "<user_id>",
  "timestamp": "<ISO 8601 UTC>"
}
```

**Retry contract**: 3 attempts, exponential backoff 200ms→400ms→max 5s. Same as `publish_task_event` (Constitution Principle XV).

---

## Dapr Declarative Subscription

**File**: `todo-web-app/k8s/dapr/subscription-reminders.yaml`

```yaml
apiVersion: dapr.io/v2alpha1
kind: Subscription
metadata:
  name: reminders-subscription
  namespace: default
spec:
  pubsubname: todoai-pubsub
  topic: reminders
  routes:
    default: /on-reminder
scopes:
  - todo-notification-service
auth:
  secretStore: kubernetes
```

**Scope**: Only `todo-notification-service` receives the `reminders` topic. Other services (todo-backend, todo-frontend) are excluded.

---

## Verification Commands

```bash
# Follow notification service logs in real-time
kubectl logs -f -l app.kubernetes.io/name=todoai-notification --container notification

# Create a reminder task (replace USER_ID and TOKEN)
curl -X POST http://$(minikube ip):30800/api/<USER_ID>/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "remind me to call doctor", "description": ""}'

# Expected log output within 5 seconds:
# [REMINDER]: Hey User <USER_ID>, your task "remind me to call doctor" is due now!

# Check Dapr subscription loaded
kubectl get subscriptions.dapr.io
```
