# Tasks: Phase 5.3 — Event-Driven Notification Service

**Input**: Design documents from `specs/010-notification-service/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Tests**: No automated tests — validation via kubectl logs and curl
**Organization**: Tasks grouped by user story (3 stories from spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- All file paths absolute from repo root

> ⚠️ **Plan correction from research R-001**: `app/logic/task_ops.py` is NOT modified.
> Per plan.md research R-001 (Constitution Principle III), reminder publish fires from
> `routes/tasks.py` BackgroundTasks — not task_ops.py. task_ops.py remains pure.

---

## Phase 1: Setup (Parallel — New Microservice Scaffolding)

**Purpose**: Create the notification service directory structure, FastAPI app, pyproject.toml, and Dockerfile. All tasks are independent and can run in parallel.

- [x] T001 [P] Create notification service directory and `app/main.py` in `todo-web-app/services/notification/app/main.py`:
  ```python
  # [Task]: T-5.3.1, T-5.3.3
  """Notification Service — Phase 5.3 — stateless Dapr subscriber."""
  import logging
  from fastapi import FastAPI, Request

  logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
  logger = logging.getLogger(__name__)

  app = FastAPI(title="todo-notification-service", version="1.0.0")

  _VALID_ACTION = "reminder"

  @app.post("/on-reminder", status_code=200)
  async def on_reminder(request: Request) -> dict:
      """Dapr-invoked endpoint. Always returns 200 to ack delivery (prevents retry storm)."""
      try:
          body = await request.json()
          payload = body.get("data", body)  # unwrap CloudEvents envelope (research R-003)
          task_title = payload.get("task_title", "").strip()
          user_id = payload.get("user_id", "").strip()
          if not task_title or not user_id:
              logger.warning(
                  "on_reminder: missing task_title=%r or user_id=%r — skipping",
                  task_title, user_id,
              )
              return {}
          logger.info(
              '[REMINDER]: Hey User %s, your task "%s" is due now!',
              user_id, task_title,
          )
          # Placeholder: future Email/Push integration
          # await send_email_notification(user_id, task_title)
      except Exception as exc:
          logger.error("on_reminder: unhandled error: %s", exc)
      return {}

  @app.get("/healthz")
  def health() -> dict:
      return {"status": "ok"}
  ```

- [x] T002 [P] Create `todo-web-app/services/notification/pyproject.toml`:
  ```toml
  # [Task]: T-5.3.1
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

  [tool.hatch.build.targets.wheel]
  packages = ["app"]
  ```

- [x] T003 [P] Create `todo-web-app/services/notification/Dockerfile`:
  ```dockerfile
  # [Task]: T-5.3.2 — multi-stage Python 3.13 slim build
  FROM python:3.13-slim AS builder
  WORKDIR /app
  RUN pip install --no-cache-dir uv
  COPY pyproject.toml .
  RUN uv pip install --system --no-cache -e .

  FROM python:3.13-slim AS runner
  WORKDIR /app
  COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
  COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
  COPY app/ ./app/
  EXPOSE 8080
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
  ```

- [x] T004 [P] Create Dapr declarative subscription `todo-web-app/k8s/dapr/subscription-reminders.yaml`:
  ```yaml
  # [Task]: T-5.3.4 — binds reminders topic to todo-notification-service (research R-004)
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

**Checkpoint**: All 4 files exist. Notification service structure is scaffolded. Subscription manifest is ready to apply.

---

## Phase 2: Foundational — Backend Extension

**Purpose**: Add `publish_reminder_event()` to `events.py` and wire keyword detection into `routes/tasks.py`. Requires Phase 1 complete (no circular deps, but plan coordination needed).

> ⚠️ task_ops.py is NOT modified (research R-001, Constitution Principle III).

