<!--
SYNC IMPACT REPORT
==================
Version change: 2.1.0 → 2.2.0
Bump type: MINOR — four new principles added (XII, XIII, XIV, XV); Phase 5 tech
  stack (Kafka, Dapr, Notification Service) and directory layout expanded;
  Phase 5 Core Features section added. No existing principle was removed or
  fundamentally redefined; all Phase 2–4 gates stand.
Modified principles: None (all I–XI retained verbatim)
Added sections:
  - XII. Event-Driven Architecture (NEW — Phase 5 Kafka/Dapr coupling constraint)
  - XIII. Dapr Sidecar Pattern (NEW — every pod must carry a Dapr sidecar)
  - XIV. Infrastructure Abstraction (NEW — code talks Dapr APIs, not raw Kafka/PG)
  - XV. Event Publishing Reliability (NEW — retry contract for event publishing)
  - Phase 5 Core Features (NEW)
  - Phase 5 directory additions:
      todo-web-app/k8s/dapr/              (Dapr component manifests)
      todo-web-app/services/notification/ (Notification microservice)
Removed sections: None
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates are generic;
     new principles XII–XV are self-documenting; no template edits required.
  ✅ .specify/templates/spec-template.md — Generic; no changes required.
  ✅ .specify/templates/tasks-template.md — Generic; no changes required.
  ✅ .specify/templates/phr-template.prompt.md — No changes required.
Deferred items: None
-->

# Todo Web App — Phase 2, 3, 4 & 5 Constitution

## Core Principles

### I. Strict Spec-Driven Development (NON-NEGOTIABLE)

No code MUST be written without a corresponding artifact under `@specs/features/`,
`@specs/api/`, `@specs/database/`, or `@specs/chatbot/`. Every implementation
task MUST reference its originating Task ID in commit messages and inline comments.
Agents MUST halt and surface a warning if asked to produce code without a traceable
spec artifact. This principle is the hardest gate in the project and is never waived.

### II. Read-Before-Write

Agents MUST read the current state of any file — in both the `frontend/` and
`backend/` directories — before proposing changes. Proposing edits based on
assumptions, memory, or a single-directory view is forbidden. This applies to
source code, spec files, task lists, API contracts, and configuration. Agents
MUST check both sides of the monorepo boundary before modifying shared concerns
(e.g., API schemas, auth utilities, environment variables).

### III. Non-Destructive Integration

Phase 2 CRUD operations and authentication/authorization logic MUST remain fully
intact when Phase 3 AI Chatbot features are added. All Phase 3 code MUST live
exclusively inside `/todo-web-app/backend/app/agent/`, `/todo-web-app/backend/app/mcp/`,
and `/todo-web-app/frontend/app/chat/`. Agents MUST reject any refactor that
would require Phase 2 contracts, route handlers, or SQLModel models to be broken
or duplicated. The Phase 2 CRUD service layer MUST remain independently callable
by the Phase 3 AI layer as MCP tools — never replaced. Phase 5 event-driven
features MUST be additive — they MUST NOT modify Phase 2–4 route handlers,
data models, or agent orchestration code without an explicit amendment.

### IV. API-First Architecture

All backend functionality MUST be exposed exclusively via RESTful endpoints under
the `/api/` prefix. No business logic MUST be embedded in framework middleware,
startup hooks, or background tasks without a corresponding `/api/` endpoint
contract. All request and response bodies MUST be validated through Pydantic models
— no raw dicts passed across layer boundaries. HTTP status codes MUST follow REST
semantics (200/201 for success, 400 for client errors, 401/403 for auth failures,
404 for not-found, 500 for unexpected server errors).

### V. Multi-User Data Isolation

Every data-access operation MUST scope its query to the authenticated `user_id`
extracted from the verified JWT. Cross-user data leakage is a critical security
violation; no task, user record, conversation, message, or derived resource MUST
be returned or mutated without a matching `user_id` predicate. Agents MUST refuse
to implement any endpoint or MCP tool that does not enforce user-scoped filtering.
SQLModel queries MUST always include a `WHERE user_id = :current_user_id` clause
or equivalent ORM filter for user-owned resources. Event payloads published to
Kafka topics MUST embed `user_id` as a top-level field so that consumers can
enforce isolation without additional database lookups.

### VI. JWT Security Contract

