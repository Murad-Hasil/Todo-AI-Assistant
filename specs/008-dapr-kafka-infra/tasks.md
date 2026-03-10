# Tasks: Phase 5.1 — Event-Driven Infrastructure (Dapr & Kafka)

**Input**: Design documents from `/specs/008-dapr-kafka-infra/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅
**Tests**: No automated tests — infrastructure validation via `kubectl` and `curl` smoke tests
**Organization**: Tasks grouped by user story (3 stories from spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- All file paths are absolute from repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Dapr control plane and create directory structure. Must complete before any component manifests can be applied.

- [ ] T001 Install Dapr CLI on local machine: `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash` — verify with `dapr --version`
- [ ] T002 Install Dapr control plane into Minikube: `dapr init --kubernetes --wait` — verify all pods Running in `dapr-system` namespace via `kubectl get pods -n dapr-system`
- [ ] T003 [P] Create Dapr manifests directory: `mkdir -p todo-web-app/k8s/dapr/subscriptions`
- [ ] T004 [P] Create gitignore for `dapr-secrets.yaml`: add `dapr-secrets.yaml` to `todo-web-app/k8s/dapr/.gitignore`

**Checkpoint**: `kubectl get pods -n dapr-system` shows dapr-operator, dapr-sidecar-injector, dapr-placement-server, dapr-scheduler-server all Running.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Credentials and secrets in the cluster. No component manifest can reference secrets that don't exist yet.

**⚠️ CRITICAL**: Phases 3, 4, 5 cannot proceed until this phase is complete.

- [ ] T005 Create `todo-web-app/k8s/dapr/dapr-secrets.yaml.example` — example secret manifest with placeholder values for `REDPANDA_BOOTSTRAP_SERVER`, `REDPANDA_USERNAME`, `REDPANDA_PASSWORD`, `DATABASE_URL` (stringData, not data — no base64 needed)
- [ ] T006 Operator action: copy `dapr-secrets.yaml.example` → `dapr-secrets.yaml`, fill in real Redpanda Cloud and Neon credentials, then apply: `kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml`
- [ ] T007 Verify secret exists: `kubectl get secret dapr-secrets -o jsonpath='{.data}' | python3 -m json.tool` — must show 4 keys: `REDPANDA_BOOTSTRAP_SERVER`, `REDPANDA_USERNAME`, `REDPANDA_PASSWORD`, `DATABASE_URL`

**Checkpoint**: `kubectl get secret dapr-secrets` returns the secret with 4 keys.

---

## Phase 3: User Story 1 — Backend Publishes Task Events Without Knowing the Broker (Priority: P1) 🎯 MVP

**Goal**: Dapr PubSub component connects to Redpanda Cloud; backend pod can reach broker via `localhost:3500`; a manual curl publish returns HTTP 204.

**Independent Test**: `kubectl exec` into the backend pod and run:
```bash
curl -X POST http://localhost:3500/v1.0/publish/todoai-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"user_id":"smoke","task_id":"t-001","action":"created","timestamp":"2026-03-08T00:00:00Z"}'
# Expected: HTTP 204
```

### Implementation for User Story 1

- [ ] T008 [US1] Create `todo-web-app/k8s/dapr/pubsub.yaml` — Dapr Component manifest:
  ```yaml
  # [Task]: T-5.1.2 — Kafka PubSub Component via Redpanda Cloud
  apiVersion: dapr.io/v1alpha1
  kind: Component
  metadata:
    name: todoai-pubsub
    namespace: default
  spec:
    type: pubsub.kafka
    version: v1
    metadata:
      - name: brokers
        secretKeyRef:
          name: dapr-secrets
          key: REDPANDA_BOOTSTRAP_SERVER
      - name: authType
        value: "password"
      - name: saslUsername
        secretKeyRef:
          name: dapr-secrets
          key: REDPANDA_USERNAME
      - name: saslPassword
        secretKeyRef:
          name: dapr-secrets
          key: REDPANDA_PASSWORD
      - name: saslMechanism
        value: "SHA-256"
      - name: consumerGroup
        value: "todoai-consumers"
      - name: clientID
        value: "todoai-dapr"
      - name: maxMessageBytes
        value: "1048576"
  auth:
    secretStore: kubernetes
  ```

- [ ] T009 [US1] Create `todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml` — Subscription manifest:
  ```yaml
  # [Task]: T-5.1.2 — task-events subscription for todo-backend
  apiVersion: dapr.io/v1alpha1
  kind: Subscription
  metadata:
    name: task-events-subscription
    namespace: default
  spec:
    pubsubname: todoai-pubsub
    topic: task-events
    route: /api/events/task
    scopes:
      - todo-backend
  ```

- [ ] T010 [US1] Apply PubSub manifests:
  ```bash
  kubectl apply -f todo-web-app/k8s/dapr/pubsub.yaml
  kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml
  ```
  Verify: `kubectl get components.dapr.io` shows `todoai-pubsub`.

- [ ] T011 [US1] Add Dapr sidecar annotations to backend Helm template `todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml` — add to `spec.template.metadata` block (after existing `labels:`):
  ```yaml
      # [Task]: T-5.1.5 — Dapr sidecar injection for todo-backend
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/log-level: "info"
  ```

- [ ] T012 [US1] Rebuild backend image and redeploy via Helm to inject sidecar:
  ```bash
  eval $(minikube docker-env)
  docker build -t todo-backend:local ./todo-web-app/backend/
  helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
    --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
  ```

- [ ] T013 [US1] Verify backend pod shows 2/2 containers: `kubectl get pods` — `todoai-backend-*` must show `2/2 READY`. If still `1/2`, check: `kubectl describe pod <backend-pod> | grep -A5 Events`

- [ ] T014 [US1] Run PubSub smoke test from inside backend pod (SC-002):
  ```bash
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it $BACKEND_POD -c backend -- \
    curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3500/v1.0/publish/todoai-pubsub/task-events \
    -H "Content-Type: application/json" \
    -d '{"user_id":"smoke","task_id":"t-001","action":"created","timestamp":"2026-03-08T00:00:00Z"}'
  # Expected: 204
  ```

**Checkpoint**: HTTP 204 from publish curl confirms Dapr ↔ Redpanda connection is live. User Story 1 complete. ✅

---

## Phase 4: User Story 2 — Operators Verify Distributed Runtime Health (Priority: P2)

**Goal**: Both pods show 2/2 containers; Dapr Dashboard shows components healthy; frontend sidecar is annotated for future use.

**Independent Test**: `dapr dashboard -k` → Components tab shows `todoai-pubsub` and `todoai-statestore` green.

### Implementation for User Story 2

- [ ] T015 [US2] Create `todo-web-app/k8s/dapr/statestore.yaml` — Dapr State Store Component manifest:
  ```yaml
  # [Task]: T-5.1.3 — PostgreSQL State Store via Neon
  apiVersion: dapr.io/v1alpha1
  kind: Component
  metadata:
    name: todoai-statestore
    namespace: default
  spec:
    type: state.postgresql
    version: v1
    metadata:
      - name: connectionString
        secretKeyRef:
          name: dapr-secrets
          key: DATABASE_URL
      - name: tableName
        value: "dapr_state"
      - name: metadataTableName
        value: "dapr_metadata"
      - name: timeout
        value: "30s"
      - name: cleanupInterval
        value: "1h"
  auth:
    secretStore: kubernetes
  ```

- [ ] T016 [US2] Apply state store manifest: `kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml`
  Verify: `kubectl get components.dapr.io` shows `todoai-statestore`.

- [ ] T017 [US2] Add Dapr sidecar annotations to frontend Helm template `todo-web-app/k8s/charts/todoai/templates/frontend-deployment.yaml` — add to `spec.template.metadata` block (after existing `labels:`):
  ```yaml
      # [Task]: T-5.1.6 — Dapr sidecar injection for todo-frontend
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-frontend"
        dapr.io/app-port: "3000"
        dapr.io/log-level: "info"
  ```

- [ ] T018 [US2] Rebuild frontend image and run full Helm upgrade:
  ```bash
  eval $(minikube docker-env)
  docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
    -t todo-frontend:local ./todo-web-app/frontend/
  helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
    --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
  ```

- [ ] T019 [US2] Verify both pods show 2/2 READY (SC-001):
  ```bash
  kubectl get pods
  # todoai-backend-*   2/2   Running
  # todoai-frontend-*  2/2   Running
  ```

- [ ] T020 [US2] Open Dapr Dashboard and confirm component health (SC-001, SC-002):
  ```bash
  dapr dashboard -k
  # Browser opens http://localhost:8080
  # Components tab: todoai-pubsub ✅ green, todoai-statestore ✅ green
  # Applications tab: todo-backend ✅, todo-frontend ✅
  ```

**Checkpoint**: Both pods 2/2, both components green in dashboard. User Story 2 complete. ✅

---

## Phase 5: User Story 3 — Conversation State Survives Pod Restarts (Priority: P3)

**Goal**: State store write/read round-trip works via sidecar; value persists after pod restart.

**Independent Test**:
```bash
# Write → restart pod → read back
kubectl exec -it <backend-pod> -c backend -- \
  curl -s http://localhost:3500/v1.0/state/todoai-statestore/smoke-test
