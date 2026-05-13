# Quickstart: Phase 5.3 — Event-Driven Notification Service

**Branch**: `010-notification-service`
**Date**: 2026-03-09

---

## Prerequisites

- Phase 5.1 complete: Dapr running in cluster, `todoai-pubsub` component applied, `reminders` topic exists in Redpanda Cloud
- Phase 5.2 complete: `events.py` in backend, both pods 2/2 Running
- Minikube running: `minikube status`

---

## Step 1: Create the Notification Service

```bash
mkdir -p todo-web-app/services/notification/app
```

**`todo-web-app/services/notification/app/main.py`**:
```python
"""
Notification Service — Phase 5.3
Dapr subscriber for the reminders topic.
"""
import logging
from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="todo-notification-service")

@app.post("/on-reminder")
async def on_reminder(request: Request):
    body = await request.json()
    payload = body.get("data", body)  # unwrap CloudEvents envelope

    task_title = payload.get("task_title", "")
    user_id = payload.get("user_id", "")

    if not task_title or not user_id:
        logger.warning("on_reminder: missing task_title or user_id — skipping")
        return {}  # always 200 to prevent Dapr retry storm

    logger.info("[REMINDER]: Hey User %s, your task \"%s\" is due now!", user_id, task_title)

    # Placeholder: future Email/Push integration here
    # await send_email(user_id, task_title)

    return {}

@app.get("/healthz")
def health():
    return {"status": "ok"}
```

---

## Step 2: Add pyproject.toml and Dockerfile

**`todo-web-app/services/notification/pyproject.toml`**:
```toml
[project]
name = "todo-notification-service"
version = "1.0.0"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**`todo-web-app/services/notification/Dockerfile`**:
```dockerfile
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system -e .

FROM python:3.13-slim AS runner
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.13 /usr/local/lib/python3.13
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY app/ ./app/
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## Step 3: Add Dapr Subscription Manifest

**`todo-web-app/k8s/dapr/subscription-reminders.yaml`**:
```yaml
apiVersion: dapr.io/v2alpha1
kind: Subscription
metadata:
  name: reminders-subscription
  namespace: default
spec:
  pubsubname: todoai-pubsub
  topic: reminders
  routes:
    default: /on-reminder
scopes:
  - todo-notification-service
auth:
  secretStore: kubernetes
```

```bash
kubectl apply -f todo-web-app/k8s/dapr/subscription-reminders.yaml
```

---

## Step 4: Add Helm Templates

Add to `todo-web-app/k8s/charts/todoai/templates/`:

- `notification-deployment.yaml` — Deployment with Dapr sidecar annotations
- `notification-service.yaml` — ClusterIP Service (no external port needed)

---

## Step 5: Extend events.py — Add publish_reminder_event

```python
# todo-web-app/backend/app/logic/events.py
_DAPR_REMINDER_URL = "http://localhost:3500/v1.0/publish/todoai-pubsub/reminders"

def publish_reminder_event(task_id: str, task_title: str, user_id: str) -> None:
    """Publish a reminder event to the reminders topic. Fire-and-forget."""
    payload = {
        "action": "reminder",
        "task_id": task_id,
        "task_title": task_title,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    # Same retry loop as publish_task_event (3 attempts, exponential backoff)
    ...
```

---

## Step 6: Wire Keyword Trigger in routes/tasks.py

```python
# In create_task route — after op_create_task:
from app.logic.events import publish_reminder_event

_REMINDER_KEYWORDS = ["remind me", "alert"]

if any(kw in body.title.lower() for kw in _REMINDER_KEYWORDS):
    background_tasks.add_task(
        publish_reminder_event,
        str(task.id),
        task.title,
        user_id,
    )
```

---

## Step 7: Build, Deploy, Verify

```bash
# Build notification image
eval $(minikube docker-env)
docker build -t todo-notification:local todo-web-app/services/notification/

# Rebuild backend (events.py + routes change)
docker build -t todo-backend:local todo-web-app/backend/

# Deploy
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml

# Verify all pods
kubectl get pods
# Expected: todoai-backend 2/2, todoai-frontend 2/2, todoai-notification 2/2

# Follow notification logs
kubectl logs -f -l app.kubernetes.io/name=todoai-notification -c notification

# In another terminal — create a reminder task
curl -X POST http://$(minikube ip):30800/api/<USER_ID>/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "remind me to call doctor"}'

# Expected in notification logs within 5 seconds:
# INFO: [REMINDER]: Hey User <USER_ID>, your task "remind me to call doctor" is due now!
```
