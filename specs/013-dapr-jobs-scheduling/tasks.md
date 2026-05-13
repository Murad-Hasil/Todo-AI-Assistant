# Tasks: Phase 5.5 — Intelligent Scheduling with Dapr Jobs API

**Branch**: `013-dapr-jobs-scheduling` | **Date**: 2026-04-02
**Input**: `specs/013-dapr-jobs-scheduling/` (plan.md + spec.md + data-model.md + contracts/)
**Spec refs**: FR-001–FR-021 | **Constitution**: Principles I, IV–VI, X–XVII

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US#]**: Maps to User Story in spec.md (US1=P1, US2=P2, US3=P3, US4=P4)
- All paths relative to `todo-web-app/`

---

## Phase 1: Setup & Verification

**Purpose**: Confirm infrastructure prerequisites are satisfied before any code is written.

- [ ] T-5.5.2 Verify `dapr-secrets` K8s secret contains `DIRECT_DATABASE_URL` key (non-pooler Neon endpoint) via `kubectl get secret dapr-secrets -o jsonpath="{.data.DIRECT_DATABASE_URL}" | base64 -d` and confirm URL contains `.neon.tech` without `-pooler` in hostname
- [ ] T-5.5.0 Verify `dapr-scheduler-server` pod is Running in `dapr-system` namespace via `kubectl get pods -n dapr-system | grep scheduler`; if missing, run `helm upgrade dapr dapr/dapr -n dapr-system` before proceeding

**Checkpoint ✅**: Both `DIRECT_DATABASE_URL` confirmed and `dapr-scheduler-server` Running. If either fails — stop and fix before Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure and shared code that ALL user stories depend on.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete and deployed.

- [ ] T-5.5.1 [US2] Update `k8s/dapr/statestore.yaml` — add two metadata entries after `disableEntityManagement`: `{ name: connectionTimeout, value: "30s" }` and `{ name: keyPrefix, value: "name" }`; leave all existing fields (connectionString secretKeyRef, tableName, metadataTableName, cleanupInterval, disableEntityManagement) unchanged
- [ ] T-5.5.1b Apply updated statestore via `kubectl apply -f k8s/dapr/statestore.yaml` and verify with `kubectl get component todoai-statestore -o yaml | grep -A2 keyPrefix` — confirm both new metadata entries appear
- [ ] T-5.5.3 Add `"dateparser>=1.2.0"` to `[project] dependencies` in `backend/pyproject.toml` (httpx is already present at `>=0.27.0` — no change needed)
- [ ] T-5.5.5 [P] Add three Pydantic schemas to `backend/app/schemas.py`: `ScheduleReminderRequest` (fields: `user_id: str`, `task_id: int`, `reminder_time_natural_language: str`), `ScheduleReminderResponse` (fields: `job_name: str`, `due_time_utc: str`, `task_title: str`), and `JobTriggerPayload` (fields: `task_id: int`, `user_id: str`, `type: str = "reminder"`) — add `# [Task]: T-5.5.5` comment above each class

**Checkpoint ✅**: statestore deployed, dateparser in pyproject.toml, three schemas in schemas.py.

---

## Phase 3: User Story 1 — NL Scheduling via AI (Priority: P1) 🎯 MVP

**Goal**: User asks AI "remind me about X in N minutes" → AI confirms with scheduled time → job registered in Dapr.

**Independent Test**: Call `POST /api/jobs/schedule` with `{"user_id": "<id>", "task_id": 1, "reminder_time_natural_language": "in 2 minutes"}` and verify HTTP 201 with `job_name`, `due_time_utc`, and `task_title` in response. Check `kubectl exec` into backend pod to confirm Dapr Jobs API accepted the job.

### Implementation for User Story 1

