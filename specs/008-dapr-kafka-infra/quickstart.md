# Quickstart: Phase 5.1 — Event-Driven Infrastructure (Dapr & Kafka)

**Branch**: `008-dapr-kafka-infra` | **Date**: 2026-03-08

---

## Prerequisites

Before starting, you need:
1. Minikube running (`minikube status` shows Running)
2. Dapr CLI installed
3. Redpanda Cloud account with:
   - Bootstrap server URL (e.g. `seed-xxxx.cloud.redpanda.com:9092`)
   - SASL username
   - SASL password
4. Topics pre-created in Redpanda Cloud: `task-events`, `reminders`, `task-updates`

---

## Step 1: Install Dapr CLI

```bash
# Linux/WSL2
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
dapr --version
# Expected: CLI version: 1.13.x
```

## Step 2: Install Dapr Control Plane into Minikube

```bash
dapr init --kubernetes --wait
# Installs dapr-operator, dapr-sidecar-injector, dapr-placement-server, dapr-scheduler into dapr-system namespace

# Verify
kubectl get pods -n dapr-system
# All pods should be Running/Ready
```

## Step 3: Create `dapr-secrets` Kubernetes Secret

```bash
# Copy example and fill in real values
cp todo-web-app/k8s/dapr/dapr-secrets.yaml.example todo-web-app/k8s/dapr/dapr-secrets.yaml

# Edit dapr-secrets.yaml with your credentials, then apply
kubectl apply -f todo-web-app/k8s/dapr/dapr-secrets.yaml

# Verify (should show keys, not values)
kubectl get secret dapr-secrets -o jsonpath='{.data}' | python3 -m json.tool
```

## Step 4: Apply Dapr Component Manifests

```bash
# PubSub + State Store
kubectl apply -f todo-web-app/k8s/dapr/pubsub.yaml
kubectl apply -f todo-web-app/k8s/dapr/statestore.yaml

# Subscriptions
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/

# Verify components registered
kubectl get components.dapr.io
# Expected: todoai-pubsub, todoai-statestore
```

## Step 5: Rebuild Images & Redeploy with Sidecar Annotations

```bash
eval $(minikube docker-env)

docker build -t todo-backend:local ./todo-web-app/backend/
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  -t todo-frontend:local ./todo-web-app/frontend/

helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

## Step 6: Verify Sidecars

```bash
kubectl get pods
# Both pods should show 2/2 READY (app container + daprd sidecar)

# Check annotations applied
kubectl get pod <backend-pod> -o jsonpath='{.metadata.annotations}' | python3 -m json.tool
# Should include dapr.io/app-id: todo-backend
```

## Step 7: Open Dapr Dashboard

```bash
dapr dashboard -k
# Opens http://localhost:8080
# Components tab: todoai-pubsub ✅, todoai-statestore ✅
# Applications tab: todo-backend ✅, todo-frontend ✅
```

## Step 8: Test Publish (Manual Smoke Test)

```bash
BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $BACKEND_POD -c backend -- \
  curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3500/v1.0/publish/todoai-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"user_id":"smoke-test","task_id":"t-001","action":"created","timestamp":"2026-03-08T00:00:00Z"}'
# Expected output: 204
```

## Step 9: Test State Store (Manual Smoke Test)

```bash
BACKEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')

# Write
kubectl exec -it $BACKEND_POD -c backend -- \
  curl -s -X POST http://localhost:3500/v1.0/state/todoai-statestore \
  -H "Content-Type: application/json" \
  -d '[{"key":"smoke-test","value":"dapr-ok"}]'

# Read
kubectl exec -it $BACKEND_POD -c backend -- \
  curl -s http://localhost:3500/v1.0/state/todoai-statestore/smoke-test
# Expected: "dapr-ok"
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Pod stuck at `0/2` or `1/2` | Dapr sidecar-injector not running | `kubectl get pods -n dapr-system` — check injector pod |
| Component shows red in dashboard | Wrong broker credentials or unreachable bootstrap | Check `kubectl logs -n dapr-system dapr-operator-xxx` |
| Publish returns 500 | `dapr-secrets` not applied or wrong key names | `kubectl describe component todoai-pubsub` for error detail |
| State write fails | Neon DB connection string incorrect or SSL required | Verify `DATABASE_URL` ends with `?sslmode=require` |
| Pods show `2/3` then `2/2` | Dapr init container finishes — this is normal | Wait 30s after pod start |

---

## Gitignore

`todo-web-app/k8s/dapr/dapr-secrets.yaml` is gitignored. Never commit it.
Add to `todo-web-app/k8s/dapr/.gitignore`:
```
dapr-secrets.yaml
```
