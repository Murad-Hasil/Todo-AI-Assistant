# Implementation Plan: Phase 5.2 — Audit Logs & Statestore Fix

**Branch**: `009-audit-statestore` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-audit-statestore/spec.md`

---

## Summary

Fix the Dapr state store (blocked in Phase 5.1 due to Neon pgBouncer DDL incompatibility) by switching to the direct Neon endpoint. Add fire-and-forget audit event publishing to the `task-events` Kafka topic on every task CRUD operation, implemented via a new `app/logic/events.py` utility called from route handlers and MCP tools. No changes to existing task CRUD logic or API contracts.

---

## Technical Context

**Language/Version**: Python 3.13 (backend), YAML (K8s manifests)
**Primary Dependencies**: FastAPI 0.115+, httpx>=0.27.0, Dapr HTTP API (localhost:3500), Kubernetes Secrets
**Storage**: Neon PostgreSQL (pooler for app CRUD; direct endpoint for Dapr statestore DDL)
**Testing**: Manual kubectl + curl smoke tests; Redpanda Cloud Console topic inspection
**Target Platform**: Minikube (local K8s) + HF Space (production backend — Dapr not present there)
**Performance Goals**: Publish latency <5s (background task); task CRUD p95 unaffected
**Constraints**: Fire-and-forget — publish MUST NOT block task CRUD response. No new DB tables. No changes to existing API contracts.
**Scale/Scope**: Same as Phase 5.1 — single-node Minikube, 1 backend replica

---

## Constitution Check

*GATE: Must pass before implementation. Re-checked post-design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I — Spec-Driven | ✅ | spec.md + plan.md + tasks.md required before code |
| II — Read-Before-Write | ✅ | task_ops.py, routes/tasks.py, mcp/server.py all read |
| III — Non-Destructive | ✅ | task_ops.py unchanged; events.py is additive only |
| IV — API-First | ✅ | No new endpoints; existing routes unchanged |
| V — Multi-User Isolation | ✅ | `user_id` embedded in every audit event payload |
| VI — JWT Security | ✅ | No auth changes; events are derived post-auth |
| VII — Monorepo Pattern | ✅ | New file at `app/logic/events.py` — within approved layout |
| VIII — Code Quality | ✅ | PEP8, type hints, <88 chars — enforced in events.py |
| XII — Event-Driven | ✅ | Publish via Dapr HTTP API (localhost:3500) — not direct Kafka |
| XIII — Dapr Sidecar | ✅ | Backend pod already has sidecar (2/2 Running confirmed) |
| XIV — Infrastructure Abstraction | ✅ | httpx calls target localhost:3500 (Dapr sidecar), not Kafka directly |
| XV — Event Publishing Reliability | ⚠️ | See Complexity Tracking — partial deviation justified |

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Constitution XV: retry-exhausted failures should surface as HTTP 503 | FR-005 requires fire-and-forget — publish MUST NOT block the task CRUD response. BackgroundTask runs after HTTP response is already sent; there is no caller to receive a 503. | Synchronous retry before returning HTTP response would violate FR-005 and add latency to every task operation. The audit log is non-critical (P1 business value, not P1 reliability). |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-audit-statestore/
├── plan.md              ← This file
├── research.md          ← Phase 0 — resolved all unknowns
├── data-model.md        ← AuditEvent payload + Task (unchanged)
├── contracts/
│   └── events-contract.md  ← Dapr publish API + retry contract + events.py interface
├── checklists/
│   └── requirements.md
└── tasks.md             ← Created by /sp.tasks (not yet)
```

### Source Code Changes

```text
todo-web-app/backend/
└── app/
    ├── logic/
    │   ├── task_ops.py          # UNCHANGED — pure CRUD logic
    │   └── events.py            # NEW — publish_task_event() with retry
    ├── routes/
    │   └── tasks.py             # MODIFIED — add BackgroundTask publish after CRUD ops
    └── mcp/
        └── server.py            # MODIFIED — add direct publish call after tool ops

todo-web-app/k8s/dapr/
├── dapr-secrets.yaml            # MODIFIED — add DIRECT_DATABASE_URL key
└── statestore.yaml              # MODIFIED — reference DIRECT_DATABASE_URL, remove disableEntityManagement
```

---

## Phase 0: Research Summary

