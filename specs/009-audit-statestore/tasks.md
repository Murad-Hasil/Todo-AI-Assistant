# Tasks: Phase 5.2 — Audit Logs & Statestore Fix

**Input**: Design documents from `specs/009-audit-statestore/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Tests**: No automated tests — infrastructure and event validation via kubectl, curl, and Redpanda Cloud Console
**Organization**: Tasks grouped by user story (3 stories from spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- All file paths absolute from repo root

> ⚠️ **Plan correction from user input T-5.2.5**: `app/logic/task_ops.py` is NOT modified.
> Per plan.md (research R-005), publish is called from `routes/tasks.py` (BackgroundTasks)
> and `mcp/server.py` (direct call) — keeping task_ops pure and testable.

---

## Phase 1: Setup (Foundational — Parallel Infrastructure)

**Purpose**: Prepare infrastructure files and the events utility. Both tracks (statestore fix + events.py) are independent and can be built in parallel.

**⚠️ CRITICAL**: All implementation tasks (Phase 3+) depend on T003 (events.py) and T001–T002 (manifest files) existing before apply/deploy steps.

- [x] T001 [P] Update `todo-web-app/k8s/dapr/dapr-secrets.yaml` — add `DIRECT_DATABASE_URL` key with non-pooler Neon connection string (`ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech`, no `-pooler`, no `channel_binding`, `sslmode=require`). Comment must read: `# [Task]: T-5.2.1`

- [x] T002 [P] Update `todo-web-app/k8s/dapr/statestore.yaml` — change `secretKeyRef.key` from `STATESTORE_URL` to `DIRECT_DATABASE_URL`; remove `disableEntityManagement` line (if present); remove `timeout` override (use Dapr default). Comment must read: `# [Task]: T-5.2.2`

- [x] T003 [P] Create `todo-web-app/backend/app/logic/events.py` — implement `publish_task_event(action: str, task_id: str, user_id: str) -> None`:
  ```
  # [Task]: T-5.2.4
  - Validate: action in {"created","updated","deleted"}, task_id and user_id not empty → log WARNING and return if invalid
  - Build payload: {"action": action, "task_id": task_id, "user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()}
  - POST to http://localhost:3500/v1.0/publish/todoai-pubsub/task-events with httpx.post(timeout=5.0)
  - Retry loop: 3 attempts, exponential backoff 200ms→400ms→max 5s
  - HTTP 204 → return; other status → log ERROR with status code + attempt number
  - Any exception (ConnectionRefused, timeout) → log ERROR with exc + attempt number
  - After all retries exhausted → log ERROR "EXHAUSTED: action={action} task_id={task_id}"
  - Function NEVER raises — all exceptions caught internally
  ```

- [x] T004 [P] Update `todo-web-app/backend/pyproject.toml` — add `"httpx>=0.27.0"` to `[project.dependencies]` explicitly (currently a transitive dep via openai-agents). Comment line: `# [Task]: T-5.2.4 — explicit dep for Dapr sidecar calls`

**Checkpoint**: `events.py` exists and passes a local import test. Manifest files updated with correct keys.

---

## Phase 2: Foundational — Backend Integration

**Purpose**: Wire `publish_task_event` into route handlers and MCP tools. Requires T003 (events.py) complete.

**⚠️ CRITICAL**: T005 and T006 depend on T003. T007–T009 depend on T005 and T006.

- [x] T005 [US1] Modify `todo-web-app/backend/app/routes/tasks.py` — add BackgroundTask publish after each successful CRUD operation:
  ```
  # [Task]: T-5.2.5
  1. Add import: from fastapi import BackgroundTasks
  2. Add import: from app.logic.events import publish_task_event
  3. create_task route:
     - Add `background_tasks: BackgroundTasks` parameter
     - After op_create_task(): background_tasks.add_task(publish_task_event, "created", str(task.id), user_id)
  4. update_task route:
     - Add `background_tasks: BackgroundTasks` parameter
     - After op_update_task(): background_tasks.add_task(publish_task_event, "updated", str(task_id), user_id)
  5. toggle_task_completion route:
     - Add `background_tasks: BackgroundTasks` parameter
     - After session.commit(): background_tasks.add_task(publish_task_event, "updated", str(task_id), user_id)
  6. delete_task route:
     - Add `background_tasks: BackgroundTasks` parameter
     - After successful op_delete_task(): background_tasks.add_task(publish_task_event, "deleted", str(task_id), user_id)
  NOTE: get_task and list_tasks routes — NO change (read-only operations)
  NOTE: task_ops.py — UNCHANGED (plan.md research R-005)
  ```

