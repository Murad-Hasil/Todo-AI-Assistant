# Feature Specification: Phase 5.3 — Event-Driven Notification Service

**Feature Branch**: `010-notification-service`
**Created**: 2026-03-09
**Status**: Draft
**Input**: Phase 5.3 — standalone notification microservice consuming Kafka reminder events via Dapr

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reminder Notification on Keyword Task Creation (Priority: P1)

A user creates a task with the phrase "remind me" in the title (e.g., "remind me to call doctor"). The system automatically generates a reminder notification logged by the notification service within 5 seconds of task creation.

**Why this priority**: This is the core end-to-end flow that proves the event-driven architecture works — producer (backend) → broker (Kafka) → consumer (notification service). Without this, the feature has no value.

**Independent Test**: Create a task containing "remind me" via the task API. Check the notification service logs for the reminder message — no other component needs to be changed to observe the result.

**Acceptance Scenarios**:

1. **Given** the notification service is running, **When** a task titled "remind me to call doctor" is created by user `alice`, **Then** the notification service logs `[REMINDER]: Hey User alice, your task "remind me to call doctor" is due now!` within 5 seconds.
2. **Given** a task is created WITHOUT "remind me" in the title, **When** the task is saved, **Then** no reminder event is published and the notification service logs nothing for that task.
3. **Given** the notification service is temporarily unavailable, **When** it recovers, **Then** it processes any queued reminder events without data loss.

---

### User Story 2 — Notification Service Operates Independently of Main Application (Priority: P2)

The notification service runs as its own isolated process — it can be started, stopped, and scaled independently without affecting the main task API or chatbot.

**Why this priority**: Microservice isolation is the architectural goal. If the notification service crashes, the main app must continue working. This story validates that the decoupling is real.

**Independent Test**: Stop the notification service → create "remind me" tasks → restart the notification service → verify it processes backlogged events. Main app must remain fully functional throughout.

**Acceptance Scenarios**:

1. **Given** the notification service is stopped, **When** "remind me" tasks are created via the main app, **Then** task creation returns success (no error) and the reminder events are held in the broker.
2. **Given** the notification service restarts after a period of downtime, **When** it reconnects to the broker, **Then** it processes all queued reminder events that arrived during downtime.
3. **Given** both services are running, **When** the notification service is restarted, **Then** the main task API experiences zero downtime.

---

### User Story 3 — Reminder Events Are Traceable via Logs (Priority: P3)

Operations teams can inspect the notification service logs to see a clear, structured record of every reminder processed — including which user, which task, and when it was received.

**Why this priority**: Observability is essential for a production system. This validates that the system is auditable and debuggable by inspecting logs.

**Independent Test**: Trigger 3 reminder events from 2 different users and verify all 3 appear in the notification service logs with correct user and task details.

**Acceptance Scenarios**:

1. **Given** 3 "remind me" tasks are created by 2 different users, **When** logs are inspected, **Then** exactly 3 reminder log entries appear, each with the correct user and task title.
2. **Given** a malformed event arrives (missing user_id or task_title), **When** the service processes it, **Then** the service logs a warning and continues processing without crashing.

---

### Edge Cases

- What happens when a task title contains "remind me" but the event payload is missing `task_title`? → Service logs a warning with available fields and skips the reminder message.
- What happens when the broker is unreachable at notification service startup? → Service retries connection with backoff; does not crash on startup.
- What happens when multiple "remind me" tasks are created in rapid succession? → Each generates a separate, independent reminder notification in arrival order.
- What happens when "remind me" appears mid-title (e.g., "please remind me later")? → Treated as a reminder trigger — keyword matching is case-insensitive substring.
- What happens if the backend cannot reach the broker to publish the reminder event? → The task is still saved successfully; the publish failure is logged silently (fire-and-forget).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST detect tasks created with "remind me" (case-insensitive) anywhere in the title and publish a reminder event to the `reminders` topic.
- **FR-002**: The backend MUST publish reminder events AFTER a successful database commit — a task that fails to save MUST NOT trigger a reminder.
- **FR-003**: The notification service MUST expose a receiving endpoint that accepts reminder events delivered by the broker.
- **FR-004**: Upon receiving a valid reminder event, the notification service MUST log: `[REMINDER]: Hey User {user_id}, your task "{task_title}" is due now!`
- **FR-005**: The notification service MUST handle malformed events (missing fields) without crashing — log a warning and continue.
- **FR-006**: The notification service MUST operate as an independent deployable unit — crash or restart of the notification service MUST NOT affect the main task API's availability.
- **FR-007**: Reminder events MUST be delivered at least once — the broker MUST queue events if the notification service is temporarily unavailable.
- **FR-008**: The notification service MUST be deployable in the same Kubernetes cluster as the main application, with its own isolated process and network identity.
- **FR-009**: Tasks created WITHOUT "remind me" in the title MUST NOT trigger any reminder event (no false positives).

### Key Entities

- **ReminderEvent**: Represents a reminder notification request. Key attributes: `task_id` (unique identifier), `task_title` (text for log message), `user_id` (who created the task), `timestamp` (when the task was created).
- **Subscription**: The declarative link between the `reminders` broker topic and the notification service's receiving endpoint. Configured once at deployment time; no runtime configuration needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A "remind me" task created in the main app produces a visible, correctly formatted log entry in the notification service within 5 seconds.
- **SC-002**: The main task API continues accepting requests with zero errors when the notification service is stopped and restarted.
- **SC-003**: 100% of "remind me" events queued while the notification service is offline are processed (no event loss) once the service recovers — verified by counting events produced vs. log entries.
- **SC-004**: Zero reminder log entries are produced for tasks that do NOT contain "remind me" in the title.
- **SC-005**: A malformed event (missing `task_title` or `user_id`) causes a warning log entry but does not crash or stop the notification service.

## Assumptions

- "remind me" (case-insensitive substring) is the only trigger keyword for Phase 5.3. Additional keywords are out of scope.
- Notifications are log-based only — no email, SMS, or push delivery in this phase.
- The `reminders` Kafka topic already exists in Redpanda Cloud (created in Phase 5.1).
- The notification service does not need user authentication — it only consumes internal broker events.
- `task_title` and `user_id` are included in the reminder event payload by the backend at publish time — the notification service does not query the database.
- "remind me" matching applies to the task title field only, not the description.

## Out of Scope

- Scheduled or time-based reminders (e.g., "remind me in 2 hours") — Phase 5.3 is trigger-on-create only.
- Email, SMS, push notification, or any external delivery channel.
- A user-facing UI for managing or viewing reminders.
- Deduplication of reminder events — at-least-once delivery is acceptable for this phase.
- Reminder cancellation if the task is deleted after creation.
