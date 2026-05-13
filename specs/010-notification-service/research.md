# Research: Phase 5.3 — Event-Driven Notification Service

**Branch**: `010-notification-service`
**Date**: 2026-03-09
**Status**: Complete — all decisions resolved

---

## R-001: Reminder Publish Point — Routes vs task_ops.py

**Decision**: Publish reminder events from `routes/tasks.py` (BackgroundTasks), NOT from `task_ops.py`.

**Rationale**: Constitution Principle III forbids modifying Phase 2–4 service layer code without explicit amendment. `task_ops.py` is the shared CRUD layer — adding event publishing there would violate single-responsibility and make it aware of Dapr. This is the same decision made in Phase 5.2 (research R-005). The route layer is the correct place: it already handles request/response concerns, has access to BackgroundTasks, and is explicitly Phase 5 territory.

**Alternatives considered**: Modifying `task_ops.py` directly (rejected — violates Principle III and single-responsibility). Using a middleware hook (rejected — too implicit). Using a startup background job (rejected — wrong lifecycle).

**Note on user plan prompt**: The plan prompt says "modify task_ops.py" — this is overridden by Constitution Principle III. Reminder publish is wired in `routes/tasks.py` `create_task` handler only, after a successful `op_create_task()` call.

---

## R-002: Reminder Event Payload — Must Include task_title

**Decision**: The reminder event payload MUST include `task_title` (the full task title string), unlike the `task-events` audit payload which only carries `task_id`.

**Rationale**: The notification service logs `[REMINDER]: Hey User {user_id}, your task "{task_title}" is due now!` without any database access. Constitution Principle V states event payloads must embed enough data for consumers to operate without additional DB lookups. Including `task_title` in the payload satisfies this requirement.

**Reminder event schema**:
```json
{
  "action": "reminder",
  "task_id": "<uuid>",
  "task_title": "<full title string>",
  "user_id": "<user_id>",
  "timestamp": "<ISO 8601>"
}
```

---

## R-003: Dapr CloudEvents Parsing in Notification Service

**Decision**: Dapr delivers events to the `/on-reminder` endpoint wrapped in CloudEvents v1.0 envelope. The application payload is in the `data` field.

**Rationale**: Dapr pubsub always wraps messages in CloudEvents format when `datacontenttype: application/json` is used. The notification service must parse `request.body["data"]` (or use Dapr Python SDK `CloudEvent` model) to extract the application payload.

**CloudEvents envelope structure** (from Dapr):
```json
{
  "specversion": "1.0",
  "type": "com.dapr.event.sent",
  "source": "todo-backend",
  "topic": "reminders",
  "pubsubname": "todoai-pubsub",
  "data": {
    "action": "reminder",
    "task_id": "...",
    "task_title": "...",
    "user_id": "...",
    "timestamp": "..."
  },
  "datacontenttype": "application/json"
}
```

**Implementation**: Use `dapr-ext-fastapi` or manual JSON body parsing. Simplest: `body = await request.json(); payload = body.get("data", body)` — handles both wrapped and raw payloads.

---

## R-004: Dapr Declarative Subscription Manifest

**Decision**: Use a Dapr `Subscription` (v2alpha1) manifest at `todo-web-app/k8s/dapr/subscription-reminders.yaml` binding the `reminders` topic to the `todo-notification-service` app.

**Rationale**: Constitution Principle XII requires consumer services to subscribe via Dapr subscription manifests — not ad-hoc polling or direct broker connections. Declarative subscriptions are applied to the cluster and the Dapr operator pushes them to the sidecar automatically.

**Manifest skeleton**:
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
```

**Why v2alpha1**: Dapr 1.13+ uses `v2alpha1` for subscriptions with `routes` support. The existing subscriptions in Phase 5.1 already use this version.

---

## R-005: Notification Service — Framework and Port

**Decision**: Lightweight FastAPI on port 8080, single-file `app/main.py`, no database, no auth.

**Rationale**: The service only needs one POST endpoint to receive Dapr-pushed events. FastAPI is already the project standard. Port 8080 avoids conflict with the main backend (8000). No database needed — the service is stateless. No auth needed — only internal Dapr sidecar calls reach `/on-reminder`.

**Dependencies**: `fastapi>=0.115.0`, `uvicorn[standard]>=0.30.0`, no database drivers.

---

## R-006: Keyword Detection — "remind me" OR "alert"

**Decision**: Case-insensitive substring check: `any(kw in title.lower() for kw in ["remind me", "alert"])`.

**Rationale**: The spec defines "remind me" as the primary trigger. The plan prompt adds "alert". Simple substring match is sufficient for Phase 5.3 — no regex or NLP needed.

**Publish point**: Only in `create_task` route (FR-001) — not on update/delete.

---

## R-007: events.py Extension — publish_reminder_event

**Decision**: Add `publish_reminder_event(task_id, task_title, user_id)` to `app/logic/events.py` alongside the existing `publish_task_event`.

**Rationale**: Keeps all Dapr HTTP publish logic in one module. Same retry pattern (3 attempts, exponential backoff). Target endpoint: `http://localhost:3500/v1.0/publish/todoai-pubsub/reminders`. Never raises (fire-and-forget — same contract as `publish_task_event`).

---

## R-008: Helm Template Strategy — New Deployment + Service

**Decision**: Add `notification-deployment.yaml` and `notification-service.yaml` to `todo-web-app/k8s/charts/todoai/templates/`. Reuse the same chart — no new chart needed.

**Rationale**: The notification service is part of the same application suite. Adding templates to the existing chart is simpler than a sub-chart and keeps deployment atomic. Values for the notification service image tag live in `values.yaml`.

**Dapr annotations required** (Principle XIII):
```yaml
dapr.io/enabled: "true"
dapr.io/app-id: "todo-notification-service"
dapr.io/app-port: "8080"
```