The backend MUST extract and verify JWTs issued by Better Auth exclusively via
the `Authorization: Bearer <token>` request header. Tokens passed as query
parameters, cookies, or request bodies MUST be rejected. The verification step
MUST occur in a dedicated FastAPI dependency (not inline in route handlers) that
raises HTTP 401 on any verification failure. The backend MUST NOT issue, refresh,
or revoke tokens — those operations belong exclusively to Better Auth on the
frontend. No endpoint or chat request that operates on user-owned data MUST be
reachable without passing JWT verification. The Phase 3 `/api/chat` endpoint
MUST reuse this same FastAPI dependency without modification.

### VII. Monorepo Pattern

The project MUST maintain a single root `CLAUDE.md` at `/todo-web-app/` providing
full project context, plus dedicated `CLAUDE.md` files in `/todo-web-app/frontend/`
and `/todo-web-app/backend/` for surface-specific guidance. Shared specifications
MUST reside under `/todo-web-app/specs/` organised by domain: `features/`, `api/`,
`database/`, `ui/`, and `chatbot/`. Agents MUST NOT create top-level directories
outside the approved monorepo layout without an amendment to this constitution.

### VIII. Code Quality Standards

All Python code MUST conform to PEP8 with Black-compatible line length (≤ 88
characters), snake_case naming, and type hints on every public function signature.
All TypeScript code MUST use strict mode (`"strict": true` in tsconfig), prefer
explicit type annotations over `any`, and follow the Next.js App Router convention
of Server Components by default — Client Components MUST be used only where
interactivity requires it. Agents MUST verify implementation against the project
PDF spec pages before marking any task complete.

### IX. Stateless AI Request Cycle

The FastAPI backend MUST NOT hold any conversational state in memory between
requests. Every AI chat request MUST fetch the full conversation history for the
authenticated user from Neon PostgreSQL before invoking the AI agent, and MUST
persist the new user message and assistant response to the database before
returning. In-process caches, module-level session objects, and singleton
conversation buffers are strictly forbidden in `backend/app/agent/`. This
constraint ensures horizontal scalability and crash resilience at zero additional
infrastructure cost.

### X. MCP Tool Enforcement

The AI Agent MUST ONLY interact with the Todo list through the official MCP
server tools exposed under `backend/app/mcp/`. Direct database access, direct
SQLModel queries, and direct calls to Phase 2 CRUD services from within agent
orchestration code are forbidden. The canonical MCP tool set is:
`add_task`, `list_tasks`, `complete_task`, `update_task`, `delete_task`.
Each MCP tool MUST accept the authenticated `user_id` as a scoping parameter
and MUST enforce user-data isolation independently — the agent orchestrator
MUST NOT be trusted to enforce this boundary alone.

### XI. Agent Behavior Contract

