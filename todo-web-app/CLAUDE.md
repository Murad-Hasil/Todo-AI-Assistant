# Todo Web App — Monorepo Agent Context

**Phase**: 2 (Full-Stack Web Application)
**Constitution**: `.specify/memory/constitution.md` v2.0.0
**Last Updated**: 2026-03-03

## Monorepo Structure

```
todo-web-app/
├── CLAUDE.md           # This file — root context
├── backend/
│   ├── CLAUDE.md       # Backend-specific context
│   └── app/            # FastAPI service
└── frontend/           # Next.js 14+ (Phase 2.3)
    └── CLAUDE.md       # Frontend-specific context (TBD)
```

## Active Phase: 2.1 — Backend API & Database

- Backend: FastAPI + SQLModel + Neon PostgreSQL
- Auth: Better Auth (frontend, Phase 2.3) + JWT stub (backend, Phase 2.1)
- Specs: `specs/002-backend-api-db/`

## Non-Negotiable Rules (Constitution v2.0.0)

1. No code without spec reference (`@specs/features/`, `@specs/api/`, `@specs/database/`)
2. Read frontend AND backend before modifying shared concerns
3. Phase 3 integration MUST NOT require rewriting CRUD or auth logic
4. All backend via `/api/` prefix; Pydantic for all I/O
5. Every query scoped to `user_id` — cross-user access is a critical violation
6. JWT from `Authorization: Bearer` only; stub active in Phase 2.1

## Phase 4: Local Kubernetes Deployment (007-local-k8s-deploy)

### Quick Deploy (3 commands)

```bash
# 1. Build images into Minikube's Docker daemon
eval $(minikube docker-env) && \
  docker build -t todo-backend:local ./todo-web-app/backend/ && \
  docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 \
    -t todo-frontend:local ./todo-web-app/frontend/

# 2. Deploy with Helm (copy secrets.values.yaml.example → secrets.values.yaml first)
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml

# 3. Open in browser
minikube service todoai-frontend
```

### K8s Infrastructure

- Helm chart: `todo-web-app/k8s/charts/todoai/` (single chart, 6 templates)
- Backend NodePort: `http://$(minikube ip):30800` (Service: `todoai-backend-svc`)
- Frontend NodePort: `http://$(minikube ip):30300` (Service: `todoai-frontend`)
- Secrets: `todo-web-app/k8s/charts/todoai/secrets.values.yaml` (gitignored — never commit)
- Example: `todo-web-app/k8s/charts/todoai/secrets.values.yaml.example`

### Active Technologies (Phase 4)

- Docker multi-stage builds: `python:3.13-slim` (backend), `node:20-alpine` (frontend)
- Helm 3, Minikube 1.32+, `imagePullPolicy: Never` (local images only)
- `NEXT_PUBLIC_API_URL` baked at build time via `--build-arg`
- `CORS_ORIGINS` injected at runtime via Kubernetes Secret

## Phase 5.3: Event-Driven Notification Service (010-notification-service)

### Quick Deploy (notification service)

```bash
# 1. Build notification image into Minikube's Docker daemon
eval $(minikube docker-env)
docker build -t todo-notification:local ./todo-web-app/services/notification/

# 2. Apply Dapr subscription manifest
kubectl apply -f todo-web-app/k8s/dapr/subscription-reminders.yaml

# 3. Deploy with Helm (adds notification deployment + service)
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml

# 4. Verify all 3 pods running (backend 2/2, frontend 2/2, notification 2/2)
kubectl get pods
```

### Microservice Log Commands

```bash
# Follow notification service logs (reminder delivery):
kubectl logs -f -l app.kubernetes.io/name=todoai-notification -c notification

# Follow backend logs (reminder publish events):
kubectl logs -f -l app.kubernetes.io/name=todoai-backend -c backend

# Check all pod statuses:
kubectl get pods -o wide

# Verify Dapr subscription:
kubectl get subscriptions.dapr.io

# End-to-end reminder smoke test (direct Dapr publish):
BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
import urllib.request, json
payload = json.dumps({
    'action': 'reminder',
    'task_id': 'e2e-test-001',
    'task_title': 'remind me to buy milk',
    'user_id': 'test-user',
    'timestamp': '2026-03-09T04:00:00+00:00'
}).encode()
req = urllib.request.Request(
    'http://localhost:3500/v1.0/publish/todoai-pubsub/reminders',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print('Published:', urllib.request.urlopen(req, timeout=10).status)
"

# Isolation test (US2 — scale down and recover):
kubectl scale deployment/todoai-notification --replicas=0
# ... create reminder tasks ...
kubectl scale deployment/todoai-notification --replicas=1
kubectl rollout status deployment/todoai-notification
kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification | grep REMINDER
```

### Notification Service Structure

```
todo-web-app/services/notification/
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI app — POST /on-reminder, GET /healthz
├── Dockerfile           # multi-stage python:3.13-slim, port 8080
└── pyproject.toml       # fastapi>=0.115.0, uvicorn[standard]>=0.30.0
```

### Keyword Trigger (backend routes/tasks.py)

- Keywords: `["remind me", "alert"]` — case-insensitive substring match in task title
- On match: `publish_reminder_event()` fired as BackgroundTask → Dapr sidecar → Kafka `reminders` topic
- Notification service subscribes via `todo-web-app/k8s/dapr/subscription-reminders.yaml`
- Dapr app-id: `todo-notification-service`
