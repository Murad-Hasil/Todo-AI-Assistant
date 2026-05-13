---
id: "0003"
title: Phase 5.2 Audit Statestore Tasks
stage: tasks
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 009-audit-statestore
branch: 009-audit-statestore
user: brownie
command: /sp.tasks
labels: ["tasks","dapr","audit","statestore","events","pubsub","fire-and-forget","k8s"]
links:
  spec: specs/009-audit-statestore/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-audit-statestore/tasks.md
tests:
  - "T010: SC-001 audit event smoke test"
  - "T011: SC-004 broker-down resilience"
  - "T015-T016: statestore log + dashboard check"
  - "T018-T020: SC-003 state persistence"
  - "T021: SC-005 regression test"
---

## Prompt

Generate a task list for Phase 5.2: Audit Logs and Statestore Fix in `/todo-web-app/specs/phase5/audit-tasks.md` based strictly on the plan `@/todo-web-app/specs/phase5/audit-plan.md`.

T-5.2.1: Update dapr-secrets (DIRECT_DATABASE_URL). T-5.2.2: Reconfigure statestore.yaml. T-5.2.3: kubectl apply. T-5.2.4: events.py with publish_event. T-5.2.5: Integrate with CRUD (task_ops.py). T-5.2.6: Dapr Health Check. T-5.2.7: Redpanda event verification. Style: # [Task]: T-5.2.x comments, fire-and-forget decoupled.

## Response snapshot

Generated `specs/009-audit-statestore/tasks.md` — 24 tasks across 6 phases:
- Phase 1 (T001-T004, parallel): dapr-secrets.yaml, statestore.yaml, events.py, pyproject.toml
- Phase 2 (T005-T006): routes/tasks.py (BackgroundTasks), mcp/server.py (direct)
- Phase 3 US1 MVP (T007-T011): build, deploy, SC-001 smoke, SC-004 resilience
- Phase 4 US2 (T012-T017): apply infra, restart, log check, dashboard, fallback
- Phase 5 US3 (T018-T020): statestore write→restart→read-back
- Phase 6 Polish (T021-T024): regression, docs, HF deploy

Plan correction applied: task_ops.py UNCHANGED (plan.md R-005). Publish in routes + MCP layer.

## Outcome

- ✅ Impact: 24 immediately executable tasks — ready for /sp.implement
- 🧪 Tests: 6 smoke/validation tests defined (no automated tests — infra/event validation)
- 📁 Files: specs/009-audit-statestore/tasks.md
- 🔁 Next prompts: /sp.implement
- 🧠 Reflection: T017 fallback critical — if direct Neon endpoint unreachable from Minikube, disableEntityManagement pattern documents the workaround path

## Evaluation notes (flywheel)

- Failure modes observed: User T-5.2.5 specified task_ops.py — corrected per plan.md research R-005
- Graders run and results (PASS/FAIL): All 24 tasks follow [checkbox][ID][P?][Story?][desc+path] format
- Prompt variant (if applicable): /sp.tasks with explicit numbered task list from user
- Next experiment (smallest change to try): /sp.implement — T001-T004 in parallel first
