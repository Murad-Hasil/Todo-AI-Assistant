---
id: "0025"
title: Phase 5 Dapr Kafka Infra Tasks
stage: tasks
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: 008-dapr-kafka-infra
branch: 008-dapr-kafka-infra
user: brownie
command: /sp.tasks
labels: ["phase5","dapr","kafka","redpanda","pubsub","statestore","tasks","k8s"]
links:
  spec: specs/008-dapr-kafka-infra/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/008-dapr-kafka-infra/tasks.md
tests:
  - Smoke test: HTTP 204 from publish curl (T014)
  - Smoke test: state store round-trip after pod restart (T023)
---

## Prompt

Generate a task list for Phase 5.1: Event-Driven Infrastructure (Dapr & Kafka) in `/todo-web-app/specs/phase5/infrastructure-tasks.md` based strictly on the approved plan `@/todo-web-app/specs/phase5/infrastructure-plan.md`.

The task list must include:
1. **SECRET MANAGEMENT:** T-5.1.1 — dapr-secrets K8s Secret
2. **DAPR COMPONENT DEPLOYMENT:** T-5.1.2 pubsub.yaml, T-5.1.3 statestore.yaml, T-5.1.4 kubectl apply
3. **HELM CHART UPDATES:** T-5.1.5 backend sidecar annotations, T-5.1.6 frontend sidecar annotations
4. **INFRASTRUCTURE REFRESH:** T-5.1.7 Helm upgrade
5. **VERIFICATION:** T-5.1.8 sidecar 2/2 check, T-5.1.9 PubSub curl test
6. **STYLISTIC RULES:** Task ID comments `# [Task]: T-5.1.x`, proper YAML indentation

## Response snapshot

Generated `specs/008-dapr-kafka-infra/tasks.md` with 30 tasks across 6 phases:
- Phase 1 (Setup): T001–T004 — Dapr CLI + control plane install, directory setup
- Phase 2 (Foundational): T005–T007 — dapr-secrets creation + verification (BLOCKS all stories)
- Phase 3 (US1 — PubSub P1 MVP): T008–T014 — pubsub.yaml, task-events-sub.yaml, backend annotation, deploy, 204 smoke test
- Phase 4 (US2 — Health P2): T015–T020 — statestore.yaml, frontend annotation, full redeploy, dashboard verification
- Phase 5 (US3 — State P3): T021–T023 — state write/read round-trip + pod restart persistence test
- Phase 6 (Polish): T024–T030 — remaining subscription manifests, values.yaml update, retry test

Total: **30 tasks**, 9 parallel [P] opportunities, 2 smoke test checkpoints (T014, T023)

## Outcome

- ✅ Impact: Phase 5.1 fully planned — tasks immediately executable by LLM or operator
- 🧪 Tests: T014 (HTTP 204 publish), T023 (state store persistence after restart), T029 (retry behaviour)
- 📁 Files: specs/008-dapr-kafka-infra/tasks.md
- 🔁 Next prompts: `/sp.implement` to execute tasks T001–T030
- 🧠 Reflection: Infrastructure tasks are unusual in that most "implementation" is YAML authoring + kubectl commands rather than code; organizing by user story still works well for progressive validation

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): task format check PASS (all 30 tasks follow checkbox + ID + label pattern)
- Prompt variant (if applicable): none
- Next experiment: /sp.implement to execute Phase 1 + Phase 2 + Phase 3 (MVP) immediately