The AI Agent MUST respond with a friendly, human-readable confirmation after
every successful tool invocation (e.g., "Got it! I've added 'Buy milk' to your
tasks."). The agent MUST gracefully handle all logic errors — including "task not
found", duplicate task detection, and Groq API failures — by returning a helpful
plain-language error message rather than an unhandled exception or raw stack
trace. The agent MUST support Roman Urdu language requests as a bonus capability:
when a user writes in Roman Urdu, the agent MUST respond in Roman Urdu. The
agent MUST NOT reveal internal MCP tool calls, raw JSON payloads, or implementation
details to the end user.

### XII. Event-Driven Architecture (PHASE 5 — NON-NEGOTIABLE)

Services MUST NOT call each other directly via HTTP for any Phase 5 event flow.
All inter-service communication for reminders, recurring task spawning, audit
logging, and real-time sync MUST flow exclusively through Kafka topics (via Dapr
Pub/Sub). Direct service-to-service HTTP calls are permitted ONLY via Dapr Service
Invocation — never via raw `httpx`/`requests` client calls targeting pod IPs or
Kubernetes service DNS names directly. Any new consumer service MUST subscribe to
the appropriate Kafka topic through a Dapr subscription manifest; ad-hoc polling
or direct broker connections in application code are forbidden. This ensures loose
coupling, independent deployability, and resilience across all Phase 5 services.

### XIII. Dapr Sidecar Pattern

Every pod deployed in Phase 5 — including the FastAPI backend, Next.js frontend,
and the Notification Service — MUST carry a Dapr sidecar container. Kubernetes
Deployment manifests MUST include the Dapr annotations:
`dapr.io/enabled: "true"`, `dapr.io/app-id: "<service-id>"`, and
`dapr.io/app-port: "<port>"`. No Phase 5 service MUST publish or subscribe to
events, access state stores, or invoke bindings without routing through its Dapr
sidecar — bypassing the sidecar (e.g., calling the Kafka broker directly) is a
principle violation. Dapr component YAML manifests MUST reside exclusively under
`/todo-web-app/k8s/dapr/` and MUST be applied to the cluster before any Phase 5
workload is deployed.

### XIV. Infrastructure Abstraction

Application code MUST interact with Kafka, PostgreSQL state stores, and any
external binding exclusively through the Dapr API surface — either the Dapr Python
SDK (`dapr-client`) or the Dapr HTTP API (`http://localhost:3500/v1.0/...`).
Direct Kafka client libraries (e.g., `confluent-kafka`, `kafka-python`) MUST NOT
be imported in application code. Direct PostgreSQL connections for Dapr state
management MUST NOT be opened in application code — use the Dapr state management
API instead. This abstraction ensures that the underlying broker or store can be
swapped (e.g., Redpanda → Strimzi, PostgreSQL → Redis) without modifying
application code — only Dapr component manifests change.

### XV. Event Publishing Reliability

Every event publisher MUST implement retry logic with exponential backoff for
Dapr `publishEvent` calls. The minimum retry policy is: 3 attempts, initial
backoff 200 ms, multiplier 2, max backoff 5 s. Failed publish attempts MUST be
logged at `ERROR` level with the topic name, event payload, and attempt count.
Agents MUST surface retry-exhausted failures as HTTP 503 to the caller rather
than silently dropping events. The AI Agent MUST be capable of triggering
"Reminder" events via an MCP tool (`schedule_reminder`) that publishes to the
`reminders` Kafka topic through the Dapr sidecar — this tool MUST follow the same
retry contract. Event consumers MUST be idempotent: processing the same event
twice MUST NOT produce duplicate side effects (e.g., duplicate tasks, duplicate
audit log entries).

## Technical Stack & Environment

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Chat UI**: OpenAI ChatKit integrated into the Next.js frontend (`app/chat/`)
- **Backend**: Python FastAPI v0.115+, Python 3.13 (stateless request cycle)
- **AI SDK**: OpenAI Agents SDK (configured for Groq OpenAI-compatible endpoint)
- **Model Provider**: Groq — `llama-3.3-70b-versatile`
  - Base URL: `https://api.groq.com/openai/v1`
- **MCP Server**: Official MCP SDK (Python) — exposes CRUD ops as agent tools
- **Database**: Neon Serverless PostgreSQL
  - Phase 2 tables: users, tasks (unchanged)
  - Phase 3 tables: conversations, messages
- **ORM**: SQLModel (wraps SQLAlchemy + Pydantic)
- **Authentication**: Better Auth (frontend session management) +
  JWT Token Verification (backend enforcement — shared by Phase 2 and Phase 3)
- **Messaging (Phase 5)**: Kafka via Redpanda Cloud or Strimzi Operator
  - Topics: `task-events` (audit/CRUD events), `reminders` (scheduled alerts)
- **Distributed Runtime (Phase 5)**: Dapr (Pub/Sub, State Management, Bindings)
  - Dapr Python SDK: `dapr-client`
  - Dapr HTTP API: `http://localhost:3500/v1.0/...` (sidecar endpoint)
- **Notification Service (Phase 5)**: New Python 3.13 FastAPI microservice
  - Location: `/todo-web-app/services/notification/`
  - Subscribes to `reminders` and `task-events` topics via Dapr
- **Deployment**: Vercel (frontend production), Minikube (local K8s — all services)
  - Phase 5 local: Minikube with Dapr control plane + Strimzi/Redpanda operator
- **Environment**: WSL 2 (Ubuntu 22.04) for local development
- **Package Managers**: `uv` (Python), `npm` / `pnpm` (Node)
- **Secrets**: No hardcoded tokens or credentials; use `.env` files and
  document all variables in `README.md`. Required Phase 5 vars:
  `KAFKA_BOOTSTRAP_SERVERS` (if Redpanda Cloud), `DAPR_HTTP_PORT` (default 3500),
  `DAPR_GRPC_PORT` (default 50001), `NOTIFICATION_SERVICE_APP_ID`.

## Core Features & Directory Layout

### Phase 2 Core Features

1. User Authentication — Sign-up, sign-in, sign-out via Better Auth
2. JWT-Protected API — All CRUD endpoints require valid Bearer token
3. Create Task — Authenticated user creates a task scoped to their `user_id`
4. Read Tasks — Authenticated user retrieves only their own tasks
5. Update Task — Modify title, description, or completion status by ID
6. Delete Task — Hard-delete by ID, scoped to the authenticated user
7. Mark as Complete — Toggle completion status by ID

### Phase 3 Core Features

1. Conversational Chat — Users manage tasks via natural language through ChatKit UI
2. Conversation Persistence — Every conversation and message stored in Neon PostgreSQL
3. Stateless AI Cycle — History fetched from DB per request; no in-memory state
4. MCP Tool Bridge — AI Agent exclusively uses MCP tools to read/write tasks
5. JWT-Gated Chat API — `/api/chat` endpoint protected by Phase 2 JWT dependency
6. Roman Urdu Support — Agent detects and responds in Roman Urdu (bonus)
7. Graceful Error Handling — User-friendly messages for all agent and tool errors

### Phase 5 Core Features (Event-Driven)

1. Activity/Audit Log — Every CRUD operation publishes an event to the `task-events`
   Kafka topic via Dapr Pub/Sub; events include `user_id`, `task_id`, `action`,
   and `timestamp`
2. Reminder/Notification System — Users (or the AI Agent) schedule reminders by
   publishing to the `reminders` Kafka topic; the Notification Service consumes
   these events and emits alerts (log-based in Phase 5, extensible to email/push)
3. Recurring Task Engine — The Notification Service consumes reminder events and
   uses Dapr Service Invocation to trigger new task creation in the backend when
   a recurring pattern is detected
4. Real-time Sync — Dapr Pub/Sub broadcasts task-change events to subscribed
   frontend clients; WebSocket upgrade on the frontend may be used for delivery
5. AI-Triggered Reminders — The AI Agent exposes a new MCP tool `schedule_reminder`
   that publishes to the `reminders` topic through the Dapr sidecar with retry logic

### Directory Layout

```
/todo-web-app/
├── CLAUDE.md                    # Root agent context
├── specs/
│   ├── features/                # Feature-level specs
│   ├── api/                     # API contract specs (endpoint definitions)
│   ├── database/                # Schema and migration specs
│   ├── ui/                      # UI component and flow specs
│   └── chatbot/                 # Phase 3 chatbot specs
├── frontend/
│   ├── CLAUDE.md                # Frontend-specific agent context
│   ├── src/
│   │   ├── app/
│   │   │   ├── ...              # Existing Next.js App Router pages
│   │   │   └── chat/            # ChatKit-based conversational UI (Phase 3)
│   │   ├── components/          # Shared UI components
│   │   └── lib/                 # Client utilities and API helpers
│   └── tests/
├── backend/
│   ├── CLAUDE.md                # Backend-specific agent context
│   ├── app/
│   │   ├── models.py            # SQLModel ORM models (tasks, conversations, messages)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── db.py                # Database session and connection
│   │   ├── auth.py              # JWT dependency (shared by Phase 2 + Phase 3)
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routes/              # FastAPI route handlers (Phase 2 CRUD)
│   │   ├── agent/               # AI agent orchestration (Phase 3, OpenAI Agents SDK)
│   │   └── mcp/                 # MCP server + tool definitions (Phase 3 + Phase 5)
│   ├── migrations/              # Alembic migration scripts
│   └── tests/
├── services/
│   └── notification/            # Phase 5 — Notification microservice (Python 3.13)
│       ├── main.py              # FastAPI entry point; Dapr subscriber
│       ├── handlers.py          # Event handler logic (reminder, audit, recurring)
│       ├── Dockerfile
│       └── pyproject.toml
└── k8s/
    ├── charts/
    │   └── todoai/              # Helm chart (backend + frontend)
    └── dapr/                    # Phase 5 — Dapr component manifests
        ├── pubsub.yaml          # Kafka Pub/Sub component (Dapr)
        ├── statestore.yaml      # State store component (if used)
        └── subscriptions/       # Dapr Subscription resources per service
```

Agents MUST NOT create top-level directories outside this layout without an
approved amendment to this constitution.

## Governance

1. **Constitution Supersedes All**: This document overrides informal
   conventions, chat instructions, and undocumented practices.
2. **Amendment Procedure**: Any change to a principle or section MUST be
   proposed as a pull request, documented with rationale, and ratified by
   the project owner. The `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION`
   MUST be updated on every accepted change.
3. **Versioning Policy**: Semantic versioning applies —
   MAJOR for principle removal/redefinition,
   MINOR for new principle or section,
   PATCH for clarifications and wording fixes.
4. **Compliance Review**: Every PR MUST include a one-line Constitution
   Check confirming no principle is violated. If a violation is necessary,
   it MUST be logged in the Complexity Tracking table of the relevant
   `plan.md`.
5. **PHR Requirement**: A Prompt History Record MUST be created for every
   substantive agent interaction (implementation, planning, debugging,
   spec authoring).

**Version**: 2.2.0 | **Ratified**: 2026-03-03 | **Last Amended**: 2026-03-08
