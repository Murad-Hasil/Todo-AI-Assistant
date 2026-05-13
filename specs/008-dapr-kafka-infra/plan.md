# Implementation Plan: Phase 5.1 — Event-Driven Infrastructure (Dapr & Kafka)

**Branch**: `008-dapr-kafka-infra` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-dapr-kafka-infra/spec.md`

---

## Summary

Install Dapr control plane into the existing Minikube cluster, create Dapr component manifests (PubSub via Redpanda Cloud Kafka, State Store via Neon PostgreSQL), store all credentials in a Kubernetes Secret (`dapr-secrets`), and patch the existing Helm Deployment templates with Dapr sidecar annotations. No application code is modified in Phase 5.1 — this is purely infrastructure plumbing that unlocks event publishing in Phase 5.2.

---

## Technical Context

**Language/Version**: YAML (Kubernetes manifests), Bash (install scripts)
**Primary Dependencies**: Dapr 1.13+ (control plane + CLI), Helm 3, Minikube 1.32+, pubsub.kafka v1, state.postgresql v1
**Storage**: Neon Serverless PostgreSQL (state store) + Redpanda Cloud (Kafka broker — external managed)
**Testing**: `kubectl get pods -n dapr-system`, `dapr dashboard -k`, `kubectl exec` + curl against sidecar
**Target Platform**: Minikube local K8s cluster (WSL2 Ubuntu 22.04)
**Project Type**: Infrastructure-only (no new application source files)
**Performance Goals**: Sidecar ready within 60s of pod start; publish latency < 2s to broker
**Constraints**: No plaintext credentials in any committed file; Phase 2–4 functionality must be unaffected; `imagePullPolicy: Never` continues
**Scale/Scope**: 2 annotated pods (backend + frontend), 3 Kafka topics, 1 state store, 1 K8s Secret

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Dev | ✅ PASS | Plan directly traces to spec FR-001–FR-012 |
| II. Read-Before-Write | ✅ PASS | Both deployment templates read before annotation plan |
| III. Non-Destructive Integration | ✅ PASS | No Phase 2–4 route handlers or models touched; annotations are additive |
| IV. API-First Architecture | ✅ PASS | No business logic added; Dapr sidecar is infrastructure only |
| V. Multi-User Data Isolation | ✅ PASS | Event payloads must include `user_id` (enforced in Phase 5.2 publisher code) |
| VI. JWT Security Contract | ✅ PASS | No auth changes |
| VII. Monorepo Pattern | ✅ PASS | All manifests under `todo-web-app/k8s/dapr/` per constitution directory layout |
| XII. Event-Driven Architecture | ✅ PASS | This plan establishes the Dapr Pub/Sub layer required by Principle XII |
| XIII. Dapr Sidecar Pattern | ✅ PASS | Both pods annotated; sidecar injection enabled |
| XIV. Infrastructure Abstraction | ✅ PASS | App code uses Dapr HTTP API; no direct Kafka client in application |
| XV. Event Publishing Reliability | ⏳ DEFERRED | Retry logic (3 attempts, exponential backoff) is implemented in Phase 5.2 publisher code, not in infra manifests |

**Gate Decision**: PASS — proceed to design.

---

## Project Structure

### Documentation (this feature)

```text
specs/008-dapr-kafka-infra/
├── spec.md              ✅ Done
├── plan.md              ✅ This file
├── research.md          ✅ Done
├── quickstart.md        → Phase 1 output
├── checklists/
│   └── requirements.md  ✅ Done
└── tasks.md             → Phase 2 output (/sp.tasks)
```

### Source Files (changes this phase)

```text
todo-web-app/
├── k8s/
│   ├── dapr/                              ← NEW directory
│   │   ├── dapr-secrets.yaml.example      ← NEW (example only — real file gitignored)
│   │   ├── pubsub.yaml                    ← NEW Dapr PubSub component
│   │   ├── statestore.yaml                ← NEW Dapr State Store component
│   │   └── subscriptions/
│   │       ├── task-events-sub.yaml       ← NEW Subscription manifest
│   │       ├── reminders-sub.yaml         ← NEW Subscription manifest
│   │       └── task-updates-sub.yaml      ← NEW Subscription manifest
│   └── charts/todoai/
│       ├── templates/
│       │   ├── backend-deployment.yaml    ← PATCH (add Dapr annotations)
│       │   └── frontend-deployment.yaml   ← PATCH (add Dapr annotations)
│       ├── values.yaml                    ← PATCH (add dapr section)
│       └── secrets.values.yaml.example   ← PATCH (add dapr secret placeholders)
```

---

## Phase 1: Design & Contracts

### 1.1 — Kubernetes Secret: `dapr-secrets`

**File**: `todo-web-app/k8s/dapr/dapr-secrets.yaml.example`

This example file is committed. The operator creates the real Secret manually (never committed).

```yaml
# dapr-secrets.yaml.example — copy to dapr-secrets.yaml, fill values, apply manually
# NEVER commit the real dapr-secrets.yaml (add to .gitignore)
apiVersion: v1
kind: Secret
metadata:
  name: dapr-secrets
  namespace: default
