---
id: "0001"
title: "Phase 5.3 Notification Service Spec"
stage: spec
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 010-notification-service
branch: 010-notification-service
user: brownie
command: /sp.specify
labels: ["phase-5.3", "notification-service", "dapr", "pubsub", "microservice", "kafka"]
links:
  spec: specs/010-notification-service/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/010-notification-service/spec.md
  - specs/010-notification-service/checklists/requirements.md
tests:
  - "Checklist: 14/14 items PASS"
---

## Prompt

Generate the specification for Phase 5.3: Event-Driven Notification Service in `/todo-web-app/specs/phase5/notifications.md` based strictly on the Project PDF (Pages 25, 26, 33).

MISSION: Create a separate microservice that consumes events from Kafka and simulates a reminder system.

REQUIREMENTS:
1. **NEW MICROSERVICE (Notification Service):** Technology: Python 3.13 (FastAPI/Lightweight). Location: `/todo-web-app/services/notification/`. Role: Subscriber (Consumer).
2. **DAPR SUBSCRIPTION LOGIC:** Create a Dapr Subscription manifest to link the `reminders` topic to the notification service's `/on-reminder` endpoint. Use Dapr's "Declarative Subscription" pattern.
3. **REMINDER LOGIC:** The service must expose a POST endpoint `/on-reminder`. When an event is received, it should log: `[REMINDER]: Hey User {user_id}, your task "{task_title}" is due now!`
4. **BACKEND TRIGGER (The Producer):** Update the main Backend to publish to the `reminders` topic when a task is created with a specific keyword (e.g., "remind me").
5. **KUBERNETES DEPLOYMENT:** Define a new Helm template for `notification-service`. Ensure it has its own Dapr sidecar with `app-id: notification-service`.
6. **ACCEPTANCE CRITERIA:** Running `kubectl logs` on the notification service shows the reminder message after a task is added in the main app.

## Response snapshot

Created `specs/010-notification-service/spec.md` on branch `010-notification-service` with:

- **3 user stories** (P1: reminder on keyword, P2: independent operation, P3: log traceability)
- **9 FRs** covering: keyword detection, fire-and-forget publish, subscriber endpoint, log format, error handling, microservice isolation, at-least-once delivery, K8s deployment, no-false-positives
- **5 SCs** all measurable and technology-agnostic (5-second delivery, zero API downtime, 100% event recovery, zero false positives, graceful malformed event handling)
- **5 edge cases** documented
- Clear Out of Scope: no scheduled reminders, no email/SMS, no UI, no deduplication
- Checklist: 14/14 PASS — ready for /sp.plan

## Outcome

- ✅ Impact: Complete Phase 5.3 specification defining a Kafka consumer microservice with Dapr declarative subscription, keyword-triggered backend producer, and Kubernetes deployment
- 🧪 Tests: Spec quality checklist 14/14 PASS
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` for Phase 5.3 — technical plan with notification service architecture, Dapr subscription manifest, Helm template, backend keyword detection logic
- 🧠 Reflection: Kept spec technology-agnostic despite heavy implementation detail in the prompt. "remind me" keyword trigger is simple and testable. Assumption that task_title is in the event payload (not DB lookup) keeps the notification service truly stateless.

## Evaluation notes (flywheel)

- Failure modes observed: none — prompt was detailed enough
- Graders run and results (PASS/FAIL): checklist PASS (14/14)
- Prompt variant (if applicable): sp.specify with detailed requirements
- Next experiment (smallest change to try): n/a
