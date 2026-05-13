# Feature Specification: Phase 5.5 — Intelligent Scheduling with Dapr Jobs API

**Feature Branch**: `013-dapr-jobs-scheduling`
**Created**: 2026-04-02
**Status**: Draft
**Spec Directory**: `specs/013-dapr-jobs-scheduling/`

## Overview

Users of the Todo AI Assistant can ask the AI Agent to set a future reminder for any
task using natural language (e.g., "remind me to buy milk in 30 minutes" or "remind
me about the meeting tomorrow at 9am"). The AI schedules a precise, persistent job
that fires automatically at the correct time — even if the cluster is restarted —
and the existing Notification Service logs the reminder without any manual intervention.

This feature re-introduces the Dapr State Store (backed by the direct Neon connection)
as the persistence layer for job metadata, and introduces the Dapr Jobs API as the
exclusive scheduling runtime.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Schedule a Reminder via Natural Language (Priority: P1)

A user asks the AI Agent in the chat UI: "Remind me to submit the report in 10 minutes."
The agent parses the time expression, schedules a Dapr Job, and immediately confirms:
"I've scheduled a reminder for **Submit the report** at **[local time]** ([UTC] UTC)."
After 10 minutes, the Notification Service pod logs automatically print the reminder
message — no further user action required.

**Why this priority**: This is the core deliverable of Phase 5.5. All other stories
depend on this scheduling primitive being reliable end-to-end.

**Independent Test**: Can be tested in isolation by sending a single chat message with
a natural-language time expression and then monitoring `kubectl logs` on the
notification service pod after the elapsed time.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and has at least one task, **When** they ask the
   AI "remind me about [task] in 5 minutes", **Then** the AI responds with a confirmation
   message that includes the task name and the scheduled time (local and UTC).
2. **Given** a reminder has been scheduled, **When** the specified time elapses,
   **Then** the Notification Service pod logs contain a reminder line mentioning the
   task name and user — triggered automatically by Dapr, not by manual API call.
3. **Given** a reminder has been scheduled, **When** the Minikube cluster is restarted
   before the fire time, **Then** the job still fires at the correct time after the
   cluster comes back online (Dapr State Store persistence).

---

### User Story 2 — State Store Re-initialization for Job Persistence (Priority: P2)

The Dapr sidecar must successfully connect to the Neon PostgreSQL State Store using
the direct (non-pooler) connection string, with a 30-second connection timeout and
the `keyPrefix: name` metadata setting that prevents cold-start DDL failures. Jobs
scheduled through this state store must survive cluster restarts.

**Why this priority**: Without a persistent state store, Dapr Jobs are lost on cluster
restart. This story is the foundational infrastructure prerequisite for P1.

**Independent Test**: Can be tested by applying the corrected `statestore.yaml`, checking
that both backend and notification pods reach `2/2 Running` with 0 restarts, and then
verifying a state read/write cycle completes without error in `dapr logs`.

**Acceptance Scenarios**:

1. **Given** the updated `statestore.yaml` is applied to the cluster, **When** both pods
   start, **Then** neither pod has a restart due to state store connection failure and
   Dapr sidecar logs show "component loaded" for the statestore component.
2. **Given** the Neon endpoint is cold (first connection after idle period), **When**
   Dapr attempts to connect, **Then** the 30-second timeout allows the connection to
   succeed without crashing the sidecar.

---

### User Story 3 — Callback Endpoint Fires Reminder to Notification Service (Priority: P3)

When Dapr triggers the job callback at the scheduled time, the backend's
`POST /api/jobs/trigger` endpoint publishes a reminder event to the `reminders` Kafka
topic. The Notification Service — already subscribed to that topic — receives the event
and logs the reminder message, closing the scheduling loop from Phase 5.3.

**Why this priority**: Validates the end-to-end connection: Dapr Jobs → Backend callback
→ Kafka → Notification Service. P1 and P2 must work first.

**Independent Test**: Can be tested by calling `POST /api/jobs/trigger` directly from
within the cluster (via `kubectl exec`) with a valid payload, then checking notification
service logs for the corresponding reminder output.

**Acceptance Scenarios**:

1. **Given** a job fires and Dapr calls `/api/jobs/trigger` from `127.0.0.1`, **When**
   the callback receives a valid payload, **Then** it publishes to the `reminders` Kafka
   topic and returns HTTP 200.
2. **Given** a request to `/api/jobs/trigger` arrives from a non-localhost IP, **When**
   the endpoint receives it, **Then** it returns HTTP 403 and does not publish to Kafka.
3. **Given** a reminder event is published to the `reminders` topic, **When** the
   Notification Service consumes it, **Then** its pod logs contain a line like:
   `[REMINDER]: Hey User <user_id>, your task "<task_name>" reminder is firing now!`

---

### User Story 4 — AI Agent Confirms Scheduled Time in User's Language (Priority: P4)

After a job is successfully scheduled, the AI Agent formats a confirmation that shows
the fire time in the user's detected local timezone alongside the UTC equivalent. If
the user wrote in Roman Urdu, the confirmation is also in Roman Urdu.

**Why this priority**: Pure UX contract — the scheduling already works. This story
ensures the confirmation message meets Constitution Principle XVII.

**Independent Test**: Can be tested by sending a reminder request in English and one in
Roman Urdu and verifying that both responses include the time confirmation in the
appropriate language.

**Acceptance Scenarios**:

1. **Given** a reminder is scheduled successfully, **When** the agent responds, **Then**
   the message contains: the task name, local time, and UTC time.
2. **Given** the user's request is in Roman Urdu, **When** the agent responds, **Then**
   the confirmation is also in Roman Urdu.
3. **Given** the Dapr Jobs API returns an error, **When** the agent processes the
   failure, **Then** it responds with a plain-language error message and does NOT
   silently confirm a schedule that was never created.

---

### Edge Cases

- What happens if the user requests a reminder in the past (e.g., "yesterday at 9am")?
  The system must reject the request and inform the user that the time has already passed.
- What happens if the natural language parser cannot resolve the time expression?
  The system must return a plain-language error asking the user to specify a clearer time.
- What happens if the `reminders` Kafka topic does not exist in Redpanda Cloud?
  The callback publish will fail; the backend must log ERROR and return HTTP 503 so
  Dapr retries the job callback (Constitution Principle XV retry contract).
- What if two jobs with the same name are scheduled?
  The Dapr Jobs API will overwrite the existing job; job names must incorporate
  `user_id`, `task_id`, and a Unix timestamp suffix to ensure uniqueness.
- What if the Neon direct endpoint is unavailable at state store init time?
  The 30-second timeout must allow reconnection; if exhausted the sidecar logs a fatal
  error but the app container must still start (sidecar fails, app does not crash).

---

## Requirements *(mandatory)*

### Functional Requirements

**State Store (Foundation)**

- **FR-001**: The system MUST reintroduce a Dapr State Store component (`statestore.yaml`)
  configured with the Neon Direct Connection String (not the pgBouncer pooler URL).
- **FR-002**: The state store MUST set a connection timeout of 30 seconds to survive
  Neon cold-start latency.
- **FR-003**: The state store MUST include `metadata: { name: "keyPrefix", value: "name" }`
  to prevent DDL-related sidecar crashes.
- **FR-004**: The Dapr Scheduler service MUST use this state store to persist job
  definitions so that jobs survive cluster restarts.

**Scheduling (Dapr Jobs API)**

- **FR-005**: The system MUST schedule jobs via the Dapr Jobs API at
  `POST http://localhost:3500/v1.0-alpha1/jobs/{job-name}`.
- **FR-006**: Job payloads MUST include `dueTime` (UTC ISO 8601) and `data` containing
  `task_id` (int), `user_id` (str), and `type: "reminder"`.
- **FR-007**: Job names MUST be unique per user-task-time combination to prevent
  accidental overwrites (format: `reminder-{user_id}-{task_id}-{unix_ts}`).
- **FR-008**: The backend MUST expose `POST /api/jobs/schedule` to accept scheduling
  requests from the MCP layer and forward them to the Dapr Jobs API via the sidecar.

**Callback Handler**

- **FR-009**: The backend MUST expose `POST /api/jobs/trigger` as the Dapr job callback
  endpoint that Dapr calls when a scheduled job fires.
- **FR-010**: The `/api/jobs/trigger` endpoint MUST reject all requests not originating
  from `127.0.0.1` with HTTP 403 (no exceptions, no configuration flag to disable).
- **FR-011**: Upon receiving a valid callback, the endpoint MUST publish a reminder event
  to the `reminders` Kafka topic via the Dapr Pub/Sub API.
- **FR-012**: If the Kafka publish fails after retries (Constitution Principle XV), the
  endpoint MUST return HTTP 503 so Dapr retries the job callback.

**Natural Language Parsing**

- **FR-013**: The backend MUST parse the `reminder_time_natural_language` parameter into
  a UTC ISO 8601 timestamp before calling the Dapr Jobs API.
- **FR-014**: If the parsed time is in the past, the system MUST return an error to the
  MCP tool caller without scheduling the job.
- **FR-015**: Parsing MUST support at minimum: relative durations ("in X minutes/hours"),
  absolute times ("tomorrow at 9am", "at 3pm"), and compound expressions
  ("next Monday at 2pm").

**MCP Tool**

- **FR-016**: A new MCP tool `schedule_reminder` MUST be added to `app/mcp/server.py`
  with parameters: `user_id` (str), `task_id` (int),
  `reminder_time_natural_language` (str).
- **FR-017**: The `schedule_reminder` tool MUST call `POST /api/jobs/schedule` and
  return the confirmed job name and resolved UTC fire time to the agent.
- **FR-018**: The `schedule_reminder` tool MUST enforce user-data isolation: `user_id`
  scoping is MANDATORY (Constitution Principle X).

**Agent Behavior**

- **FR-019**: After a successful `schedule_reminder` call, the AI Agent MUST confirm:
  *"I've scheduled a reminder for **[task name]** at **[local time]** ([UTC time] UTC)."*
- **FR-020**: The agent MUST detect Roman Urdu input and respond in Roman Urdu for
  scheduling confirmations (Constitution Principles XI + XVII).
- **FR-021**: If `schedule_reminder` returns an error, the agent MUST surface a
  plain-language failure message and MUST NOT fabricate a confirmation.

### Key Entities

- **ScheduledJob**: Represents a Dapr Job. Attributes: `job_name` (unique string),
  `user_id`, `task_id`, `due_time_utc` (ISO 8601), `type` ("reminder").
  Not persisted in the app database — stored exclusively in the Dapr State Store.
- **ReminderEvent**: The Kafka message published to the `reminders` topic when a job
  fires. Attributes: `user_id`, `task_id`, `type` ("reminder"), `timestamp` (UTC).
  Shares the schema of existing reminder events consumed by the Notification Service.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can ask the AI to schedule a reminder using natural language and
  receive a confirmation message — including the exact scheduled time — within 3 seconds
  of sending the chat message.
- **SC-002**: After the specified duration, the Notification Service pod logs show the
  reminder firing automatically with zero manual intervention (verified via
  `kubectl logs`).
- **SC-003**: Scheduled jobs survive a full cluster restart (`minikube stop &&
  minikube start`) and still fire at the correct time after the cluster comes back
  online.
- **SC-004**: Requests to the job callback endpoint from non-localhost origins are
  rejected 100% of the time (zero false negatives in the security gate).
- **SC-005**: Natural language time expressions covering relative durations, absolute
  times, and compound expressions are parsed correctly to UTC without user correction.

---

## Assumptions

1. The Dapr Jobs API (`v1.0-alpha1`) is available in the cluster's installed Dapr
   version. If not, a Dapr upgrade is required before implementation.
2. The Neon direct connection string (non-pooler endpoint) is already stored in the
   `dapr-secrets` Kubernetes Secret from Phase 5.2 work.
3. The `reminders` Kafka topic already exists in Redpanda Cloud (manually created in
   Phase 5.3); `autoCreateTopics` is not available.
4. The Notification Service from Phase 5.3 is deployed with its Dapr subscription to
   the `reminders` topic active. No changes to the Notification Service are required.
5. The MCP server runs in the same process as the FastAPI backend, so `schedule_reminder`
   can call internal backend routes directly.
6. A Python natural language date parsing library (e.g., `dateparser`) will be added to
   the backend's `pyproject.toml` as a new dependency.

## Dependencies

- **Phase 5.3 (010-notification-service)**: `reminders` topic and Notification Service
  subscription must be active for the callback end-to-end flow.
- **Phase 5.2 (009-audit-statestore)**: Neon direct connection string already in cluster
  secrets; statestore component structure understood.
- **Phase 5.1 (008-dapr-kafka-infra)**: Dapr Pub/Sub component (`pubsub.yaml`) used by
  the callback handler to publish to `reminders`.
- **Constitution Principles XVI + XVII** (v2.3.0): Non-negotiable architectural gates.

## Out of Scope

- Persistent storage of scheduled jobs in the app PostgreSQL database.
- A UI for viewing, editing, or cancelling scheduled reminders.
- Recurring/cron-style job schedules — one-shot `dueTime` jobs only.
- Push notifications, email, or SMS — Notification Service log output is the
  acceptance-level delivery mechanism for Phase 5.5.
- Job cancellation or rescheduling via the AI Agent.