type: Opaque
stringData:
  REDPANDA_BOOTSTRAP_SERVER: "seed-xxxx.cloud.redpanda.com:9092"
  REDPANDA_USERNAME: "your-sasl-username"
  REDPANDA_PASSWORD: "your-sasl-password"
  DATABASE_URL: "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
```

**Apply command**:
```bash
kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml
```

---

### 1.2 — Dapr PubSub Component: `pubsub.yaml`

**File**: `todo-web-app/k8s/dapr/pubsub.yaml`

```yaml
# Dapr PubSub Component — Kafka via Redpanda Cloud
# FR-001, FR-002: connects to broker using SASL credentials from dapr-secrets
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

**Topics** (no explicit topic manifest needed — Dapr creates on first publish):
- `task-events` — CRUD audit trail (Phase 5.2 publisher)
- `reminders` — Scheduled alerts (Phase 5.3 MCP tool + Phase 5.2 consumer)
- `task-updates` — Real-time sync (Phase 5.4 frontend consumer)

---

### 1.3 — Dapr State Store Component: `statestore.yaml`

**File**: `todo-web-app/k8s/dapr/statestore.yaml`

```yaml
# Dapr State Store — Neon PostgreSQL
# FR-003: state accessible via sidecar; tables auto-created by Dapr
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

---

### 1.4 — Dapr Subscription Manifests

**File**: `todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml`

```yaml
# Subscription: task-events → todo-backend (Phase 5.2 adds handler code)
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

**File**: `todo-web-app/k8s/dapr/subscriptions/reminders-sub.yaml`

```yaml
# Subscription: reminders → notification-service (Phase 5.2 service)
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

**File**: `todo-web-app/k8s/dapr/subscriptions/task-updates-sub.yaml`

```yaml
# Subscription: task-updates → todo-frontend (Phase 5.4 real-time sync)
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

---

### 1.5 — Helm Template Patches: Dapr Sidecar Annotations

#### Backend Deployment (`backend-deployment.yaml`)

Add to `spec.template.metadata` (existing pod template, after `labels:`):

```yaml
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/log-level: "info"
```

#### Frontend Deployment (`frontend-deployment.yaml`)

Add to `spec.template.metadata` (existing pod template, after `labels:`):

```yaml
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-frontend"
        dapr.io/app-port: "3000"
        dapr.io/log-level: "info"
```

#### values.yaml additions

Add a `dapr` section at the bottom:

```yaml
dapr:
  enabled: true
  logLevel: "info"
```

This allows disabling Dapr injection via `--set dapr.enabled=false` during non-Dapr deployments (e.g., HF Space builds).

> **Note**: The annotations are static in Phase 5.1 (not templated). Helm templating of `dapr.io/enabled` can be added in a later phase if needed.

---

### 1.6 — Network & Service Invocation

In Phase 5.1, services continue to communicate via Kubernetes DNS (existing `BACKEND_URL: http://todoai-backend-svc:8000`). Dapr Service Invocation is available as an alternative path once sidecars are running:

```
http://localhost:3500/v1.0/invoke/todo-backend/method/<path>
```

**Current**: Frontend → `http://todoai-backend-svc:8000/api/...` (direct K8s DNS)
**Dapr alternative** (Phase 5.4+): Frontend → `http://localhost:3500/v1.0/invoke/todo-backend/method/api/...`

No migration of existing calls in Phase 5.1 — Dapr Service Invocation is additive.

---

### 1.7 — Security & Secrets Summary