- [ ] T-5.5.5a [US1] Create `backend/app/logic/scheduler.py` with function `parse_reminder_time(time_string: str) -> datetime` — use `dateparser.parse(time_string, settings={"RETURN_AS_TIMEZONE_AWARE": True, "PREFER_DATES_FROM": "future", "TO_TIMEZONE": "UTC"})`; raise `ValueError("Could not parse time expression: ...")` if result is None; raise `ValueError("Scheduled time is in the past")` if result < `datetime.now(timezone.utc)`; add `# [Task]: T-5.5.5` at top of file
- [ ] T-5.5.4 [US1] Add function `schedule_job(job_name: str, due_time: datetime, data: dict) -> None` to `backend/app/logic/scheduler.py` — build payload `{"dueTime": due_time.strftime("%Y-%m-%dT%H:%M:%SZ"), "data": data}`; POST to `http://localhost:{DAPR_HTTP_PORT}/v1.0-alpha1/jobs/{job_name}` using `httpx.post(..., timeout=10.0)`; raise `httpx.HTTPStatusError` on non-2xx; add `DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))` at module level; add `# [Task]: T-5.5.4` comment on the function
- [ ] T-5.5.6a [US1] Create `backend/app/routes/jobs.py` — define `router = APIRouter()` and implement `POST /api/jobs/schedule` endpoint: (1) use existing `get_current_user` JWT dependency, (2) validate `current_user.id == body.user_id` → HTTP 403 if mismatch, (3) fetch task from DB `WHERE id=body.task_id AND user_id=body.user_id` → HTTP 400 if not found, (4) call `parse_reminder_time(body.reminder_time_natural_language)` → HTTP 400 on `ValueError` with error message, (5) build `job_name = f"reminder-{body.user_id}-{body.task_id}-{int(due_time.timestamp())}"`, (6) call `schedule_job(job_name, due_time, {"task_id": body.task_id, "user_id": body.user_id, "type": "reminder"})` → HTTP 503 on `httpx.HTTPStatusError`, (7) return `ScheduleReminderResponse(job_name=..., due_time_utc=due_time.strftime("%Y-%m-%dT%H:%M:%SZ"), task_title=task.title)` with status 201; add `# [Task]: T-5.5.6` at top of file
- [ ] T-5.5.7 [US1] Register the new router in `backend/app/main.py`: add `from app.routes.jobs import router as jobs_router` after existing router imports; add `app.include_router(jobs_router, prefix="/api")` after existing `include_router` calls; add `# [Task]: T-5.5.7` inline comment

**Checkpoint ✅**: `POST /api/jobs/schedule` returns HTTP 201 with `job_name` and `due_time_utc`. Dapr sidecar logs show job registered. US1 independently testable.

---

## Phase 4: User Story 2 — State Store Persistence (Priority: P2)

**Goal**: Scheduled jobs survive a full cluster restart and still fire at the correct time.

**Independent Test**: Schedule a job with `dueTime` 3 minutes ahead. Run `minikube stop && minikube start`. Confirm both pods restart to `2/2 Running` with 0 crashes. Wait for `dueTime` — confirm Notification Service logs fire automatically.

### Implementation for User Story 2

- [ ] T-5.5.1c [US2] Verify Dapr statestore component is loaded without errors after T-5.5.1b: run `kubectl logs deployment/todoai-backend -c daprd | grep -i statestore` and confirm "component loaded" line with `todoai-statestore`; confirm pod has `2/2 Running` and 0 restarts; if cold-start timeout error appears → verify `connectionTimeout: "30s"` is present in the applied YAML
- [ ] T-5.5.1d [US2] Verify `keyPrefix` is enabling Dapr Scheduler persistence: run `kubectl logs -n dapr-system deployment/dapr-scheduler-server --tail=30` and confirm no "state store not found" or "key not found" errors; this confirms the Scheduler can read/write job state using the `name` prefix

**Checkpoint ✅**: Dapr statestore logs clean, `keyPrefix: name` confirmed, Scheduler server healthy. Jobs now persist across restarts.

---

## Phase 5: User Story 3 — Callback → Kafka → Notification Service (Priority: P3)

**Goal**: When a Dapr Job fires, the backend callback publishes to `reminders` Kafka topic, and the Notification Service logs the reminder automatically.

**Independent Test**: From inside the backend pod (`kubectl exec -it <pod> -- bash`), run `curl -s -X POST http://localhost:8000/api/jobs/trigger -H "Content-Type: application/json" -d '{"name":"test-job","data":{"task_id":1,"user_id":"<id>","type":"reminder"}}'` → confirm HTTP 200. Then check `kubectl logs deployment/todoai-notification` for `[REMINDER]:` line.

### Implementation for User Story 3