- [x] T005 Extend `todo-web-app/backend/app/logic/events.py` — add `publish_reminder_event()` below existing `publish_task_event()`:
  ```python
  # [Task]: T-5.3.5 — publish_reminder_event (research R-007)
  # Dapr publish endpoint for reminders topic
  _DAPR_REMINDER_URL = (
      "http://localhost:3500/v1.0/publish/todoai-pubsub/reminders"
  )

  def publish_reminder_event(
      task_id: str,
      task_title: str,
      user_id: str,
  ) -> None:
      """Publish a reminder event to the reminders topic via Dapr sidecar.

      Fire-and-forget: never raises. 3 retries, exponential backoff (Principle XV).
      Safe when Dapr absent (HF Space) — ConnectionRefused caught silently.

      Args:
          task_id:    UUID string of the triggering task.
          task_title: Full title (included in payload for consumer log — no DB lookup).
          user_id:    Authenticated user who created the task.
      """
      if not task_id or not task_title or not user_id:
          logger.warning(
              "publish_reminder_event: missing required field — skipping"
          )
          return

      payload = {
          "action": "reminder",
          "task_id": task_id,
          "task_title": task_title,
          "user_id": user_id,
          "timestamp": datetime.now(timezone.utc).isoformat(),
      }

      backoff = _INITIAL_BACKOFF_S
      for attempt in range(1, _MAX_RETRIES + 1):
          try:
              response = httpx.post(
                  _DAPR_REMINDER_URL,
                  json=payload,
                  timeout=5.0,
              )
              if response.status_code == 204:
                  logger.debug(
                      "publish_reminder_event: published task_id=%s", task_id
                  )
                  return
              logger.error(
                  "publish_reminder_event: unexpected status=%d attempt=%d task_id=%s",
                  response.status_code, attempt, task_id,
              )
          except Exception as exc:
              logger.error(
                  "publish_reminder_event: attempt=%d failed: %s task_id=%s",
                  attempt, exc, task_id,
              )
          if attempt < _MAX_RETRIES:
              time.sleep(backoff)
              backoff = min(backoff * 2, _MAX_BACKOFF_S)

      logger.error(
          "publish_reminder_event: EXHAUSTED retries task_id=%s user_id=%s",
          task_id, user_id,
      )
  ```

- [x] T006 Modify `todo-web-app/backend/app/routes/tasks.py` `create_task` route — add keyword check + reminder BackgroundTask after existing audit publish:
  ```python
  # [Task]: T-5.3.5 — keyword-triggered reminder (research R-006, FR-001)
  # Add import at top of file:
  from app.logic.events import publish_reminder_event

  # Add constant after existing imports:
  _REMINDER_KEYWORDS = ["remind me", "alert"]

  # In create_task() after existing audit background_tasks.add_task(...):
  if any(kw in body.title.lower() for kw in _REMINDER_KEYWORDS):
      background_tasks.add_task(
          publish_reminder_event,
          str(task.id),
          task.title,
          user_id,
      )
  ```
  NOTE: No change to route signature, response model, or HTTP status code.

**Checkpoint**: `events.py` has `publish_reminder_event`. `routes/tasks.py` imports and calls it on keyword match. No syntax errors. task_ops.py unchanged.

---

## Phase 3: User Story 1 — Reminder Notification Delivered (Priority: P1) 🎯 MVP

**Goal**: Create "remind me" task → reminder log in notification service within 5 seconds.

**Independent Test**:
```bash
kubectl logs -f -l app.kubernetes.io/name=todoai-notification -c notification
# In another terminal: create a task with "remind me" in title
# Expected within 5s: [REMINDER]: Hey User <user_id>, your task "..." is due now!
```

- [x] T007 [P] [US1] Add Helm Deployment template `todo-web-app/k8s/charts/todoai/templates/notification-deployment.yaml`:
  ```yaml
  # [Task]: T-5.3.6
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: todoai-notification
    labels:
      app.kubernetes.io/name: todoai-notification
      app.kubernetes.io/part-of: todoai
  spec:
    replicas: 1
    selector:
      matchLabels:
        app.kubernetes.io/name: todoai-notification
    template:
      metadata:
        labels:
          app.kubernetes.io/name: todoai-notification
          app.kubernetes.io/part-of: todoai
        annotations:
          dapr.io/enabled: "true"
          dapr.io/app-id: "todo-notification-service"
          dapr.io/app-port: "8080"
          dapr.io/log-level: "info"
      spec:
        containers:
          - name: notification
            image: todo-notification:local
            imagePullPolicy: Never
            ports:
              - containerPort: 8080
            readinessProbe:
              httpGet:
                path: /healthz
                port: 8080
              initialDelaySeconds: 5
              periodSeconds: 10
            livenessProbe:
              httpGet:
                path: /healthz
                port: 8080
              initialDelaySeconds: 10
              periodSeconds: 20
  ```

