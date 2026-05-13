# Research: Phase 5.5 — Intelligent Scheduling with Dapr Jobs API

**Branch**: `013-dapr-jobs-scheduling` | **Date**: 2026-04-02

## Decision 1: Dapr Jobs API Endpoint & Payload Format

**Decision**: Use `POST http://localhost:3500/v1.0-alpha1/jobs/{job-name}` via `httpx`
in the backend. The payload is a JSON body with `dueTime` (RFC 3339 / ISO 8601 UTC)
and a nested `data` object containing the job's application payload.

**Rationale**: `httpx` is already a declared dependency (`>=0.27.0` in pyproject.toml).
No new HTTP client needed. The alpha1 endpoint is the only available Jobs API path in
Dapr 1.13–1.17 (the installed version range). When Dapr fires the job, it sends a
POST to the backend's registered `job` handler — by default `POST /job/{job-name}` —
but can be overridden via app configuration. We will use `/api/jobs/trigger` registered
via the standard Dapr app callback mechanism (app-channel protocol).

**Important discovery**: Dapr Jobs API fires the callback to `/job/{job-name}` on the
app's HTTP channel by default (not a configurable subscription YAML). The backend must
handle this path. To keep routing clean and consistent with the API-first principle, we
will register the callback at `/job/reminder` (Dapr's default pattern) and internally
forward to `publish_reminder_event()`.

**Alternative considered**: Kubernetes CronJob for one-shot scheduling — rejected
because CronJobs cannot express one-shot arbitrary future times without creating and
deleting CronJob objects per reminder, which is operationally fragile. Dapr Jobs API
is purpose-built for this pattern.

---

## Decision 2: Natural Language Time Parsing Library

**Decision**: Use `dateparser>=1.2.0` (pure Python, no binary deps).

**Rationale**: `dateparser` handles relative expressions ("in 10 minutes", "tomorrow at
9am", "next Monday at 2pm"), absolute times ("3pm", "15:00"), and localized formats.
It outputs a `datetime` object that we normalize to UTC using Python's `datetime.timezone.utc`.
No additional timezone database is needed beyond Python's standard library.

**Configuration**: Call with `settings={"RETURN_AS_TIMEZONE_AWARE": True,
"PREFER_DATES_FROM": "future", "TO_TIMEZONE": "UTC"}` to ensure all outputs are
UTC-aware datetimes.

**Alternative considered**: `arrow` library — rejected because it requires an additional
dependency and adds no capability over `dateparser` + stdlib for this use case.

---

## Decision 3: statestore.yaml — connectionTimeout & keyPrefix

**Decision**: Add two metadata entries to the existing `statestore.yaml`:
1. `name: connectionTimeout` / `value: "30s"` — allows Neon cold-start (3s+) to succeed
   within the sidecar's init window.
2. `name: keyPrefix` / `value: "name"` — keys stored as `{componentName}||{key}` instead
   of `{appId}||{key}`, which is required by the Dapr Scheduler service to locate job
   state across restarts (it uses a fixed component-name prefix lookup).

**Rationale**: Phase 5.2 identified the root cause: pgBouncer DDL timeout + Neon cold
start. The current `statestore.yaml` uses `disableEntityManagement: true` (tables
pre-created). Adding `connectionTimeout: 30s` extends the connection establishment
window so cold Neon endpoints don't crash the sidecar on first connect. The `keyPrefix:
name` setting is specifically required by Dapr's internal Scheduler when it uses a
state store to persist jobs — it must find keys by component name, not by app ID.

**No change to tableName/metadataTableName**: `dapr_state` and `dapr_metadata` tables
were pre-created in Phase 5.2. The schema is compatible with the Jobs API persistence.

---

## Decision 4: Callback Route — `/job/reminder` vs `/api/jobs/trigger`

**Decision**: Register the route at BOTH paths:
- Dapr's native callback path: `POST /job/reminder` (required for Dapr to deliver)
- User-spec alias: `POST /api/jobs/trigger` (also works, documented in spec)

**Rationale**: Dapr Jobs API v1.0-alpha1 invokes the app callback at `/job/{job-name}`
on the app's HTTP channel. The `job-name` pattern we use is `reminder-{user_id}-{task_id}-{ts}`,
so the route must be `POST /job/reminder-*` or we use a wildcard. The cleanest approach
is to name all reminder jobs with a fixed prefix `reminder` and register `/job/reminder`
as the handler. We add `/api/jobs/trigger` as an alias for the spec compliance and
testing. Both routes call the same handler function.

**Security**: Both endpoints check `request.client.host == "127.0.0.1"` and return
HTTP 403 for all other origins.

---

## Decision 5: Task Lookup in Callback Handler

**Decision**: The callback payload includes `task_id` (int) and `user_id` (str). The
handler must look up the task in PostgreSQL to get `task_title` for the reminder
event (the Notification Service requires `task_title`).

**Rationale**: `publish_reminder_event()` in `app/logic/events.py` requires three
parameters: `task_id`, `task_title`, `user_id`. The Dapr Jobs payload only contains
`task_id` and `user_id`. A single DB lookup by `(task_id, user_id)` is needed. This
is acceptable because the callback fires at most once per scheduled job.

**If task not found**: The job was scheduled for a task that has since been deleted.
Log WARNING and return HTTP 200 (ACK without publishing) to prevent Dapr from retrying
indefinitely for a non-existent task.

---

## Decision 6: MCP Tool Name — `schedule_reminder` (not `schedule_job`)

**Decision**: Name the MCP tool `schedule_reminder` as specified in the user's prompt
(FR-016 uses this name). The internal backend endpoint is `POST /api/jobs/schedule`.

**Rationale**: The spec requirement and user prompt both use `schedule_reminder`. The
tool name is user-facing (appears in the agent's tool list) so it should be semantically
clear. The `schedule_job` utility in `app/logic/scheduler.py` is an internal function.

---

## Decision 7: dapr-scheduler-server Verification

**Decision**: Verify Dapr Scheduler before deployment via:
```bash
kubectl get pods -n dapr-system | grep scheduler
kubectl logs -n dapr-system deployment/dapr-scheduler-server --tail=20
```

**Rationale**: Dapr Jobs API requires the `dapr-scheduler-server` component, which is
not installed by default in older Dapr versions. If missing, jobs will fail silently.
Verification is a prerequisite task before any implementation work.

**If scheduler not found**: Run `dapr init --kubernetes --wait` or upgrade Dapr to
>=1.14 which bundles the scheduler server.

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Dapr Jobs callback path | `/job/{job-name}` — hardcoded by Dapr runtime |
| `connectionTimeout` metadata key name | `connectionTimeout` (Dapr state.postgresql v1 metadata) |
| `keyPrefix` value for Scheduler | `"name"` (component-name prefix, required by Dapr Scheduler) |
| `httpx` availability | Already in pyproject.toml (`>=0.27.0`) |
| Task title lookup in callback | DB query by `(task_id, user_id)` — one-time lookup per job fire |
| `dateparser` output timezone | Configure `TO_TIMEZONE: "UTC"` + `RETURN_AS_TIMEZONE_AWARE: True` |
