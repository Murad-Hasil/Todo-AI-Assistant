---
id: "0001"
title: Phase 5.5 Dapr Jobs Scheduling Spec
stage: spec
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: 013-dapr-jobs-scheduling
branch: 013-dapr-jobs-scheduling
user: Murad Hasil
command: /sp.specify
labels: ["spec","phase5","dapr-jobs","scheduling","intelligent-reminders","statestore","mcp"]
links:
  spec: specs/013-dapr-jobs-scheduling/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/013-dapr-jobs-scheduling/spec.md
  - specs/013-dapr-jobs-scheduling/checklists/requirements.md
tests:
  - N/A (specification document — no executable tests)
---

## Prompt

Generate the specification for Phase 5.5: Intelligent Scheduling with Dapr Jobs API in `/todo-web-app/specs/phase5/scheduling.md` based strictly on the Project PDF (Page 33).

MISSION: Implement a precise scheduling system that allows the AI Agent to set future reminders.

REQUIREMENTS:
1. **DAPR STATESTORE RE-INITIALIZATION (The Foundation):**
   - Define the re-introduction of the `statestore.yaml` using the **Direct Neon Connection String**.
   - **Crucial Fix:** Set a connection timeout of 30 seconds and implement `metadata: { name: "keyPrefix", value: "name" }` to prevent Neon cold-start timeouts from crashing the Dapr sidecar.
   - Purpose: Dapr Scheduler requires a persistent State Store to track jobs across cluster restarts.

2. **DAPR JOBS API INTEGRATION (The Scheduler):**
   - Define the logic for scheduling a job via the Dapr alpha1 Jobs API:
     - Endpoint: `POST http://localhost:3500/v1.0-alpha1/jobs/[job-name]`
     - Payload: `{ "dueTime": "[ISO_TIMESTAMP]", "data": { "task_id": int, "user_id": str, "type": "reminder" } }`

3. **BACKEND CALLBACK HANDLER:**
   - Define a new endpoint in the main backend: `POST /api/jobs/trigger`.
   - **Logic:** When Dapr triggers this endpoint at the scheduled time, the backend must publish an event to the `reminders` Kafka topic (connecting back to the Notification Service from Phase 5.3).

4. **MCP TOOL: schedule_reminder:**
   - Define a new MCP tool for the AI Agent: `schedule_reminder`.
   - **Parameters:** `user_id`, `task_id`, `reminder_time_natural_language` (e.g., "in 5 minutes", "tomorrow at 9am").
   - **Logic:** The backend will parse the natural language time into a UTC ISO timestamp before calling Dapr.

5. **ACCEPTANCE CRITERIA:**
   - AI confirms: "I have scheduled a reminder for [Task] at [Time]."
   - After the specified duration, the Notification Service logs (`kubectl logs`) must show the reminder firing automatically without any manual intervention.

## Response snapshot

Feature branch `013-dapr-jobs-scheduling` created. Spec written to
`specs/013-dapr-jobs-scheduling/spec.md` with:

- 4 prioritized user stories (P1: NL scheduling, P2: state store init,
  P3: callback handler, P4: agent confirmation UX)
- 21 functional requirements across 5 groups: State Store, Scheduling,
  Callback Handler, NL Parsing, MCP Tool + Agent Behavior
- 5 measurable success criteria
- 5 edge cases documented
- Dependencies on phases 5.1, 5.2, 5.3 and Constitution XVI+XVII explicit
- Out of scope section bounding the feature clearly

Quality checklist: all items PASS — spec ready for `/sp.plan`.

Key architectural note: statestore.yaml uses direct Neon connection (not pgBouncer),
30s timeout, `keyPrefix: name` — directly addresses the Phase 5.2 DDL crash blocker.

## Outcome

- ✅ Impact: Phase 5.5 spec complete — Dapr Jobs scheduling, statestore fix, callback handler, MCP tool, and agent confirmation fully specified
- 🧪 Tests: N/A — specification document
- 📁 Files: specs/013-dapr-jobs-scheduling/spec.md, specs/013-dapr-jobs-scheduling/checklists/requirements.md
- 🔁 Next prompts: /sp.plan (013-dapr-jobs-scheduling), /sp.adr dapr-jobs-vs-cronjob-scheduling
- 🧠 Reflection: Spec cleanly separates four independent verticals (infra, scheduler, callback, agent UX) as independently testable P1-P4 user stories — enables incremental delivery without blocking any story on another unnecessarily.

## Evaluation notes (flywheel)

- Failure modes observed: None — no NEEDS CLARIFICATION markers; all requirements testable
- Graders run and results (PASS/FAIL): Checklist validation PASS (all items checked)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): /sp.clarify to pressure-test edge cases before planning