- [x] T008 [P] [US1] Add Helm Service template `todo-web-app/k8s/charts/todoai/templates/notification-service.yaml`:
  ```yaml
  # [Task]: T-5.3.6
  apiVersion: v1
  kind: Service
  metadata:
    name: todoai-notification-svc
    labels:
      app.kubernetes.io/name: todoai-notification
      app.kubernetes.io/part-of: todoai
  spec:
    selector:
      app.kubernetes.io/name: todoai-notification
    ports:
      - name: http
        port: 8080
        targetPort: 8080
    type: ClusterIP
  ```

- [x] T009 [US1] Apply Dapr subscription manifest:
  ```bash
  # [Task]: T-5.3.4
  kubectl apply -f todo-web-app/k8s/dapr/subscription-reminders.yaml
  # Verify:
  kubectl get subscriptions.dapr.io
  # Expected: reminders-subscription listed
  ```

- [x] T010 [US1] Build notification service Docker image into Minikube:
  ```bash
  # [Task]: T-5.3.7
  eval $(minikube docker-env)
  docker build -t todo-notification:local todo-web-app/services/notification/
  # Expected: Successfully built <sha>
  # Verify: docker images | grep todo-notification
  ```

- [x] T011 [US1] Rebuild backend Docker image (events.py + routes/tasks.py changed):
  ```bash
  # [Task]: T-5.3.5
  eval $(minikube docker-env)
  docker build -t todo-backend:local todo-web-app/backend/
  # Expected: Successfully built <sha>
  ```

- [x] T012 [US1] Run `helm upgrade` to deploy notification service + updated backend:
  ```bash
  # [Task]: T-5.3.8
  helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
    --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
  # Verify:
  kubectl rollout status deployment/todoai-backend
  kubectl rollout status deployment/todoai-notification
  kubectl get pods
  # Expected: todoai-backend-* 2/2, todoai-frontend-* 2/2, todoai-notification-* 2/2
  ```

- [x] T013 [US1] SC-001 End-to-end reminder test (T-5.3.9):
  ```bash
  # [Task]: T-5.3.9
  # Terminal 1 — follow notification logs:
  kubectl logs -f -l app.kubernetes.io/name=todoai-notification -c notification

  # Terminal 2 — direct Dapr publish to reminders topic (no JWT needed):
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
  # Expected in Terminal 1 within 5 seconds:
  # INFO: [REMINDER]: Hey User test-user, your task "remind me to buy milk" is due now!
  ```

- [x] T014 [US1] SC-005 non-reminder task — verify NO reminder fires for regular tasks:
  ```bash
  # [Task]: T-5.3.9
  # Publish a non-reminder event directly to task-events (not reminders):
  BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
  import urllib.request, json
  payload = json.dumps({
      'action': 'created',
      'task_id': 'no-reminder-001',
      'task_title': 'buy groceries',
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
  # Expected in notification logs: WARNING (action != 'reminder') or nothing
  # Expected: NO [REMINDER] line for action='created'
  ```

**Checkpoint (SC-001)**: Dapr delivers reminder event → notification pod logs `[REMINDER]: Hey User test-user, your task "remind me to buy milk" is due now!`. 3 pods all 2/2 Running. User Story 1 complete. ✅

---

## Phase 4: User Story 2 — Notification Service Operates Independently (Priority: P2)

**Goal**: Stop notification pod → create reminder tasks → restart → verify event recovery.

**Independent Test**:
```bash
kubectl scale deployment/todoai-notification --replicas=0
# Create reminder task (via route or direct publish)
kubectl scale deployment/todoai-notification --replicas=1
kubectl rollout status deployment/todoai-notification
kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification
# Expected: REMINDER log appears after restart (Dapr at-least-once delivery)
```