- [ ] T-5.5.6b [US3] Add shared callback handler `_handle_job_trigger(request: Request, body: dict, db: Session)` to `backend/app/routes/jobs.py`: (1) check `request.client.host == "127.0.0.1"` → return HTTP 403 `{"detail": "Forbidden"}` for any other origin, (2) extract `data = body.get("data", {})`, parse as `JobTriggerPayload`, (3) query DB `WHERE id=data.task_id AND user_id=data.user_id` → if not found: log WARNING and return `{"status": "ok"}` (ACK without publish to prevent Dapr retry storm), (4) call `await asyncio.to_thread(publish_reminder_event, str(task.id), task.title, data.user_id)` — import `publish_reminder_event` from `app.logic.events`; add `# [Task]: T-5.5.8` comment on this function
- [ ] T-5.5.6c [US3] Add `POST /api/jobs/trigger` route (alias) and `POST /job/{job_name}` route (Dapr native callback path) to `backend/app/routes/jobs.py` — both routes call `_handle_job_trigger(request, body, db)`; the `/job/{job_name}` route must be added WITHOUT the `/api` prefix (register it directly with `router = APIRouter()` using path `/job/{job_name}`)
- [ ] T-5.5.7b [US3] Update `backend/app/main.py` to also include the jobs router WITHOUT a prefix for the `/job/{job_name}` Dapr callback path: the existing `app.include_router(jobs_router, prefix="/api")` handles `/api/jobs/schedule` and `/api/jobs/trigger`; add a second `app.include_router(jobs_router)` WITHOUT prefix to expose `/job/{job_name}` — FastAPI will deduplicate `/api/jobs/trigger` since both routers share the same router object; alternatively, split into two routers (`schedule_router` with `/api` prefix, `callback_router` without prefix) to avoid ambiguity; add `# [Task]: T-5.5.7` comment
- [ ] T-5.5.8 [US3] Smoke-test the event bridge: rebuild Docker image, do `helm upgrade` (D002–D003 from plan), wait for `2/2 Running`, then run the `kubectl exec` curl test from Independent Test above — confirm `[REMINDER]: Hey User` line appears in `kubectl logs deployment/todoai-notification` within 5 seconds of the curl call

**Checkpoint ✅**: Callback endpoint live, IP check enforced (403 from external), `publish_reminder_event` fires correctly, Notification Service logs the reminder. US3 independently testable.

---

## Phase 6: User Story 4 — AI Agent Confirmation (Priority: P4)

**Goal**: After scheduling via chat, AI confirms with exact task name, local time, and UTC time. Roman Urdu parity maintained.

**Independent Test**: In chat UI, type "remind me to buy milk in 3 minutes". Agent MUST respond with message containing task name, a human-readable time, and UTC notation. Type in Roman Urdu ("mujhe 5 minute mein yaad dilao ke milk lena hai") → response MUST be in Roman Urdu with time confirmation.

### Implementation for User Story 4

- [ ] T-5.5.9 [US4] Add `schedule_reminder` as the 6th MCP tool in `backend/app/mcp/server.py`: signature `async def schedule_reminder(user_id: str, task_id: int, reminder_time_natural_language: str) -> str`; implementation: POST to `http://localhost:8000/api/jobs/schedule` with JSON body and `Authorization: Bearer <user_token>` header (retrieve token from agent context or pass as parameter); on HTTP 201 return JSON string `{"job_name": ..., "due_time_utc": ..., "task_title": ...}`; on HTTP 400/503 return error string; add `# [Task]: T-5.5.9` comment above the tool function

  > **Note on auth token**: The MCP tool runs as a subprocess; the `user_id` is injected by the agent. For the loopback self-call to `/api/jobs/schedule`, the token must be passed through. Update the MCP tool signature to accept an optional `auth_token: str = ""` parameter and include it in the Authorization header; update `runner.py` to pass the current request's Bearer token when constructing the MCP tool call context.

- [ ] T-5.5.10 [US4] Update `SYSTEM_PROMPT_TEMPLATE` in `backend/app/agent/prompts.py`: (1) add `schedule_reminder` to the "Available tools" list after `update_task`, (2) add SCHEDULE REMINDER FLOW block after the DELETE FLOW block:
  ```
  SCHEDULE REMINDER FLOW:
  1. User says "remind me about [task] in [time]" or similar scheduling request
  2. MANDATORY: First call list_tasks to confirm the task exists and get its exact task_id
  3. Call schedule_reminder with user_id, task_id (from list_tasks result), and reminder_time_natural_language (user's exact wording verbatim)
  4. CONFIRM to user: "I've scheduled a reminder for **[task_title]** at **[due_time_utc]** UTC."
  5. If schedule_reminder returns an error: report plain-language failure. NEVER confirm a schedule that did not succeed.
  6. Roman Urdu rule: if user wrote in Roman Urdu, confirmation MUST also be in Roman Urdu.
  ```
  Add `# [Task]: T-5.5.10` comment above the new block.

**Checkpoint ✅**: Agent calls `schedule_reminder` tool, returns confirmation with time, handles failures gracefully, Roman Urdu parity works.

---

## Phase 7: End-to-End Verification

**Purpose**: Prove the full scheduling loop works without any manual intervention.

