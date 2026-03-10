---
id: "0002"
title: Phase 5.2 Audit Statestore Plan
stage: plan
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 009-audit-statestore
branch: 009-audit-statestore
user: brownie
command: /sp.plan
labels: ["plan","dapr","audit","pubsub","statestore","events","httpx","fire-and-forget"]
links:
  spec: specs/009-audit-statestore/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-audit-statestore/plan.md
  - specs/009-audit-statestore/research.md
  - specs/009-audit-statestore/data-model.md
  - specs/009-audit-statestore/quickstart.md
  - specs/009-audit-statestore/contracts/events-contract.md
tests:
  - "Constitution Check: all gates pass (XV partial deviation documented)"
  - "Research: 7 decisions resolved in research.md"
---

## Prompt

Generate the technical plan for Phase 5.2: Audit Logs and Statestore Fix in `/todo-web-app/specs/phase5/audit-plan.md` based strictly on the approved spec.

The plan must include:
1. INFRASTRUCTURE REPAIR (Statestore): DIRECT_DATABASE_URL key in dapr-secrets, statestore.yaml reconfiguration.
2. EVENT PUBLISHING LOGIC: Fire-and-Forget via FastAPI BackgroundTasks, utility function in app/logic/events.py wrapping Dapr HTTP Publish API.
3. BACKEND INTEGRATION: Modify app/logic/task_ops.py — after every successful DB commit call event utility.
4. KAFKA TOPIC VERIFICATION: Steps to verify events via Redpanda Console or rpk.
5. DEPENDENCIES: httpx or requests for internal Dapr sidecar calls.

## Response snapshot

Generated complete Phase 1 plan artifacts:

- **research.md**: 7 research decisions resolved — statestore direct vs pooled, fire-and-forget architecture, httpx choice, task_id UUID type correction (spec said int), publish point (routes + MCP, NOT task_ops), Kafka verification methods
- **data-model.md**: AuditEvent payload schema, Task entity (unchanged), Dapr State Entry
- **contracts/events-contract.md**: Dapr publish API spec, retry contract table, events.py interface, DIRECT_DATABASE_URL secret spec
- **quickstart.md**: 12-step implementation guide (statestore fix + events.py + routes + MCP + verify)
- **plan.md**: Full implementation plan — Constitution Check (all pass, XV partial deviation documented), Complexity Tracking, dependency graph, 4 parallel opportunities

Key design decisions:
1. task_ops.py UNCHANGED — publish called from routes (BackgroundTasks) and MCP tools (direct)
2. DIRECT_DATABASE_URL = non-pooler Neon endpoint (DDL-capable)
3. httpx.post to localhost:3500 — compliant with Constitution XIV
4. HF Space safety: ConnectionRefused caught silently — no crash on production

## Outcome

- ✅ Impact: Complete implementation blueprint — ready for /sp.tasks
- 🧪 Tests: 6 smoke tests defined (SC-001 through SC-005 + state persistence)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/events-contract.md
- 🔁 Next prompts: /sp.tasks → /sp.implement
- 🧠 Reflection: Key insight — publish point must be routes+MCP (not task_ops) to keep task_ops pure and testable. HF Space safety (no Dapr sidecar) must be handled by events.py silently.

## Evaluation notes (flywheel)

- Failure modes observed: Constitution XV vs FR-005 tension (retry 503 vs fire-and-forget) — resolved by background task pattern
- Graders run and results (PASS/FAIL): Constitution Check all PASS (XV deviation documented in Complexity Tracking)
- Prompt variant (if applicable): /sp.plan with explicit requirements block
- Next experiment (smallest change to try): /sp.tasks to generate testable task list
