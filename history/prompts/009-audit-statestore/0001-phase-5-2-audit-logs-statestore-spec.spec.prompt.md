---
id: "0001"
title: Phase 5.2 Audit Logs Statestore Spec
stage: spec
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 009-audit-statestore
branch: 009-audit-statestore
user: brownie
command: /sp.specify
labels: ["spec","dapr","audit","pubsub","statestore","phase5","kafka"]
links:
  spec: specs/009-audit-statestore/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-audit-statestore/spec.md
  - specs/009-audit-statestore/checklists/requirements.md
tests:
  - "Checklist validation: all items pass"
---

## Prompt

Generate the specification for Phase 5.2: Audit Logs and Statestore Fix in `/todo-web-app/specs/phase5/audit-logic.md`.

MISSION: Implement the first event-driven feature and fix the database state management.

REQUIREMENTS:
1. **STATESTORE RESOLUTION:**
   - Define the use of the DIRECT Neon connection string for the Dapr `statestore.yaml`.
   - Ensure Dapr can create its metadata table `state` in the database.

2. **AUDIT LOG LOGIC (task-events):**
   - Whenever a task is Created, Updated, or Deleted via the API or Chatbot, the Backend must publish an event to the `pubsub.kafka` component.
   - **Topic:** `task-events`
   - **Payload:** `{ "action": "created/updated/deleted", "task_id": 123, "user_id": "xyz", "timestamp": "..." }`

3. **BACKEND REFACTORING:**
   - Update the backend logic to include a Dapr publish call using the standard Dapr HTTP API (`http://localhost:3500/v1.0/publish/pubsub.kafka/task-events`).

4. **ACCEPTANCE CRITERIA:**
   - A successful task creation must result in a message appearing in the Redpanda Cloud "task-events" topic.
   - Dapr State Store must show as "Healthy" in the Dapr dashboard.

5. **NON-DESTRUCTIVE:**
   - Ensure the existing Neon DB logic for tasks remains unchanged. Dapr is only for "Audit Tracking".

## Response snapshot

Created branch `009-audit-statestore` and spec at `specs/009-audit-statestore/spec.md` with:

- **3 User Stories**: US1 (P1) audit events on task CRUD, US2 (P2) statestore healthy, US3 (P3) state persistence across restarts
- **10 Functional Requirements** (FR-001–FR-010): publish on create/update/delete, fire-and-forget guarantee, non-destructive CRUD, statestore DDL-capable connection, secret hygiene
- **5 Success Criteria** (SC-001–SC-005): event in topic within 5s, statestore green in dashboard, state survives restart, CRUD succeeds with broker down, no API regressions
- **Edge cases**: broker down, missing fields, statestore timeout, table conflicts
- **Key Entities**: Audit Event, Task (unchanged), State Entry
- Checklist: all items ✅ pass — no NEEDS CLARIFICATION markers

## Outcome

- ✅ Impact: Spec ready for /sp.plan — covers statestore fix (direct Neon connection) + audit event publishing (fire-and-forget) + non-destructive contract
- 🧪 Tests: Checklist fully validated — 0 clarifications needed
- 📁 Files: specs/009-audit-statestore/spec.md, specs/009-audit-statestore/checklists/requirements.md
- 🔁 Next prompts: /sp.plan, then /sp.tasks, then /sp.implement
- 🧠 Reflection: FR-005 (fire-and-forget) and FR-008 (direct vs pooled connection) are the two most critical requirements — they directly address Phase 5.1 blockers

## Evaluation notes (flywheel)

- Failure modes observed: none — requirements were well-specified by user
- Graders run and results (PASS/FAIL): checklist all PASS
- Prompt variant (if applicable): /sp.specify with full requirements block
- Next experiment (smallest change to try): /sp.plan to generate architecture decisions for direct Neon endpoint access from Minikube