- [ ] T-5.5.11 [P] E2E smoke test: (1) Deploy full updated backend (rebuild Docker image + `helm upgrade`), (2) open chat UI or use `curl POST /api/{user_id}/chat` with `{"message": "Remind me to check the oven in 2 minutes"}`, (3) verify AI response contains confirmation with a time, (4) wait 120 seconds, (5) run `kubectl logs deployment/todoai-notification --tail=20` and confirm line matching `[REMINDER]: Hey User .* check the oven` — this must appear without any manual API call, proving the full chain: AI → MCP → Dapr Jobs → Callback → Kafka → Notification Service
- [ ] T-5.5.11b [P] Security gate verification: from outside the pod (WSL2 terminal), attempt `curl -X POST http://$(minikube ip):30800/api/jobs/trigger -d '{}'` → confirm HTTP 403 (not from localhost); from inside pod (`kubectl exec`) → confirm HTTP 200. Both must pass.

**Checkpoint ✅**: Reminder fires automatically after 120 seconds. External trigger returns 403. Feature complete.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup/Verify)
  └─► Phase 2 (Foundational: statestore + dateparser + schemas)
        ├─► Phase 3 (US1: scheduler.py + /api/jobs/schedule + MCP tool)
        │     └─► Phase 4 (US2: statestore persistence verification)
        │           └─► Phase 5 (US3: callback + Kafka bridge)
        │                 └─► Phase 6 (US4: agent confirmation)
        │                       └─► Phase 7 (E2E verification)
        └─► (Phase 4 can also start in parallel once Phase 2 statestore is applied)
```

### User Story Dependencies

| Story | Depends On | Independently Testable |
|-------|-----------|----------------------|
| US2 (Phase 4) | Phase 2 (statestore deployed) | ✅ kubectl logs check |
| US1 (Phase 3) | Phase 2 complete | ✅ POST /api/jobs/schedule HTTP 201 |
| US3 (Phase 5) | US1 (jobs.py exists) | ✅ kubectl exec curl test |
| US4 (Phase 6) | US1 + US3 (full chain working) | ✅ chat UI confirmation message |

### Parallel Opportunities

- **Phase 2**: T-5.5.3 (dateparser) and T-5.5.5 (schemas) can run in parallel with T-5.5.1 (statestore YAML edit)
- **Phase 3**: T-5.5.5a (parse_reminder_time) and T-5.5.6a (/api/jobs/schedule route) can be drafted in parallel once T-5.5.4 interface is clear
- **Phase 7**: T-5.5.11 and T-5.5.11b can run in parallel (different verification steps)

---

## Implementation Strategy

### MVP (US1 + US3 minimum)

1. ✅ Phase 1: Verify secrets + scheduler pod
2. ✅ Phase 2: statestore YAML, dateparser, schemas
3. ✅ Phase 3 (US1): scheduler.py + /api/jobs/schedule + main.py
4. ✅ Phase 5 (US3): callback route + event bridge
5. **STOP AND TEST**: Does the full loop fire? (`kubectl logs` check)
6. Phase 6 (US4): agent confirmation polish
7. Phase 7: E2E with chat UI

### Strict Ordering (single developer)

```
T-5.5.2 → T-5.5.0 → T-5.5.1 → T-5.5.1b → T-5.5.3 → T-5.5.5
  → T-5.5.5a → T-5.5.4 → T-5.5.6a → T-5.5.7 → [DEPLOY]
  → T-5.5.1c → T-5.5.1d → T-5.5.6b → T-5.5.6c → T-5.5.7b → T-5.5.8
  → T-5.5.9 → T-5.5.10 → [DEPLOY] → T-5.5.11 → T-5.5.11b
```

---

## Notes

- **`# [Task]: T-5.5.x`** comment MUST appear in every modified/created file at the relevant function or section
- **All scheduling logic is non-blocking**: `schedule_job()` uses sync `httpx` but is called within FastAPI's thread pool (sync route); `publish_reminder_event()` in callback is wrapped in `asyncio.to_thread()` to avoid blocking the async event loop
- **No new database migrations**: Dapr state store uses pre-created `dapr_state` / `dapr_metadata` tables (Phase 5.2). No Alembic migration needed.
- **Router split (T-5.5.7b)**: If FastAPI raises a conflict registering the same router twice with different prefixes, split into `schedule_router` (prefix `/api`) and `callback_router` (no prefix)
- **MCP auth token (T-5.5.9)**: If passing auth token through MCP is complex, fall back to an internal shared secret header (`X-Internal-Token`) validated only for loopback calls — document in `COMMANDS.md`
