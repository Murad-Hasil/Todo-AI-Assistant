---
id: "0023"
title: Phase 5 Dapr Kafka Infra Spec
stage: spec
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: 008-dapr-kafka-infra
branch: 008-dapr-kafka-infra
user: brownie
command: /sp.specify
labels: ["phase5","dapr","kafka","redpanda","pubsub","statestore","k8s","spec"]
links:
  spec: specs/008-dapr-kafka-infra/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/008-dapr-kafka-infra/spec.md
  - specs/008-dapr-kafka-infra/checklists/requirements.md
tests:
  - Spec quality checklist — ALL 16 items PASS
---

## Prompt

Generate the specification for Phase 5.1: Event-Driven Infrastructure (Dapr & Kafka) in `/todo-web-app/specs/phase5/infrastructure.md` based strictly on the Project PDF (Pages 25-36).

MISSION: Prepare the "Distributed Runtime" layer for the Todo AI app.

REQUIREMENTS:
1. **DAPR PUBSUB (KAFKA):**
   - Create a Dapr component specification (`pubsub.yaml`) that uses `pubsub.kafka`.
   - Configure it to connect to Redpanda Cloud using the user provided Bootstrap Server, SASL Username, and SASL Password.
   - Define the required topics: `task-events`, `reminders`, and `task-updates`.

2. **DAPR STATE STORE (POSTGRESQL):**
   - Create a Dapr component specification (`statestore.yaml`) that uses `state.postgresql`.
   - Use the existing Neon PostgreSQL connection string.
   - Purpose: Store conversation state and task cache via Dapr APIs.

3. **K8S DEPLOYMENT INJECTION:**
   - Define how to modify the existing `todo-backend` and `todo-frontend` Kubernetes deployments to include Dapr sidecar annotations:
     - `dapr.io/enabled: "true"`
     - `dapr.io/app-id: "todo-backend"` (or frontend)
     - `dapr.io/app-port: "8000"` (or 3000)

4. **DIRECTORY STRUCTURE:**
   - Save all Dapr component manifests in `/todo-web-app/k8s/dapr/`.

5. **ACCEPTANCE CRITERIA:**
   - Dapr sidecars must be running alongside the app containers.
   - The backend must be able to reach the Dapr sidecar at `http://localhost:3500`.

## Response snapshot

Created branch `008-dapr-kafka-infra`. Wrote full spec at `specs/008-dapr-kafka-infra/spec.md` with:
- 3 user stories (P1: event publishing, P2: operator health verification, P3: state store persistence)
- 12 functional requirements (FR-001 to FR-012)
- 5 edge cases including broker misconfiguration and credential rotation
- 6 measurable success criteria (SC-001 to SC-006)
- Explicit scope boundaries, dependencies, and assumptions
- Spec quality checklist: 16/16 items PASS, 0 NEEDS CLARIFICATION markers

## Outcome

- ✅ Impact: Phase 5.1 spec complete — ready for `/sp.plan`
- 🧪 Tests: Spec quality checklist 16/16 PASS
- 📁 Files: specs/008-dapr-kafka-infra/spec.md, specs/008-dapr-kafka-infra/checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` to design Dapr component manifests and K8s annotation strategy
- 🧠 Reflection: Infrastructure specs need operator-facing stories (not just user-facing) — all 3 stories here target developers/operators, which is appropriate for an infra feature

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist PASS (16/16)
- Prompt variant (if applicable): none
- Next experiment: /sp.plan to convert spec into concrete Dapr manifests and Helm patch
