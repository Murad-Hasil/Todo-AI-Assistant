# Feature Specification: Phase 5.2 — Audit Logs & Statestore Fix

**Feature Branch**: `009-audit-statestore`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "Phase 5.2: Audit Logs and Statestore Fix — publish task-events to Redpanda Cloud on CRUD operations via Dapr pubsub; fix Dapr statestore using direct Neon connection."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Task Actions Are Recorded as Audit Events (Priority: P1) 🎯 MVP

A developer or operator wants confidence that every task creation, update, or deletion made through the system leaves a traceable record in the event stream. When a user creates a task through the web app or chatbot, an audit event must automatically appear in the `task-events` topic without any manual action.

**Why this priority**: This is the core event-driven feature. Without audit events, there is no observability into task lifecycle changes. It is foundational for downstream consumers (notifications, analytics, compliance).

**Independent Test**: Create a task via the API → inspect the `task-events` topic in Redpanda Cloud → confirm event appears with correct `action`, `task_id`, `user_id`, and `timestamp`. Delivers immediate audit trail value.

**Acceptance Scenarios**:

1. **Given** a user creates a task via the web app, **When** the task is saved successfully, **Then** an event with `action: "created"` appears in the `task-events` topic within 5 seconds.
2. **Given** a user updates a task (title or completion status) via the API or chatbot, **When** the update is saved, **Then** an event with `action: "updated"` appears in `task-events` within 5 seconds.
3. **Given** a user deletes a task, **When** the deletion completes, **Then** an event with `action: "deleted"` appears in `task-events` with the correct `task_id` and `user_id`.
4. **Given** the event broker is temporarily unreachable, **When** a task action occurs, **Then** the task operation still succeeds (fire-and-forget — broker failure must not break task CRUD).
5. **Given** an event is published, **When** inspected in the topic, **Then** the payload contains `action`, `task_id`, `user_id`, and `timestamp` fields with correct values.

---

### User Story 2 — Distributed State Store Is Healthy and Operational (Priority: P2)

An operator opens the Dapr dashboard and sees that the state store component is green/healthy — not erroring. This confirms the infrastructure layer is fully operational and ready for future stateful use cases (e.g., conversation state, session caching).

**Why this priority**: The statestore was blocked in Phase 5.1 due to a database connection incompatibility. Resolving this unblocks US3 (state persistence) and closes the Phase 5.1 infrastructure gap.

**Independent Test**: `dapr dashboard -k` → Components tab shows `todoai-statestore` green. Backend pod reaches `2/2 Running` with zero statestore-related restarts.

**Acceptance Scenarios**:

1. **Given** the system is deployed, **When** an operator views the Dapr dashboard, **Then** `todoai-statestore` shows as healthy (green) with no errors.
2. **Given** the backend pod starts, **When** it connects to the state store, **Then** the pod reaches `2/2 Running` without restarts caused by the state store component.
3. **Given** the state store is healthy, **When** a key-value pair is written, **Then** it can be read back immediately from the same store.

---

### User Story 3 — Audit State Survives Infrastructure Restarts (Priority: P3)

An operator restarts the backend pod (e.g., during a deployment). After the restart, the state store still holds previously written values. This validates that state is persisted durably in the database, not just in-memory.

**Why this priority**: Lowest priority — depends on US2 (statestore healthy). Validates the durability guarantee of the state store.

**Independent Test**: Write a test value to statestore → restart backend pod → read back the value → confirm it matches the original.

**Acceptance Scenarios**:

1. **Given** a value is written to the state store, **When** the backend pod is restarted, **Then** the value is still readable after the pod becomes ready again.
2. **Given** multiple key-value pairs exist in the store, **When** a pod restart occurs, **Then** all previously written values remain intact.

---

### Edge Cases