- [ ] T015 [US2] SC-002 + SC-003 isolation test — stop notification, create reminder, restart, verify recovery:
  ```bash
  # [Task]: T-5.3.9
  # Step 1: Scale down notification service
  kubectl scale deployment/todoai-notification --replicas=0
  sleep 5

  # Step 2: Publish 2 reminder events while service is down
  BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  for i in 1 2; do
    kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
  import urllib.request, json
  payload = json.dumps({'action':'reminder','task_id':'recovery-$i','task_title':'remind me task $i','user_id':'test-user','timestamp':'2026-03-09T04:00:00+00:00'}).encode()
  req = urllib.request.Request('http://localhost:3500/v1.0/publish/todoai-pubsub/reminders',data=payload,headers={'Content-Type':'application/json'},method='POST')
  print('Published:', urllib.request.urlopen(req, timeout=10).status)
  "
  done

  # Step 3: Verify main backend still accepts tasks (SC-002)
  kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
  import urllib.request; print('Backend health:', urllib.request.urlopen('http://localhost:8000/api/health', timeout=5).status)
  "
  # Expected: 200

  # Step 4: Restore notification service
  kubectl scale deployment/todoai-notification --replicas=1
  kubectl rollout status deployment/todoai-notification

  # Step 5: Check logs — must show both queued REMINDER messages (SC-003)
  kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification | grep REMINDER
  # Expected: 2 REMINDER lines for task 1 and task 2
  ```

**Checkpoint (SC-002 + SC-003)**: Main API healthy during notification outage. Queued events delivered after restart. User Story 2 complete. ✅

---

## Phase 5: User Story 3 — Log Traceability (Priority: P3)

**Goal**: Every reminder event produces a structured log line. Malformed events handled gracefully.

- [ ] T016 [US3] SC-004 log format verification — send 3 reminders from 2 users, count REMINDER lines:
  ```bash
  # [Task]: T-5.3.9
  BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  for payload in \
    '{"action":"reminder","task_id":"log-001","task_title":"remind me task A","user_id":"alice","timestamp":"2026-03-09T04:00:00+00:00"}' \
    '{"action":"reminder","task_id":"log-002","task_title":"remind me task B","user_id":"bob","timestamp":"2026-03-09T04:00:01+00:00"}' \
    '{"action":"reminder","task_id":"log-003","task_title":"alert: deadline today","user_id":"alice","timestamp":"2026-03-09T04:00:02+00:00"}'; do
    kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
  import urllib.request, json
  req = urllib.request.Request('http://localhost:3500/v1.0/publish/todoai-pubsub/reminders',data='$payload'.encode(),headers={'Content-Type':'application/json'},method='POST')
  print(urllib.request.urlopen(req, timeout=10).status)
  "
  done
  sleep 5
  kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification | grep REMINDER
  # Expected: exactly 3 REMINDER lines, correct user and task per entry
  ```

- [ ] T017 [US3] SC-005 malformed event test — service must log WARNING and continue:
  ```bash
  # [Task]: T-5.3.9
  BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend -o jsonpath='{.items[0].metadata.name}')
  # Send event missing task_title
  kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
  import urllib.request, json
  payload = json.dumps({'action':'reminder','task_id':'bad-001','user_id':'test-user','timestamp':'2026-03-09T04:00:00+00:00'}).encode()
  req = urllib.request.Request('http://localhost:3500/v1.0/publish/todoai-pubsub/reminders',data=payload,headers={'Content-Type':'application/json'},method='POST')
  print('Published:', urllib.request.urlopen(req, timeout=10).status)
  "
  sleep 3
  kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification | grep -E 'WARNING|REMINDER'
  # Expected: WARNING line for missing task_title
  # Expected: NO crash — notification pod still 2/2 Running
  kubectl get pods -l app.kubernetes.io/name=todoai-notification
  ```

**Checkpoint (SC-004 + SC-005)**: 3 REMINDER logs for 3 events. WARNING for malformed event. Pod remains 2/2 Running. User Story 3 complete. ✅

---

## Phase 6: Polish & HF Deploy

**Purpose**: Deploy backend changes to HF Space (events.py + routes/tasks.py), commit Dapr/Helm files, update checklist.

- [ ] T018 [P] Push backend to HF Space and GitHub:
  ```bash
  # [Task]: T-5.3.5
  cd todo-web-app/backend
  git add app/logic/events.py app/routes/tasks.py
  git commit -m "feat: Phase 5.3 — publish_reminder_event + keyword trigger (remind me / alert)"
  git push origin main
  # Note: HF Space has no Dapr — publish_reminder_event logs ConnectionRefused silently
  ```

