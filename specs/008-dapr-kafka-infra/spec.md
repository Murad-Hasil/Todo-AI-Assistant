# Feature Specification: Phase 5.1 — Event-Driven Infrastructure (Dapr & Kafka)

**Feature Branch**: `008-dapr-kafka-infra`
**Created**: 2026-03-08
**Status**: Draft
**Input**: User description: "Generate the specification for Phase 5.1: Event-Driven Infrastructure (Dapr & Kafka). MISSION: Prepare the Distributed Runtime layer for the Todo AI app."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Backend publishes task events without knowing the broker (Priority: P1)

When a developer triggers any task operation (create, update, complete, delete) in the backend, the system must reliably forward that event to a message channel — without the backend code knowing anything about Kafka or Redpanda Cloud directly. The backend simply calls a local messaging gateway on the same pod.

**Why this priority**: This is the foundation of the entire event-driven layer. All other Phase 5 features (audit log, reminders, real-time sync) depend on events reaching the broker. Without this, nothing downstream works.

**Independent Test**: Can be tested by triggering a task CRUD operation and confirming an event appears on the `task-events` channel via a consumer log — before any notification service exists.

**Acceptance Scenarios**:

1. **Given** the backend pod is running with its local messaging sidecar, **When** a task is created by an authenticated user, **Then** a `task-events` message containing `user_id`, `task_id`, `action: "created"`, and `timestamp` appears on the broker within 2 seconds.
2. **Given** the broker is temporarily unreachable, **When** the backend attempts to publish an event, **Then** the system retries at least 3 times with increasing wait intervals before returning an error — and the original API response is not blocked.
3. **Given** the messaging sidecar is not running, **When** the backend tries to publish, **Then** the failure is logged at ERROR level with topic name and payload — the app does not crash.

---

### User Story 2 — Operators verify the distributed runtime is healthy (Priority: P2)

A developer or operator deploying the stack can confirm that every application pod has its companion runtime sidecar attached and running, and that the sidecar is reachable from within the pod.

**Why this priority**: Without sidecar health verification, silent failures during event publishing are impossible to diagnose. This story gives operators a clear pass/fail signal.

**Independent Test**: After deploying the updated manifests, run a check that queries pod container counts and confirms the sidecar endpoint responds at the expected local address.

**Acceptance Scenarios**:

1. **Given** a deployment manifest includes the required sidecar annotations, **When** the pod starts, **Then** the pod shows 2/2 containers running (app + sidecar).
2. **Given** the pod is running, **When** a health-check request is made from within the app container to the local sidecar endpoint (`http://localhost:3500`), **Then** a healthy response is returned.
3. **Given** the Dapr control plane is not installed, **When** a deployment with sidecar annotations is applied, **Then** the sidecar injection is skipped gracefully and the app container still starts in degraded mode.

---

### User Story 3 — Conversation state survives pod restarts (Priority: P3)

A developer can write and read state values via the local sidecar without opening a direct database connection from application code — and the values persist across pod restarts.

**Why this priority**: Establishes the state store as a Dapr-managed layer. Full conversation persistence already exists in PostgreSQL (Phase 3); this story proves the Dapr state management path works independently.

**Independent Test**: Write a key-value pair via the sidecar API, restart the pod, and confirm the value is retrievable afterward.

**Acceptance Scenarios**:

1. **Given** the state store component is configured and deployed, **When** the backend writes a key-value pair via the local sidecar, **Then** the value is retrievable after a pod restart.
2. **Given** the state store is unreachable, **When** the backend attempts a state write, **Then** the error is logged and the application continues serving requests without crashing.

---

### Edge Cases

- What happens when the broker bootstrap server is misconfigured? → The sidecar fails to connect and logs a connection error; the app container still starts but publish calls return errors immediately.
- What happens if the same event is delivered twice to a consumer? → Consumers must be idempotent — processing the same event twice must not produce duplicate side effects (Constitution Principle XV).
- What happens if the Dapr control plane version is incompatible with a component version? → Deployment fails at sidecar injection with a clear version mismatch error visible in pod events.
- What happens when broker credentials are rotated? → Only the Kubernetes Secret and component manifest need updating; no application code changes are required.
- What happens if a publish call exceeds all retry attempts? → The error is surfaced as an HTTP 503 to the caller and recorded in the log with topic name, payload, and attempt count.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Pub/Sub messaging component that connects pods to a Kafka-compatible broker using SASL credentials stored in cluster secrets — never hardcoded in manifests or code.
- **FR-002**: The Pub/Sub component MUST define three named topics: `task-events` (CRUD audit trail), `reminders` (scheduled alerts), and `task-updates` (real-time sync).
- **FR-003**: The system MUST provide a state store component backed by the existing PostgreSQL database, accessible to pods via the local sidecar endpoint only.
- **FR-004**: Every application pod (backend and frontend) MUST carry a sidecar container that proxies all messaging and state-management calls — pods MUST NOT connect to the broker or state store directly.
- **FR-005**: The backend deployment MUST be annotated with: sidecar enabled, app identifier `todo-backend`, app port `8000`.
- **FR-006**: The frontend deployment MUST be annotated with: sidecar enabled, app identifier `todo-frontend`, app port `3000`.
- **FR-007**: All Dapr component manifests (Pub/Sub, state store, subscriptions) MUST reside under `todo-web-app/k8s/dapr/` and MUST be applied to the cluster before Phase 5 workloads are deployed.
- **FR-008**: The backend MUST be able to reach its sidecar at `http://localhost:3500` without any network configuration beyond the pod definition.
- **FR-009**: Event publishers MUST implement retry logic: minimum 3 attempts, exponential backoff starting at 200 ms, maximum backoff 5 s (Constitution Principle XV).
- **FR-010**: All events published to any topic MUST include `user_id` as a top-level field to enable consumer-side isolation (Constitution Principle V).
- **FR-011**: Broker credentials (bootstrap server, SASL username, SASL password) and the database connection string MUST be referenced from Kubernetes Secrets in component manifests — zero plaintext credentials in any committed file.
- **FR-012**: The Dapr control plane MUST be installed in the local cluster before annotated workloads are deployed; the installation command MUST be documented in the quickstart.

