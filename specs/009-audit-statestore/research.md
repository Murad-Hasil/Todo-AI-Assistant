# Research: Phase 5.2 — Audit Logs & Statestore Fix

**Branch**: `009-audit-statestore` | **Date**: 2026-03-09
**Input**: spec.md + live cluster inspection + backend source read

---

## R-001: Statestore Fix — Direct vs Pooled Neon Connection

**Decision**: Use `DIRECT_DATABASE_URL` (non-pooler Neon endpoint) for `statestore.yaml`. Rename existing `STATESTORE_URL` key to `DIRECT_DATABASE_URL` for clarity.

**Rationale**: Neon's pooler uses pgBouncer in transaction mode. Dapr `state.postgresql` attempts DDL (`CREATE TABLE dapr_state`, `CREATE TABLE dapr_metadata`) during init. pgBouncer transaction mode blocks DDL — confirmed in Phase 5.1 (timeout after ~2s). The direct endpoint (`ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech`, no `-pooler`) supports session mode and allows DDL.

**Phase 5.1 findings**:
- Pooler URL → DDL timeout (pgBouncer transaction mode blocks CREATE TABLE)
- Direct URL → Initial test timed out, BUT this was the same 2s timeout — likely a Neon cold-start issue on the direct endpoint (serverless wake-up)
- Pre-created tables manually as workaround; `disableEntityManagement: "true"` flag was ineffective in Dapr v1.17

**Resolution path**:
1. Add `DIRECT_DATABASE_URL` to `dapr-secrets` (non-pooler, no `channel_binding`)
2. Update `statestore.yaml` to use `DIRECT_DATABASE_URL`
3. Remove `disableEntityManagement` (let Dapr manage tables natively)
4. If direct endpoint still times out from Minikube: apply `disableEntityManagement: "true"` + keep pre-created tables as permanent workaround (acceptable since tables already exist in Neon)

**Neon direct endpoint**: `ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech` (port 5432, no pgBouncer, session mode)

**Alternatives considered**:
- Redis (Dapr `state.redis`) — would require new infrastructure, overkill for this phase
- In-cluster PostgreSQL — conflicts with Neon-first architecture
- `disableEntityManagement: "true"` permanently — tables must be managed manually; brittle

---

## R-002: Event Publishing Architecture — Fire-and-Forget vs Sync

**Decision**: FastAPI `BackgroundTasks` for route-layer publishing; direct call (try/except) for MCP tool layer. `events.py` utility handles retry logic internally.

**Rationale**:
- FR-005 requires non-blocking (fire-and-forget) — task CRUD must complete before publish
- Constitution XV requires retry with exponential backoff (3 attempts, 200ms→5s)
- `BackgroundTasks` runs after response is sent → satisfies both constraints for route layer
- MCP tools are synchronous and have no `BackgroundTasks` context → use direct call wrapped in try/except (swallow error, log at ERROR level)

**Complexity note**: Constitution XV requires "surface retry-exhausted failures as HTTP 503". This conflicts with FR-005 (fire-and-forget). Resolution: background retries are silent to the HTTP caller but logged at ERROR level. Documented in Complexity Tracking.

**Alternatives considered**:
- `asyncio.create_task` — requires async route handlers; task_ops is sync; adds complexity
- Celery/Redis queue — overkill for simple audit publishing; no broker already deployed for this use
- Dapr Python SDK (`dapr-client`) — valid alternative to HTTP API; adds dependency; HTTP API is simpler for fire-and-forget pattern

---

## R-003: HTTP Client for Dapr Sidecar Calls

**Decision**: `httpx` (sync) for `events.py`. No new top-level dependency needed if already present; add to `pyproject.toml` if absent.

**Rationale**:
- Constitution XIV explicitly permits `http://localhost:3500/v1.0/...` calls
- Constitution XII forbids raw HTTP to pod IPs or k8s DNS — `localhost:3500` is the sidecar, not a service DNS name → compliant
- `httpx` is preferred over `requests` (modern, type-annotated, supports both sync/async)
- `requests` is also acceptable (already in many FastAPI stacks)

**Confirmed**: `httpx` is already in the backend dependencies (used by `openai-agents` SDK). No new dependency needed.

---

## R-004: Event Payload — task_id type

**Decision**: Serialize `task_id` as a string (UUID string representation) in the JSON payload.

**Rationale**: The codebase uses `uuid.UUID` for `task_id` (not integer as spec stated). JSON serialization of UUID requires `str(task_id)`. Downstream consumers (Phase 5.3+) will parse as string UUID. Consistent with existing API schemas (`TaskRead` uses `uuid.UUID`).

**Spec correction**: Spec FR-004 says "task_id (integer)" — this is a spec inaccuracy. Actual type is UUID string. Plan takes precedence from codebase inspection.

---

## R-005: MCP Tool Layer — Publish Point

**Decision**: Publish events from `task_ops.py` (logic layer) NOT from `mcp/server.py` (tool layer) or `routes/tasks.py` (route layer).

**Rationale**:
- `task_ops.py` is the single shared layer called by both routes AND MCP tools (Constitution X + backend CLAUDE.md)
- Adding publish to `task_ops.py` ensures events fire regardless of caller (REST or AI agent)
- Keeps route handlers and MCP tools unchanged (Constitution III — non-destructive)
- `task_ops.py` is sync → use `threading.Thread` or direct try/except for non-blocking publish

**Revised decision**: After further analysis — `task_ops.py` is a pure business logic layer (no I/O side effects beyond DB). Publishing from task_ops would violate the single-responsibility principle. Better approach:
- `task_ops.py` remains pure DB logic (unchanged)
- Routes call `publish_task_event` via `BackgroundTasks` after calling task_ops
- MCP tools call `publish_task_event` directly (try/except) after calling task_ops
- This keeps task_ops testable without Dapr mocked

---

## R-006: Kafka Topic Verification

**Decision**: Use Redpanda Cloud Console UI (primary) and `rpk topic consume` CLI (secondary) for verification.

**Rationale**:
- Redpanda Cloud Console provides real-time topic message inspection at `cloud.redpanda.com`
- `rpk topic consume task-events --brokers <bootstrap> --sasl-mechanism SCRAM-SHA-256 --user <user> --password <pass> --tls-enabled` works from WSL2 terminal
- No additional tooling needed — both methods use existing Redpanda Cloud credentials

---

## R-007: pyproject.toml — httpx already present?

**Finding**: `httpx` is a dependency of `openai-agents` SDK which is installed. However, it should be added as a direct explicit dependency in `pyproject.toml` to avoid transitive dependency issues.

**Action**: Add `httpx>=0.27.0` to `[project.dependencies]` in `pyproject.toml`.