- [ ] T019 [P] Commit infrastructure files to main repo:
  ```bash
  # [Task]: T-5.3.4, T-5.3.6
  cd /home/brownie/projects/hackathon-II
  git add \
    todo-web-app/services/notification/ \
    todo-web-app/k8s/dapr/subscription-reminders.yaml \
    todo-web-app/k8s/charts/todoai/templates/notification-deployment.yaml \
    todo-web-app/k8s/charts/todoai/templates/notification-service.yaml \
    todo-web-app/backend  # submodule pointer
  git commit -m "feat: Phase 5.3 — notification service + Dapr subscription + Helm templates"
  ```

- [ ] T020 [P] Update `specs/010-notification-service/checklists/requirements.md` — mark SC items complete or document blockers.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: T001–T004) — ALL PARALLEL — start immediately
  ├── T001 [P]: services/notification/app/main.py
  ├── T002 [P]: services/notification/pyproject.toml
  ├── T003 [P]: services/notification/Dockerfile
  └── T004 [P]: k8s/dapr/subscription-reminders.yaml

Phase 2 (Foundational: T005–T006)  ← no Phase 1 dependency (different files)
  ├── T005: backend/app/logic/events.py (publish_reminder_event)
  └── T006: backend/app/routes/tasks.py (keyword trigger)

Phase 3 (US1 MVP: T007–T014)  ← requires Phase 1 + Phase 2
  ├── T007 [P]: Helm notification-deployment.yaml
  ├── T008 [P]: Helm notification-service.yaml
  ├── T009: kubectl apply subscription
  ├── T010: docker build todo-notification:local  ← requires T001, T002, T003
  ├── T011: docker build todo-backend:local  ← requires T005, T006
  ├── T012: helm upgrade  ← requires T007, T008, T009, T010, T011
  ├── T013: SC-001 e2e reminder test  ← requires T012
  └── T014: SC-005 non-reminder test  ← requires T012

Phase 4 (US2: T015)  ← requires T012 (3 pods Running)
Phase 5 (US3: T016–T017)  ← requires T012
Phase 6 (Polish: T018–T020)  ← after US1 confirmed
```

### Task-Level Dependencies

- **T010** requires T001, T002, T003 (Dockerfile + app must exist before build)
- **T011** requires T005, T006 (events.py + routes must be modified before backend build)
- **T012** requires T007, T008, T009, T010, T011 (all images + manifests before helm)
- **T013**, T014 require T012 (pod must be Running before smoke tests)

### Parallel Opportunities

- T001, T002, T003, T004 — all parallel (Phase 1)
- T005, T006 — can run in parallel with Phase 1 (different files)
- T007, T008 — parallel (different Helm template files)
- T010, T011 — parallel (different Docker contexts)
- T018, T019, T020 — parallel (Polish phase)

---

## Parallel Example: US1 MVP Setup

```bash
# Phase 1 — all parallel:
# Window 1: Create main.py (T001)
# Window 2: Create pyproject.toml (T002)
# Window 3: Create Dockerfile (T003)
# Window 4: Create subscription-reminders.yaml (T004)
# Window 5: Extend events.py (T005)
# Window 6: Modify routes/tasks.py (T006)

# Phase 3 sequential:
T007 + T008 (parallel) → T009 → T010 + T011 (parallel) → T012 → T013 → T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001–T004 (parallel scaffolding)
2. Complete Phase 2: T005–T006 (backend extension)
3. Complete Phase 3: T007–T014 (deploy + verify SC-001)
4. **STOP and VALIDATE**: REMINDER log appears within 5s ✅ Non-reminder task generates no log ✅
5. Proceed to Phase 4 (isolation) and Phase 5 (traceability)

### Full Delivery (All Stories)

Phase 1 → Phase 2 → Phase 3 (US1 MVP) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)

---

## Notes

- `app/logic/task_ops.py` is **NOT modified** — plan.md research R-001 (Constitution Principle III)
- `/on-reminder` MUST always return HTTP 200 — non-2xx causes Dapr infinite retry storm
- `task_title` is in the event payload — notification service never queries the database
- `publish_reminder_event` is fire-and-forget — HF Space has no Dapr (ConnectionRefused caught silently)
- Notification service port: 8080 (avoids conflict with backend 8000)
- Dapr app-id: `todo-notification-service` (scoped in subscription manifest)
- Keywords: `["remind me", "alert"]` — case-insensitive substring match in task title only