- [x] T006 [P] [US1] Modify `todo-web-app/backend/app/mcp/server.py` — add direct `publish_task_event` call after each mutating tool:
  ```
  # [Task]: T-5.2.5 (MCP layer)
  Add import: from app.logic.events import publish_task_event
  1. add_task tool: after op_create_task() succeeds → publish_task_event("created", str(task.id), user_id)
  2. update_task tool: after op_update_task() succeeds → publish_task_event("updated", str(task_id), user_id)
  3. complete_task tool: after op_complete_task() succeeds → publish_task_event("updated", str(task_id), user_id)
  4. delete_task tool: after op_delete_task() succeeds → publish_task_event("deleted", str(task_id), user_id)
  NOTE: list_tasks tool — NO change (read-only)
  NOTE: publish_task_event never raises — no additional try/except needed in tools
  ```

**Checkpoint**: `routes/tasks.py` and `mcp/server.py` import `publish_task_event`. No syntax errors.

---

## Phase 3: User Story 1 — Task Actions Are Recorded as Audit Events (Priority: P1) 🎯 MVP

**Goal**: Every task CRUD operation → event appears in `task-events` topic within 5 seconds. Backend pod rebuilds successfully with new events.py integrated.

**Independent Test**:
```bash
# Create task via API → inspect task-events topic in Redpanda Cloud Console
# Expected: message with action="created", task_id, user_id, timestamp
```

### Implementation for User Story 1

- [x] T007 [US1] Run `uv sync` in `todo-web-app/backend/` to install explicit httpx dependency:
  ```bash
  # [Task]: T-5.2.4
  cd todo-web-app/backend && uv sync
  # Verify: uv pip show httpx | grep Version
  ```

- [x] T008 [US1] Build backend Docker image into Minikube:
  ```bash
  # [Task]: T-5.2.5
  eval $(minikube docker-env)
  docker build -t todo-backend:local ./todo-web-app/backend/
  # Expected: Successfully built <sha>
  ```

- [x] T009 [US1] Deploy with Helm upgrade:
  ```bash
  # [Task]: T-5.2.5
  helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
    --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
  kubectl rollout status deployment/todoai-backend
  kubectl get pods
  # Expected: todoai-backend-* 2/2 Running (0 restarts)
  ```

- [x] T010 [US1] Run SC-001 audit event smoke test (T-5.2.7):
  ```bash
  # [Task]: T-5.2.7
  # Step 1: Get minikube IP and a valid JWT token (sign in via frontend)
  # Step 2: Create a task
  curl -X POST http://$(minikube ip):30800/api/<user_id>/tasks \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"title": "Audit test task"}'
  # Expected: HTTP 201

  # Step 3: Inspect Redpanda Cloud Console → Topics → task-events → Consume messages
  # Expected: message within 5s with:
  #   { "action": "created", "task_id": "<uuid>", "user_id": "<user_id>", "timestamp": "..." }
  ```

- [ ] T011 [P] [US1] Run SC-004 broker-down resilience test (T-5.2.7):
  ```bash
  # [Task]: T-5.2.7
  # Temporarily patch dapr-secrets with invalid broker URL
  kubectl patch secret dapr-secrets --type='json' \
    -p='[{"op":"replace","path":"/data/REDPANDA_BOOTSTRAP_SERVER","value":"'$(echo -n 'bad.invalid:9092' | base64)'"}]'
  kubectl rollout restart deployment/todoai-backend
  kubectl rollout status deployment/todoai-backend
  # Attempt task create → must return HTTP 201 (task saved, publish fails silently)
  # Restore: re-apply dapr-secrets.yaml with correct broker, rollout restart
  ```

**Checkpoint (SC-001 + SC-004)**: Task CRUD returns 2xx. Event appears in `task-events` topic. Broker failure does not affect task API. User Story 1 complete. ✅

---

## Phase 4: User Story 2 — Distributed State Store Is Healthy (Priority: P2)

**Goal**: `todoai-statestore` component shows green in Dapr dashboard. Backend pod `2/2 Running` with zero statestore-related restarts.

**Independent Test**:
```bash
dapr dashboard -k
# Components tab: todoai-statestore ✅ green
kubectl get pods
# todoai-backend-* 2/2 Running (no restarts from statestore)
```

### Implementation for User Story 2

- [x] T012 [US2] Apply updated dapr-secrets (T-5.2.1, T-5.2.3):
  ```bash
  # [Task]: T-5.2.3
  kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml
  # Verify: kubectl get secret dapr-secrets -o jsonpath='{.data}' | python3 -m json.tool
  # Expected: DIRECT_DATABASE_URL key present
  ```

