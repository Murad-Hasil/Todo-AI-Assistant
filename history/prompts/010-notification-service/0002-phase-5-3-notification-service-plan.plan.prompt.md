---
id: "0002"
title: "Phase 5.3 Notification Service Plan"
stage: plan
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 010-notification-service
branch: 010-notification-service
user: brownie
command: /sp.plan
labels: ["phase-5.3", "notification-service", "dapr", "pubsub", "fastapi", "helm", "kubernetes"]
links:
  spec: specs/010-notification-service/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/010-notification-service/plan.md
  - specs/010-notification-service/research.md
  - specs/010-notification-service/data-model.md
  - specs/010-notification-service/quickstart.md
  - specs/010-notification-service/contracts/notification-contract.md
tests:
  - "Constitution check: 7/7 principles PASS"
---

## Prompt

Generate the technical plan for Phase 5.3: Event-Driven Notification Service in `/todo-web-app/specs/phase5/notifications-plan.md` based strictly on the approved spec.

The plan must include: (1) Microservice architecture — FastAPI in services/notification/app/main.py, POST /on-reminder. (2) Dapr declarative subscription — subscription.yaml binding reminders topic to todo-notification-service. (3) Notification logic — parse CloudEvent, log REMINDER message, placeholder for email/push. (4) Backend trigger — modify task_ops.py to detect "remind me"/"alert" keywords, publish to reminders topic. (5) K8s deployment — Dockerfile, Helm templates with Dapr sidecar (app-id: todo-notification-service). (6) Verification — kubectl logs to see reminders in real-time.

## Response snapshot

Generated 5 planning artifacts for Phase 5.3:

**research.md** (R-001–R-008): Key decision — publish from routes/tasks.py (NOT task_ops.py) per Constitution III. task_title must be in reminder payload (no DB lookup). CloudEvents envelope: parse `body.get("data", body)`. Subscription v2alpha1 with scopes. FastAPI port 8080 stateless. Keywords: ["remind me", "alert"]. publish_reminder_event() in events.py with same XV retry contract. Helm ClusterIP service only (no external port).

**plan.md**: Full implementation design with code for main.py, events.py extension, routes/tasks.py keyword trigger, Dapr subscription YAML, Helm deployment + service templates. 17-task dependency graph across 4 phases.

**data-model.md**: ReminderEvent schema (action, task_id, task_title, user_id, timestamp). CloudEvents envelope. Subscription entity. State transition diagram.

**contracts/notification-contract.md**: POST /on-reminder spec (always 200), publish_reminder_event() interface, Dapr subscription manifest, verification commands.

**quickstart.md**: 7-step implementation guide from mkdir to kubectl logs verification.

## Outcome

- ✅ Impact: Complete technical plan for Phase 5.3 — all design decisions resolved, full code blueprints ready for /sp.tasks
- 🧪 Tests: Constitution check 7/7 PASS; no NEEDS CLARIFICATION markers
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/notification-contract.md
- 🔁 Next prompts: `/sp.tasks` for Phase 5.3 — generate task list from plan.md
- 🧠 Reflection: Plan prompt said "modify task_ops.py" — overridden by Constitution III. Documented as deviation in R-001 and Complexity Tracking. Always 200 from /on-reminder is a critical Dapr pattern — if you return 4xx/5xx Dapr will retry indefinitely and create a message storm.

## Evaluation notes (flywheel)

- Failure modes observed: Plan prompt conflicted with Constitution III (task_ops.py) — resolved by research R-001
- Graders run and results (PASS/FAIL): Constitution check PASS
- Prompt variant (if applicable): sp.plan with 6-point technical requirements
- Next experiment (smallest change to try): n/a
