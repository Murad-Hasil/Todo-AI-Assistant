# Quickstart: Phase 5.2 — Audit Logs & Statestore Fix

**Branch**: `009-audit-statestore` | **Date**: 2026-03-09

---

## Prerequisites

- Minikube running with Dapr control plane (`kubectl get pods -n dapr-system` → all 1/1)
- Both pods `2/2 Running` (`kubectl get pods`)
- `todoai-pubsub` component healthy (`kubectl get components.dapr.io`)
- Backend submodule: `todo-web-app/backend/` (HF Space git submodule)

---

## Part 1: Statestore Fix (~10 min)

### Step 1 — Update dapr-secrets.yaml
Add `DIRECT_DATABASE_URL` key (non-pooler Neon endpoint):
```bash
# Edit todo-web-app/k8s/dapr/dapr-secrets.yaml
# Add under stringData:
#   DIRECT_DATABASE_URL: "postgresql://neondb_owner:<pass>@ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml
```

### Step 2 — Update statestore.yaml
```bash
# Edit todo-web-app/k8s/dapr/statestore.yaml:
# - Change secretKeyRef.key from STATESTORE_URL to DIRECT_DATABASE_URL
# - Remove disableEntityManagement line (if present)
kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml
```

### Step 3 — Restart backend and verify
```bash
kubectl rollout restart deployment/todoai-backend
kubectl rollout status deployment/todoai-backend
kubectl get pods
# Expected: todoai-backend-* 2/2 Running
dapr dashboard -k
# Expected: todoai-statestore ✅ green in Components tab
```

---

## Part 2: events.py + Backend Integration (~20 min)

### Step 4 — Create app/logic/events.py
New file in the backend submodule. See `contracts/events-contract.md` for the function interface.

### Step 5 — Add httpx to pyproject.toml
```toml
# In [project.dependencies]:
"httpx>=0.27.0",
```
```bash
cd todo-web-app/backend && uv sync
```

### Step 6 — Modify routes/tasks.py
Add `BackgroundTasks` parameter and `background_tasks.add_task(publish_task_event, ...)` after each successful CRUD operation.

### Step 7 — Modify mcp/server.py
Add `publish_task_event(...)` call after each successful tool operation.

### Step 8 — Rebuild and redeploy backend
```bash
eval $(minikube docker-env)
docker build -t todo-backend:local ./todo-web-app/backend/
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
kubectl rollout status deployment/todoai-backend
kubectl get pods
# Expected: 2/2 Running
```

---

## Part 3: Verification (~10 min)

### Step 9 — SC-001: Audit event smoke test
```bash
# Get backend NodePort URL
MINIKUBE_IP=$(minikube ip)

# Create a task (replace TOKEN with a real JWT)
curl -X POST http://$MINIKUBE_IP:30800/api/<user_id>/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Audit test task"}'
# Expected: HTTP 201

# Inspect topic in Redpanda Cloud Console → task-events
# Expected: message with action="created"
```

### Step 10 — SC-002: Dashboard check
```bash
dapr dashboard -k
# Components tab: todoai-pubsub ✅, todoai-statestore ✅
# Applications tab: todo-backend ✅, todo-frontend ✅
```

### Step 11 — SC-003: State persistence
```bash
BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
# Write
kubectl exec $BACKEND_POD -c backend -- python3 -c "
import urllib.request, json
data = json.dumps([{'key':'smoke-test','value':'dapr-ok'}]).encode()
req = urllib.request.Request('http://localhost:3500/v1.0/state/todoai-statestore', data=data, headers={'Content-Type':'application/json'}, method='POST')
print(urllib.request.urlopen(req).status)
"
# Restart
kubectl rollout restart deployment/todoai-backend && kubectl rollout status deployment/todoai-backend
# Read back
BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec $BACKEND_POD -c backend -- python3 -c "
import urllib.request
res = urllib.request.urlopen('http://localhost:3500/v1.0/state/todoai-statestore/smoke-test')
print(res.read())
"
# Expected: b'\"dapr-ok\"'
```

### Step 12 — SC-004: Broker-down resilience
```bash
# Temporarily break broker in dapr-secrets, restart, attempt task CRUD
# Task should succeed (HTTP 201/204), event publish fails silently (ERROR in logs)
# Restore correct broker URL and restart
```

---

## Deploy to HF Space (Production)

```bash
./deploy-backend.sh "feat: Phase 5.2 — audit events + statestore fix"
```

**Note**: Dapr sidecar is not present on HF Space. `events.py` will log `ConnectionRefused` on each publish attempt and silently continue. No user impact.