All unknowns resolved. See `research.md` for full details.

| Item | Decision |
|------|----------|
| Statestore connection | `DIRECT_DATABASE_URL` — non-pooler Neon endpoint (DDL-capable) |
| Publish architecture | `BackgroundTasks` (routes) + direct try/except (MCP tools) |
| HTTP client | `httpx` (already transitive dep via openai-agents) |
| task_id type | UUID string (not integer — spec correction) |
| Publish point | After task_ops call in routes + MCP tools (task_ops unchanged) |
| Kafka verification | Redpanda Cloud Console + `rpk topic consume` |

---

## Phase 1: Design

### 1A. Infrastructure Repair — Statestore (FR-007, FR-008, FR-009, SC-002, SC-003)

**Problem**: Dapr `state.postgresql` requires DDL support. Neon pooler (pgBouncer transaction mode) blocks DDL. Direct endpoint supports DDL.

**Plan**:

1. **Update `dapr-secrets.yaml`** — add `DIRECT_DATABASE_URL` key:
   ```
   DIRECT_DATABASE_URL: postgresql://neondb_owner:<pass>@ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   (No `channel_binding`. No `-pooler` in hostname.)

2. **Update `statestore.yaml`** — reference `DIRECT_DATABASE_URL`, remove `disableEntityManagement`:
   ```yaml
   - name: connectionString
     secretKeyRef:
       name: dapr-secrets
       key: DIRECT_DATABASE_URL
   ```

3. **Apply and verify**:
   ```bash
   kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml
   kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml
   kubectl rollout restart deployment/todoai-backend
   # Verify: kubectl get pods → 2/2 Running, 0 restarts
   # Verify: dapr dashboard -k → todoai-statestore green
   ```

4. **Fallback** (if direct endpoint still unreachable from Minikube): Re-add `disableEntityManagement: "true"` and use `STATESTORE_URL` (pooler). Tables are pre-created — Dapr skips DDL. Document as known limitation.

---

### 1B. events.py — Utility Module (FR-001–005, SC-001, SC-004)

**File**: `todo-web-app/backend/app/logic/events.py`

**Design**:
- Single public function: `publish_task_event(action, task_id, user_id)`
- Validates inputs (action in allowed set, task_id and user_id not empty)
- Retry loop: 3 attempts, exponential backoff (200ms → 400ms → max 5s)
- Uses `httpx.post` to `http://localhost:3500/v1.0/publish/todoai-pubsub/task-events`
- On success (HTTP 204): return immediately
- On exhaustion: `logging.error(...)` — never raises
- On invalid inputs: `logging.warning(...)` — skip publish, never raises

**Pseudocode**:
```python
DAPR_PUBLISH_URL = "http://localhost:3500/v1.0/publish/todoai-pubsub/task-events"
RETRY_ATTEMPTS = 3
INITIAL_BACKOFF_S = 0.2

def publish_task_event(action: str, task_id: str, user_id: str) -> None:
    if not task_id or not user_id or action not in {"created", "updated", "deleted"}:
        log.warning("publish_task_event: invalid inputs, skipping")
        return
    payload = {"action": action, "task_id": task_id, "user_id": user_id,
               "timestamp": datetime.now(timezone.utc).isoformat()}
    backoff = INITIAL_BACKOFF_S
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            r = httpx.post(DAPR_PUBLISH_URL, json=payload, timeout=5.0)
            if r.status_code == 204:
                return
            log.error(f"publish attempt {attempt}: unexpected status {r.status_code}")
        except Exception as exc:
            log.error(f"publish attempt {attempt}: {exc}")
        if attempt < RETRY_ATTEMPTS:
            time.sleep(backoff)
            backoff = min(backoff * 2, 5.0)
    log.error(f"publish_task_event EXHAUSTED: action={action} task_id={task_id}")
```

**HF Space safety**: When running outside Minikube (HF Space), Dapr sidecar is absent. `httpx.post` to `localhost:3500` will get `ConnectionRefused` → caught by except → logged → silently skipped. No crash.

---

### 1C. routes/tasks.py — BackgroundTask Integration (FR-001–003, FR-005)

**Pattern**: After each successful task_ops call, add `background_tasks.add_task(publish_task_event, ...)`. The FastAPI route signature gains `background_tasks: BackgroundTasks` parameter.