| Secret name | Namespace | Keys | Used by |
|-------------|-----------|------|---------|
| `dapr-secrets` | `default` | `REDPANDA_BOOTSTRAP_SERVER`, `REDPANDA_USERNAME`, `REDPANDA_PASSWORD`, `DATABASE_URL` | Dapr components (`pubsub.yaml`, `statestore.yaml`) |
| `todoai-backend-secret` | `default` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GROQ_API_KEY`, `CORS_ORIGINS` | App containers (unchanged from Phase 4) |

**Gitignore rule** (add to `todo-web-app/k8s/dapr/.gitignore`):
```
dapr-secrets.yaml
```

---

## Verification Plan

### Step 1: Install Dapr Control Plane

```bash
# Install Dapr CLI (if not present)
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Install Dapr into Minikube cluster
dapr init --kubernetes --wait

# Verify control plane pods
kubectl get pods -n dapr-system
# Expected: dapr-operator, dapr-sidecar-injector, dapr-placement-server, dapr-scheduler-server — all Running
```

### Step 2: Apply `dapr-secrets` and Component Manifests

```bash
# 1. Fill in dapr-secrets.yaml from the example (never commit)
cp todo-web-app/k8s/dapr/dapr-secrets.yaml.example todo-web-app/k8s/dapr/dapr-secrets.yaml
# Edit the file with real credentials, then:
kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml

# 2. Apply Dapr components
kubectl apply -f todo-web-app/k8s/dapr/pubsub.yaml
kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/
```

### Step 3: Rebuild and Redeploy with Sidecar Annotations

```bash
eval $(minikube docker-env)
docker build -t todo-backend:local ./todo-web-app/backend/
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t todo-frontend:local ./todo-web-app/frontend/

helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

### Step 4: Verify Sidecars Running (SC-001)

```bash
kubectl get pods
# Expected: both pods show 3/3 READY (app + daprd + dapr-init)
# Actually after init completes: 2/2 READY (app + daprd)

kubectl describe pod <backend-pod-name> | grep dapr
# Should show: dapr.io/enabled=true, dapr.io/app-id=todo-backend
```

### Step 5: Dapr Dashboard (SC-001, SC-002)

```bash
dapr dashboard -k
# Opens browser at http://localhost:8080
# Check: Components tab → todoai-pubsub (green), todoai-statestore (green)
# Check: Applications tab → todo-backend, todo-frontend registered
```

### Step 6: Manual Publish Test (SC-002)

```bash
# Exec into backend pod
kubectl exec -it <backend-pod-name> -c backend -- /bin/sh

# Inside the pod — publish a test event to task-events topic
curl -X POST http://localhost:3500/v1.0/publish/todoai-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user","task_id":"test-123","action":"created","timestamp":"2026-03-08T00:00:00Z"}'
# Expected: HTTP 204 No Content (Dapr accepted the publish)
```

### Step 7: State Store Test (SC-003)

```bash
# Inside the backend pod
# Write
curl -X POST http://localhost:3500/v1.0/state/todoai-statestore \
  -H "Content-Type: application/json" \
  -d '[{"key":"test-key","value":"hello-dapr"}]'

# Read back
curl http://localhost:3500/v1.0/state/todoai-statestore/test-key
# Expected: "hello-dapr"
```

---

## Complexity Tracking

> No constitution violations. All principles respected.

| Concern | Decision | Justification |
|---------|----------|---------------|
| `dapr-secrets` duplicates `DATABASE_URL` from `todoai-backend-secret` | Accept duplication | Dapr components reference secrets by name; they cannot cross-reference app secrets. Acceptable for local dev. |
| Subscription manifests deploy before consumer handlers exist | Accept | Phase 5.1 establishes infrastructure; handlers are Phase 5.2. Dapr handles undeliverable events gracefully (no consumer = no delivery attempt). |

---

## Artifacts Produced

| Artifact | Path | Status |
|----------|------|--------|
| Spec | `specs/008-dapr-kafka-infra/spec.md` | ✅ |
| Research | `specs/008-dapr-kafka-infra/research.md` | ✅ |
| Plan | `specs/008-dapr-kafka-infra/plan.md` | ✅ This file |
| Quickstart | `specs/008-dapr-kafka-infra/quickstart.md` | → Next |
| Tasks | `specs/008-dapr-kafka-infra/tasks.md` | → `/sp.tasks` |