### Key Entities

- **Pub/Sub Component** (`todoai-pubsub`): Named messaging bridge of type `pubsub.kafka`. Configured with broker endpoint and SASL credentials. Exposes the three required topics to all annotated pods.
- **State Store Component** (`todoai-statestore`): Named persistent store of type `state.postgresql`. Uses the existing Neon PostgreSQL connection. Creates its own state table independently of Alembic-managed tables.
- **Topic**: A named message channel (`task-events`, `reminders`, `task-updates`). Publishers write to it; consumers subscribe via Subscription manifests.
- **Sidecar**: Runtime proxy container co-located in every pod. Exposes port `3500` locally. Mediates all Dapr API calls — publish, subscribe, state read/write, service invocation.
- **Subscription**: Kubernetes resource declaring which app-id receives which topic's messages at which callback route.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After applying updated manifests, both backend and frontend pods report 2/2 containers running within 60 seconds of pod start.
- **SC-002**: A task CRUD action produces a verifiable event on the `task-events` topic within 2 seconds — confirmed by a broker consumer log.
- **SC-003**: A state value written via the sidecar is readable after the writing pod is restarted — with no direct database connection from application code.
- **SC-004**: A publish failure (broker unreachable) triggers at least 3 retry attempts visible in the application log before the error is surfaced.
- **SC-005**: Zero broker credentials or database connection strings appear in any file tracked by the git repository.
- **SC-006**: Removing sidecar annotations from both deployments leaves Phase 2–4 functionality (CRUD, auth, chatbot) fully intact — no regressions.

---

## Scope

### In Scope

- Dapr control plane installation instructions for Minikube (local cluster)
- Dapr Pub/Sub component manifest (`pubsub.yaml`) — Kafka/Redpanda Cloud via SASL
- Dapr State Store component manifest (`statestore.yaml`) — Neon PostgreSQL
- Dapr Subscription manifests for `task-events`, `reminders`, `task-updates`
- Kubernetes Deployment annotation updates for backend and frontend pods
- Secret management: Kubernetes Secret entries for broker credentials
- Directory: `todo-web-app/k8s/dapr/` (all component and subscription manifests)
- Quickstart: step-by-step commands to install Dapr and apply components

### Out of Scope

- Notification Service implementation (Phase 5.2)
- `schedule_reminder` MCP tool in the AI Agent (Phase 5.3)
- Real-time frontend WebSocket integration (Phase 5.4)
- Event publisher code changes inside the FastAPI backend (Phase 5.2+)
- Redpanda Cloud account creation or Kafka topic provisioning (operator prerequisite)
- Dapr mTLS or production-grade security hardening (local dev only in Phase 5.1)

### Dependencies

- Minikube cluster running and accessible via `kubectl`
- Dapr CLI installed locally (`dapr` command available)
- Redpanda Cloud account with: bootstrap server URL, SASL username, SASL password (provided by operator at deploy time)
- Existing Neon PostgreSQL `DATABASE_URL` already present in cluster secrets (from Phase 4)
- Helm chart `todo-web-app/k8s/charts/todoai/` from Phase 4 (patched with sidecar annotations)

### Assumptions

- Dapr version: 1.13+ (supports `pubsub.kafka` component v1 and `state.postgresql`)
- Redpanda Cloud uses SASL/SCRAM-SHA-256 (standard Kafka SASL mechanism)
- The `state.postgresql` component auto-creates its state table (`dapr_state`) — no Alembic migration required
- Frontend pod receives sidecar annotation now for forward-compatibility (Phase 5.4 real-time sync); it does not publish events in Phase 5.1
- `imagePullPolicy: Never` continues to apply (local Minikube images, no registry push)
- Dapr is installed in the `default` namespace alongside existing workloads
