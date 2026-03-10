---
id: "0024"
title: Phase 5 Dapr Kafka Infra Plan
stage: plan
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: 008-dapr-kafka-infra
branch: 008-dapr-kafka-infra
user: brownie
command: /sp.plan
labels: ["phase5","dapr","kafka","redpanda","pubsub","statestore","k8s","plan","helm"]
links:
  spec: specs/008-dapr-kafka-infra/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/008-dapr-kafka-infra/plan.md
  - specs/008-dapr-kafka-infra/research.md
  - specs/008-dapr-kafka-infra/quickstart.md
  - CLAUDE.md (agent context updated)
tests:
  - Constitution Check: 11 principles evaluated — PASS (Principle XV deferred to Phase 5.2)
---

## Prompt

Generate the technical plan for Phase 5.1: Event-Driven Infrastructure in `/todo-web-app/specs/phase5/infrastructure-plan.md` based strictly on the approved spec `@/todo-web-app/specs/phase5/infrastructure.md`.

The plan must include:
1. **DAPR COMPONENT DEFINITIONS:**
   - **PubSub (Kafka):** Plan the `pubsub.yaml` configuration using `pubsub.kafka`. Define the secret mapping for Redpanda SASL credentials.
   - **State Store (PostgreSQL):** Plan the `statestore.yaml` using `state.postgresql`. Configure it to use the Neon DB connection string.

2. **KUBERNETES MODIFICATION STRATEGY:**
   - **Backend Deployment:** Define the exact annotations to be added to the `todo-backend` pod template to enable Dapr sidecar injection (App ID: `todo-backend`, Port: `8000`).
   - **Frontend Deployment:** Define annotations for `todo-frontend` (App ID: `todo-frontend`, Port: `3000`).

3. **NETWORK & SERVICE INVOKATION:**
   - Detail how the services will now communicate via Dapr Service Invocation (`http://localhost:3500/v1.0/invoke/...`) as an alternative to direct service DNS.

4. **SECURITY & SECRETS:**
   - Plan for storing Redpanda credentials and Neon DB strings in a Kubernetes Secret named `dapr-secrets` to be referenced by Dapr components.

5. **VERIFICATION PLAN:**
   - Steps to use the Dapr Dashboard (`dapr dashboard -k`) to verify component health.
   - Steps to perform a manual "Publish" test using `curl` against the Dapr sidecar inside a pod.

6. **DIRECTORY MAPPING:**
   - Component manifests: `/todo-web-app/k8s/dapr/`
   - Updated Helm templates: `/todo-web-app/k8s/charts/todoai/templates/`

## Response snapshot

Generated complete Phase 5.1 implementation plan with:
- **research.md**: 6 decisions resolved (pubsub.kafka fields, state.postgresql fields, single `dapr-secrets` Secret strategy, v1alpha1 Subscriptions, sidecar annotation placement, Dapr CLI init approach)
- **plan.md**: Constitution Check (11 principles, all PASS); exact YAML for pubsub.yaml, statestore.yaml, 3 Subscription manifests, dapr-secrets.yaml.example; Helm annotation patches for backend (port 8000) and frontend (port 3000); 9-step verification plan with curl smoke tests
- **quickstart.md**: Step-by-step install (Dapr CLI → control plane → secrets → components → redeploy → verify) with troubleshooting table
- Agent context (CLAUDE.md) updated with Dapr/Redpanda tech stack

## Outcome

- ✅ Impact: Phase 5.1 plan complete — all YAML contracts defined, no application code changes required
- 🧪 Tests: 9-step verification plan including Dapr Dashboard check, publish smoke test (204 expected), state store round-trip test
- 📁 Files: plan.md, research.md, quickstart.md created; CLAUDE.md updated
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown for implementation
- 🧠 Reflection: Infrastructure-only phases are clean — no app code changes means zero regression risk for Phase 2–4

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check PASS (11/11, Principle XV deferred to Phase 5.2 by design)
- Prompt variant (if applicable): none
- Next experiment: /sp.tasks to break plan into atomic implementation tasks