# Expected: "dapr-ok" (after pod restart)
```

### Implementation for User Story 3

- [ ] T021 [US3] Run state store write smoke test from inside backend pod:
  ```bash
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it $BACKEND_POD -c backend -- \
    curl -s -X POST http://localhost:3500/v1.0/state/todoai-statestore \
    -H "Content-Type: application/json" \
    -d '[{"key":"smoke-test","value":"dapr-ok"}]'
  # Expected: HTTP 204 (no body)
  ```

- [ ] T022 [US3] Read back immediately to confirm write succeeded (SC-003):
  ```bash
  kubectl exec -it $BACKEND_POD -c backend -- \
    curl -s http://localhost:3500/v1.0/state/todoai-statestore/smoke-test
  # Expected: "dapr-ok"
  ```

- [ ] T023 [US3] Restart backend pod and verify state persists (SC-003):
  ```bash
  kubectl rollout restart deployment/todoai-backend
  kubectl rollout status deployment/todoai-backend
  BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it $BACKEND_POD -c backend -- \
    curl -s http://localhost:3500/v1.0/state/todoai-statestore/smoke-test
  # Expected: "dapr-ok" (same value — persisted in Neon PostgreSQL)
  ```

**Checkpoint**: State value readable after pod restart confirms Neon PostgreSQL state store is live. User Story 3 complete. ✅

---

## Phase 6: Remaining Subscriptions & Polish

**Purpose**: Create subscription manifests for Phase 5.2/5.4 consumers (placeholder — no handler code yet) and update values.yaml.

- [ ] T024 [P] Create `todo-web-app/k8s/dapr/subscriptions/reminders-sub.yaml`:
  ```yaml
  # [Task]: T-5.1.4 — reminders subscription (consumer: notification-service, Phase 5.2)
  apiVersion: dapr.io/v1alpha1
  kind: Subscription
  metadata:
    name: reminders-subscription
    namespace: default
  spec:
    pubsubname: todoai-pubsub
    topic: reminders
    route: /api/events/reminder
    scopes:
      - notification-service
  ```

- [ ] T025 [P] Create `todo-web-app/k8s/dapr/subscriptions/task-updates-sub.yaml`:
  ```yaml
  # [Task]: T-5.1.4 — task-updates subscription (consumer: todo-frontend, Phase 5.4)
  apiVersion: dapr.io/v1alpha1
  kind: Subscription
  metadata:
    name: task-updates-subscription
    namespace: default
  spec:
    pubsubname: todoai-pubsub
    topic: task-updates
    route: /api/events/task-update
    scopes:
      - todo-frontend
  ```

- [ ] T026 Apply remaining subscriptions:
  ```bash
  kubectl apply -f todo-web-app/k8s/dapr/subscriptions/reminders-sub.yaml
  kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-updates-sub.yaml
  kubectl get subscriptions.dapr.io
  # Should list: task-events-subscription, reminders-subscription, task-updates-subscription
  ```

- [ ] T027 [P] Add `dapr` section to `todo-web-app/k8s/charts/todoai/values.yaml`:
  ```yaml
  # Dapr sidecar injection toggle (set to false for non-Dapr environments, e.g. HF Space)
  dapr:
    enabled: true
    logLevel: "info"
  ```

- [ ] T028 [P] Add Dapr secret placeholders to `todo-web-app/k8s/charts/todoai/secrets.values.yaml.example`:
  ```yaml
  # Dapr secrets (filled in dapr-secrets.yaml separately — not managed by Helm)
  # dapr:
  #   redpandaBootstrapServer: "seed-xxxx.cloud.redpanda.com:9092"
  #   redpandaUsername: "your-username"
  #   redpandaPassword: "your-password"
  ```

- [ ] T029 Final verification — confirm SC-004 retry behaviour: temporarily break broker URL in dapr-secrets and observe `kubectl logs <backend-pod> -c daprd` for retry attempts. Restore correct credentials after.

- [ ] T030 [P] Update `specs/008-dapr-kafka-infra/checklists/requirements.md` — mark all items complete after all smoke tests pass.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: T001–T004)
  └── Phase 2 (Foundational: T005–T007)  ← BLOCKS all story phases
        ├── Phase 3 (US1 — PubSub): T008–T014
        ├── Phase 4 (US2 — Health): T015–T020  ← can start after T014 checkpoint
        ├── Phase 5 (US3 — State): T021–T023   ← can start after T016 (statestore applied)
        └── Phase 6 (Polish): T024–T030         ← after US1+US2 complete
```