- What happens if the event broker is down when a task is created? → Task operation must succeed; event publish failure must be silent (logged, not surfaced to the user).
- What happens if `user_id` or `task_id` is missing from the event payload? → Event must not be published with incomplete data; log a warning instead.
- What happens if the state store connection times out on startup? → Pod must not crash; statestore failure must not block task CRUD operations.
- What happens if the database used for state is the same as the application database? → Dapr state tables (`dapr_state`, `dapr_metadata`) must not conflict with existing application tables.
- What happens if a task action occurs during a Dapr sidecar restart? → The task operation proceeds normally; the event may be lost (acceptable for audit-only, non-critical use case).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST publish an audit event to the `task-events` topic whenever a task is created via any interface (web app, chatbot, or direct API).
- **FR-002**: System MUST publish an audit event to `task-events` whenever a task is updated (any field change, including completion status).
- **FR-003**: System MUST publish an audit event to `task-events` whenever a task is deleted.
- **FR-004**: Each audit event MUST include the fields: `action` (one of: created / updated / deleted), `task_id` (integer), `user_id` (string), and `timestamp` (ISO 8601).
- **FR-005**: Audit event publishing MUST be fire-and-forget — a failure to publish MUST NOT prevent the task operation from completing or returning a success response to the user.
- **FR-006**: The existing task CRUD logic (database reads and writes) MUST remain unchanged — audit publishing is additive only and must not alter existing task data or API contracts.
- **FR-007**: The distributed state store MUST initialize successfully on backend pod startup without causing pod restarts.
- **FR-008**: The state store MUST use a database connection that supports schema management (table creation) — distinct from the pooled connection used by the application for task CRUD.
- **FR-009**: The state store MUST persist written values durably so that values survive backend pod restarts.
- **FR-010**: No credentials, connection strings, or secrets MUST appear in committed source files — all sensitive values must be managed via environment secrets.

### Key Entities

- **Audit Event**: A structured record of a task lifecycle action. Contains: `action` (string enum: created/updated/deleted), `task_id` (integer), `user_id` (string), `timestamp` (ISO 8601 datetime). Published once per task operation; immutable; not stored in the application database.
- **Task**: Existing entity — no schema changes. Source of truth remains the application database (Neon PostgreSQL). Audit events are derived from task operations, not the other way around.
- **State Entry**: A key-value pair persisted in the distributed state store. Used for infrastructure health validation in this phase; reserved for application use in future phases.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every task creation, update, and deletion results in a corresponding event appearing in the `task-events` topic within 5 seconds — verified by inspecting the topic in the Redpanda Cloud console.
- **SC-002**: The distributed state store component shows as healthy in the operator dashboard with zero pod restarts attributable to state store errors — verified by `dapr dashboard -k`.
- **SC-003**: A test value written to the state store before a backend pod restart is readable with the same value after the pod restarts — confirming durable persistence.
- **SC-004**: Task CRUD operations complete successfully (HTTP 2xx) even when the event broker is unreachable — verified by temporarily disabling broker connectivity and confirming tasks are still saved.
- **SC-005**: All existing task API endpoints return identical responses before and after this feature — no regressions in task functionality.

---

## Assumptions

- The event broker (Redpanda Cloud) and its credentials are already provisioned and accessible from the cluster (completed in Phase 5.1).
- The Dapr pubsub component (`todoai-pubsub`) is already deployed and healthy in the cluster (T014 HTTP 204 confirmed in Phase 5.1).
- The application database (Neon PostgreSQL) has a direct (non-pooled) connection endpoint available that supports schema management (DDL), separate from the pooled endpoint used by the application.
- The `dapr_state` and `dapr_metadata` tables were pre-created manually in Phase 5.1 as a workaround; this phase resolves the root cause.
- Both backend and frontend pods have Dapr sidecar injection enabled (confirmed 2/2 Running in Phase 5.1).
- Audit events in this phase are append-only and are not consumed by any downstream service (no subscriber handler code required).
- Task IDs are integers and user IDs are strings (UUIDs or similar) — consistent with existing application schema.

---

## Out of Scope

- Consuming or processing audit events (subscriber/handler code) — deferred to Phase 5.3+.
- Displaying audit history in the UI.
- Audit event retention policy or archiving.
- Modifying the chatbot's conversation history or MCP tool responses.
- Adding new task fields or changing the task data model.
- Rate-limiting or deduplicating audit events.

---

## Dependencies

- **Phase 5.1 infrastructure**: Dapr control plane running, `todoai-pubsub` component healthy, sidecar injected in backend pod — all confirmed complete.
- **Neon PostgreSQL**: A direct (non-pooled) connection endpoint must be reachable from the Minikube cluster for Dapr DDL operations. Root cause from Phase 5.1: pgBouncer transaction mode blocks DDL.
- **Redpanda Cloud**: `task-events` topic must exist with correct ACLs (confirmed Phase 5.1).
- **Backend source**: Task CRUD routes must be identifiable and minimally modified to add fire-and-forget publish calls after successful database writes.