- [x] T013 [US2] Apply updated statestore component — ⚠️ T017 FALLBACK EXECUTED: statestore component deleted after DDL timeout (Neon unreachable from Minikube even via direct endpoint; disableEntityManagement ignored in Dapr 1.17). US2 deferred. (T-5.2.2, T-5.2.3):
  ```bash
  # [Task]: T-5.2.3
  kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml
  # Verify: kubectl get components.dapr.io
  # Expected: todoai-statestore listed
  ```

- [ ] T014 [US2] Restart backend pod to load new statestore component:
  ```bash
  # [Task]: T-5.2.6
  kubectl rollout restart deployment/todoai-backend
  kubectl rollout status deployment/todoai-backend
  kubectl get pods
  # Expected: todoai-backend-* 2/2 Running (0 restarts)
  ```

- [ ] T015 [US2] Check daprd logs for statestore initialization (T-5.2.6):
  ```bash
  # [Task]: T-5.2.6
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl logs $BACKEND_POD -c daprd --tail=30
  # Expected: "Component loaded: todoai-statestore (state.postgresql/v1)"
  # NOT expected: "INIT_COMPONENT_FAILURE" or "timeout: context already done"
  ```

- [ ] T016 [US2] Verify Dapr dashboard shows statestore healthy (T-5.2.6):
  ```bash
  # [Task]: T-5.2.6
  dapr dashboard -k
  # Open http://localhost:8080 in browser
  # Components tab: todoai-pubsub ✅, todoai-statestore ✅
  # Applications tab: todo-backend ✅, todo-frontend ✅
  ```

- [ ] T017 [US2] Fallback: If direct endpoint still unreachable from Minikube, re-add `disableEntityManagement: "true"` to statestore.yaml and switch back to `STATESTORE_URL` (pooler). Tables pre-created in Phase 5.1 → Dapr skips DDL. Document as known limitation in statestore.yaml comment:
  ```yaml
  # [Task]: T-5.2.2 FALLBACK
  # Neon direct endpoint unreachable from Minikube — using pooler with pre-created tables
  # disableEntityManagement: "true" prevents DDL (pgBouncer transaction mode incompatible)
  ```

**Checkpoint (SC-002)**: `todoai-statestore` green in Dapr dashboard. Pod 2/2, 0 statestore restarts. User Story 2 complete. ✅

---

## Phase 5: User Story 3 — Audit State Survives Infrastructure Restarts (Priority: P3)

**Goal**: Test value written to state store before pod restart is readable after restart — confirms Neon PostgreSQL durable persistence.

**Independent Test**:
```bash
# Write → restart → read back → value matches
```

**⚠️ Prerequisite**: US2 (statestore healthy) must be complete before this phase.

### Implementation for User Story 3

- [ ] T018 [US3] Write test value to statestore via Dapr HTTP API (SC-003):
  ```bash
  # [Task]: T-5.2.6
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec $BACKEND_POD -c backend -- python3 -c "
  import urllib.request, json
  data = json.dumps([{'key':'smoke-test','value':'dapr-ok'}]).encode()
  req = urllib.request.Request(
      'http://localhost:3500/v1.0/state/todoai-statestore',
      data=data, headers={'Content-Type':'application/json'}, method='POST')
  print('Write status:', urllib.request.urlopen(req).status)
  "
  # Expected: Write status: 204
  ```

- [ ] T019 [US3] Restart backend pod and wait for ready (SC-003):
  ```bash
  # [Task]: T-5.2.6
  kubectl rollout restart deployment/todoai-backend
  kubectl rollout status deployment/todoai-backend
  kubectl get pods
  # Expected: new pod 2/2 Running
  ```

- [ ] T020 [US3] Read back test value from statestore after restart (SC-003):
  ```bash
  # [Task]: T-5.2.6
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec $BACKEND_POD -c backend -- python3 -c "
  import urllib.request
  res = urllib.request.urlopen('http://localhost:3500/v1.0/state/todoai-statestore/smoke-test')
  print('Value:', res.read())
  "
  # Expected: Value: b'\"dapr-ok\"'
  ```

**Checkpoint (SC-003)**: Value readable after pod restart. State persisted in Neon PostgreSQL. User Story 3 complete. ✅

---

## Phase 6: Polish & Verification

**Purpose**: Regression checks, HF Space deploy, spec docs update.

- [ ] T021 [P] Run SC-005 regression test — verify all existing task API endpoints return identical responses:
  ```bash
  # [Task]: T-5.2.7
  # Test GET /api/{user_id}/tasks, GET single, PUT update, DELETE, PATCH complete
  # All must return same HTTP status codes and response shapes as pre-Phase-5.2
  ```

- [ ] T022 [P] Update `todo-web-app/k8s/dapr/dapr-secrets.yaml.example` — add `DIRECT_DATABASE_URL` placeholder:
  ```yaml
  # [Task]: T-5.2.1
  # Direct (non-pooler) endpoint for Dapr statestore DDL
  DIRECT_DATABASE_URL: "postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require"
  ```