### Task-Level Dependencies (within phases)

- **T006** requires T005 (example file must exist before copying)
- **T010** requires T008, T009 (manifests must exist before kubectl apply)
- **T012** requires T011 (annotation must be in template before Helm deploy)
- **T013, T014** require T012 (pod must be running with sidecar)
- **T016** requires T015 (statestore manifest must exist)
- **T018** requires T017 (frontend annotation must be in template before deploy)
- **T019, T020** require T018 (both pods must be redeployed)
- **T021–T023** require T016 (statestore component must be applied)

### Parallel Opportunities

- T003 and T004 — parallel (different files)
- T008 and T009 — parallel (different files, both new)
- T015 and T017 — parallel (different files)
- T024 and T025 — parallel (different files)
- T027 and T028 — parallel (different files)
- T029 and T030 — parallel (independent)

---

## Parallel Example: User Story 1

```bash
# These two manifest files can be created in parallel:
Task T008: "Create todo-web-app/k8s/dapr/pubsub.yaml"
Task T009: "Create todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml"

# Then sequentially:
T010: kubectl apply both
T011: patch backend-deployment.yaml
T012: docker build + helm upgrade
T013: verify 2/2 pods
T014: curl smoke test → 204
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install Dapr CLI + control plane
2. Complete Phase 2: Create and apply `dapr-secrets`
3. Complete Phase 3: `pubsub.yaml` + backend annotation + deploy + smoke test (HTTP 204)
4. **STOP and VALIDATE**: Redpanda connection confirmed ✅
5. Proceed to Phase 4 (operator health dashboard) and Phase 5 (state store)

### Full Delivery (All Stories)

1. Phase 1 → Phase 2 → Phase 3 (US1 MVP) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)
2. Each phase checkpoint validates the story independently before proceeding

---

## Notes

- No application source code is modified in Phase 5.1 — all changes are YAML manifests and Helm template annotations
- `dapr-secrets.yaml` is gitignored; `dapr-secrets.yaml.example` is committed
- Phase 5.2 (Notification Service) will add actual publisher code in `backend/app/` that calls `http://localhost:3500/v1.0/publish/todoai-pubsub/task-events`
- If a pod shows `1/2` after deploy, check `kubectl get pods -n dapr-system` — the sidecar injector must be Running
- Commit after T014 (US1 complete), T020 (US2 complete), T023 (US3 complete)
