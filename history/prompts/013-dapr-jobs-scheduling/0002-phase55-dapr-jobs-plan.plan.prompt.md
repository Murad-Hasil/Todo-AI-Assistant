---
id: "0002"
title: Phase 5.5 Dapr Jobs Scheduling Plan
stage: plan
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: 013-dapr-jobs-scheduling
branch: 013-dapr-jobs-scheduling
user: Murad Hasil
command: /sp.plan
labels: ["plan","phase5","dapr-jobs","scheduling","statestore","mcp","callback","httpx","dateparser"]
links:
  spec: specs/013-dapr-jobs-scheduling/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/013-dapr-jobs-scheduling/plan.md
  - specs/013-dapr-jobs-scheduling/research.md
  - specs/013-dapr-jobs-scheduling/data-model.md
  - specs/013-dapr-jobs-scheduling/contracts/jobs-api.yaml
tests:
  - N/A (planning document — no executable tests)
---

## Prompt

Generate the technical plan for Phase 5.5: Intelligent Scheduling with Dapr Jobs API in `/todo-web-app/specs/phase5/scheduling-plan.md` based strictly on the approved spec `@/todo-web-app/specs/phase5/scheduling.md`.

The plan must include:
1. **INFRASTRUCTURE (The Persistence Layer):**
   - Plan the re-deployment of `statestore.yaml`. Use the `DIRECT_DATABASE_URL` from K8s secrets.
   - Set `connectionTimeout: "30s"` and `metadata: { name: "keyPrefix", value: "name" }` to ensure Dapr can handle Neon's cold-start delay.
   - Detail the verification of the `dapr-scheduler-server` status in the cluster.

2. **SCHEDULING LOGIC (app/logic/scheduler.py):**
   - Create a utility `schedule_job(job_name, due_time, data)`.
   - Implementation: Use `httpx` to POST to the Dapr alpha1 Jobs API endpoint.
   - Time Handling: Logic to convert relative time (e.g., "in 10 minutes") or absolute time (e.g., "3:00 PM") into a standardized ISO-8601 UTC string.

3. **CALLBACK ARCHITECTURE (app/routes/jobs.py):**
   - Plan a new FastAPI router for Job Callbacks.
   - Endpoint: `POST /api/jobs/trigger`.
   - Security: Add a check to ensure the request is coming from `127.0.0.1` (the sidecar).
   - Logic: Parse the `data` payload -> Identify the user and task -> Invoke the existing `publish_reminder_event()` to send the message to Kafka.

4. **MCP TOOL INTEGRATION (app/mcp/server.py):**
   - Implement `schedule_reminder(user_id, task_id, time_string)`.
   - Update the AI System Prompt to recognize scheduling requests and map them to this tool.

5. **COORDINATION FLOW:**
   - AI Agent -> MCP Tool -> Backend Scheduler -> Dapr Job Store -> (Timer Expires) -> Dapr Sidecar -> Backend Callback -> Kafka -> Notification Service.

6. **DIRECTORY MAPPING:**
   - Logic: `/todo-web-app/backend/app/logic/scheduler.py`
   - Routes: `/todo-web-app/backend/app/routes/jobs.py`
   - K8s: `/todo-web-app/k8s/dapr/statestore.yaml` (Update)

## Response snapshot

Full implementation plan generated for `013-dapr-jobs-scheduling`.

**Phase 0 (Research)** — All 7 unknowns resolved:
- Dapr Jobs callback path: `/job/{job-name}` (Dapr runtime hardcoded)
- httpx already available (pyproject.toml >=0.27.0)
- dateparser>=1.2.0 with `TO_TIMEZONE: UTC`, `PREFER_DATES_FROM: future`
- `keyPrefix: name` required by Dapr Scheduler for cross-restart job lookup
- Task title must be DB-fetched in callback (Dapr payload only has task_id)
- publish_reminder_event() reused unchanged from events.py
- Both callback aliases: /job/{name} (Dapr native) + /api/jobs/trigger (spec alias)

**Phase 1 (Design)** — All artifacts generated:
- research.md: 7 decisions documented
- data-model.md: No new DB tables; 3 Pydantic schemas defined
- contracts/jobs-api.yaml: OpenAPI spec for 3 endpoints

**Constitution check**: All 17 principles (I–XVII) PASS. No violations.

**8 implementation tasks** identified:
T001 Verify dapr-scheduler-server → T002 statestore.yaml update → T003 dateparser →
T004 scheduler.py → T005 schemas.py → T006 jobs.py → T007 main.py → T008 MCP tool + prompt

**5 deployment tasks** (D001–D005) documented with exact kubectl/helm commands.

## Outcome

- ✅ Impact: Phase 5.5 implementation plan complete — all design decisions made, contracts defined, 8 implementation tasks ready for /sp.tasks
- 🧪 Tests: N/A — planning document
- 📁 Files: plan.md, research.md, data-model.md, contracts/jobs-api.yaml
- 🔁 Next prompts: /sp.tasks (013-dapr-jobs-scheduling), /sp.adr dapr-jobs-vs-cronjob-scheduling
- 🧠 Reflection: Key insight — Dapr Jobs callback path /job/{name} is hardcoded by runtime (not configurable like subscriptions); must register bare path without /api prefix in main.py. Task title DB lookup in callback is necessary because Dapr payload only carries IDs.

## Evaluation notes (flywheel)

- Failure modes observed: None — all 17 constitution gates pass; no NEEDS CLARIFICATION left
- Graders run and results (PASS/FAIL): Manual validation PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run /sp.tasks to generate atomic implementation tasks