- [x] T023 Deploy updated backend to HF Space (production):
  ```bash
  # [Task]: T-5.2.5
  # From project root:
  ./deploy-backend.sh "feat: Phase 5.2 — audit events (fire-and-forget) + statestore fix"
  # Note: HF Space has no Dapr sidecar; events.py logs ConnectionRefused silently — no user impact
  ```

- [ ] T024 [P] Update `specs/009-audit-statestore/checklists/requirements.md` — mark all SC items complete or document blockers (statestore fallback if applicable).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: T001–T004) — PARALLEL — can all start immediately
  ├── T001 [P]: dapr-secrets.yaml (DIRECT_DATABASE_URL)
  ├── T002 [P]: statestore.yaml (key reference update)
  ├── T003 [P]: app/logic/events.py (NEW — required for T005, T006)
  └── T004 [P]: pyproject.toml (httpx explicit dep)

Phase 2 (Foundational: T005–T006)  ← requires T003
  ├── T005: routes/tasks.py (BackgroundTasks publish)
  └── T006 [P]: mcp/server.py (direct publish)

Phase 3 (US1 — Audit Events: T007–T011)  ← requires T005, T006
  ├── T007: uv sync
  ├── T008: docker build
  ├── T009: helm upgrade + rollout status
  ├── T010: SC-001 smoke test
  └── T011 [P]: SC-004 broker-down test

Phase 4 (US2 — Statestore Healthy: T012–T017)  ← requires T001, T002
  ├── T012: kubectl apply dapr-secrets
  ├── T013: kubectl apply statestore
  ├── T014: kubectl rollout restart
  ├── T015: daprd log check
  ├── T016: dapr dashboard verify
  └── T017: FALLBACK (conditional)

Phase 5 (US3 — State Persistence: T018–T020)  ← requires T016 (US2 complete)
  ├── T018: statestore write
  ├── T019: pod restart
  └── T020: statestore read-back

Phase 6 (Polish: T021–T024)  ← after US1+US2 complete
  ├── T021 [P]: regression test
  ├── T022 [P]: dapr-secrets.yaml.example update
  ├── T023: HF Space deploy
  └── T024 [P]: checklist update
```

### Task-Level Dependencies (within phases)

- **T005** requires T003 (events.py must exist before modifying routes)
- **T006** requires T003 (events.py must exist before modifying mcp/server.py)
- **T008** requires T007 (uv sync before docker build)
- **T009** requires T008 (image must exist before helm deploy)
- **T010** requires T009 (pod must be running before smoke test)
- **T013** requires T012 (secret must have DIRECT_DATABASE_URL before applying statestore component)
- **T014** requires T013 (statestore component must be applied before restart)
- **T018–T020** require T016 (statestore must be healthy before persistence test)

### Parallel Opportunities

- T001, T002, T003, T004 — all parallel (different files, no dependencies)
- T005 and T006 — parallel (different files, both only depend on T003)
- T011 — parallel with T010 (different test scenarios)
- T021, T022, T024 — parallel (different files)

---

## Parallel Example: US1 Setup

```bash
# These can all be created in parallel (Phase 1):
Task T001: Update dapr-secrets.yaml — add DIRECT_DATABASE_URL
Task T002: Update statestore.yaml — change secretKeyRef.key
Task T003: Create app/logic/events.py — publish_task_event()
Task T004: Update pyproject.toml — add httpx>=0.27.0

# Then sequentially:
T005 + T006: Modify routes/tasks.py and mcp/server.py (both need events.py)
T007 → T008 → T009 → T010: sync → build → deploy → smoke test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001–T004 (parallel setup)
2. Complete Phase 2: T005–T006 (backend integration)
3. Complete Phase 3: T007–T011 (deploy + verify events)
4. **STOP and VALIDATE**: Event appears in Redpanda topic ✅ Broker failure doesn't break CRUD ✅
5. Proceed to Phase 4 (statestore) and Phase 5 (persistence)

### Full Delivery (All Stories)

1. Phase 1 (parallel) → Phase 2 → Phase 3 (US1 MVP) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)
2. Each phase checkpoint validates the story independently

---

## Notes

- `app/logic/task_ops.py` is **NOT modified** — plan.md research R-005 decision
- Publish fires from route layer (BackgroundTasks) and MCP layer (direct call)
- `publish_task_event` is intentionally silent on failure — HF Space has no Dapr sidecar
- `dapr-secrets.yaml` is gitignored; update `.yaml.example` for operator reference (T022)
- Commit after T009 (US1 deploy), T016 (US2 statestore), T020 (US3 persistence)
- If statestore direct endpoint unreachable from Minikube: execute T017 fallback and document