**Routes to modify**:
- `create_task` → after `op_create_task()`: `background_tasks.add_task(publish_task_event, "created", str(task.id), user_id)`
- `update_task` → after `op_update_task()`: `background_tasks.add_task(publish_task_event, "updated", str(task_id), user_id)`
- `toggle_task_completion` → after commit: `background_tasks.add_task(publish_task_event, "updated", str(task_id), user_id)`
- `delete_task` → after `op_delete_task()` (before 404 check): `background_tasks.add_task(publish_task_event, "deleted", str(task_id), user_id)`

**`task_ops.py` is NOT modified.** The route layer adds the background task after the operation succeeds.

---

### 1D. mcp/server.py — Direct Publish (FR-001–003, FR-005)

**Pattern**: After each successful MCP tool call to task_ops, call `publish_task_event(...)` directly. Wrapped in try/except to ensure it never raises.

**MCP tools to modify**:
- `add_task` → after `op_create_task()`: `publish_task_event("created", str(task.id), user_id)`
- `update_task` → after `op_update_task()`: `publish_task_event("updated", str(task_id), user_id)`
- `complete_task` → after `op_complete_task()`: `publish_task_event("updated", str(task_id), user_id)`
- `delete_task` → after `op_delete_task()`: `publish_task_event("deleted", str(task_id), user_id)`

**Note**: `publish_task_event` never raises (by design), so no additional try/except needed in MCP tools.

---

### 1E. pyproject.toml — Explicit httpx Dependency

Add `httpx>=0.27.0` to `[project.dependencies]` in `todo-web-app/backend/pyproject.toml`. Currently a transitive dependency — make it explicit.

---

### 1F. Kafka Topic Verification (SC-001)

**Method 1 — Redpanda Cloud Console**:
1. Login to `cloud.redpanda.com`
2. Navigate to cluster → Topics → `task-events`
3. Click "Consume messages" — messages appear in real-time after task operations

**Method 2 — rpk CLI**:
```bash
rpk topic consume task-events \
  --brokers d6mdodnjkk1fce8glrng.any.us-east-1.mpx.prd.cloud.redpanda.com:9092 \
  --sasl-mechanism SCRAM-SHA-256 \
  --user Murad_hasil \
  --password <REDPANDA_PASSWORD> \
  --tls-enabled
```

**Method 3 — curl from inside backend pod** (after events.py is deployed):
```bash
BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
# Create a task via API, then check topic
```

---

## Smoke Tests

| SC | Test | Expected |
|----|------|----------|
| SC-001 | Create task via API → check topic | Event appears in `task-events` within 5s |
| SC-002 | `kubectl get pods` | Backend 2/2 Running, 0 statestore restarts |
| SC-002 | `dapr dashboard -k` | `todoai-statestore` green |
| SC-003 | Write to statestore → restart pod → read back | Value persists |
| SC-004 | Break broker URL → create task → restore | Task created (HTTP 201), no crash |
| SC-005 | All existing API endpoints | Responses identical to pre-Phase-5.2 |

---

## Dependency Graph

```
Infrastructure (Statestore fix)
  └── T-I1: Update dapr-secrets.yaml (add DIRECT_DATABASE_URL)
  └── T-I2: Update statestore.yaml (reference DIRECT_DATABASE_URL)
  └── T-I3: Apply + rollout restart backend
  └── T-I4: Verify 2/2 + dashboard green

Event Publishing
  └── T-E1: Create app/logic/events.py
  └── T-E2: Add httpx to pyproject.toml
  └── T-E3: Modify routes/tasks.py (BackgroundTask publish)  ← depends T-E1
  └── T-E4: Modify mcp/server.py (direct publish)           ← depends T-E1
  └── T-E5: Build + redeploy backend image
  └── T-E6: Smoke test — create task → topic inspection     ← depends T-E5

Verification
  └── T-V1: SC-001 audit event test
  └── T-V2: SC-004 broker-down resilience test
  └── T-V3: SC-005 regression test (existing endpoints)
  └── T-V4: SC-003 state persistence test                   ← depends T-I4
```

**Parallel opportunities**: T-I1/T-I2 can be done in parallel; T-E1/T-E2 in parallel; T-I* and T-E1/T-E2 in parallel (different files).
