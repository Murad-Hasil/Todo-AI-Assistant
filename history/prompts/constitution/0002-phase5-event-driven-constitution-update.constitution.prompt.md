---
id: "0002"
title: Phase 5 Event-Driven Constitution Update
stage: constitution
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.constitution
labels: ["constitution","phase5","kafka","dapr","event-driven","distributed"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (constitution document — no executable tests)
---

## Prompt

Generate the final constitution for Phase 5: Advanced Cloud Deployment based on the Project PDF (Pages 24-36) with the following strict constraints:

# MISSION
Transform the Todo AI App into an event-driven distributed system using Kafka for messaging and Dapr for microservices orchestration.

# TECHNICAL STACK
- Messaging: Kafka (via Redpanda Cloud or Strimzi Operator).
- Distributed Runtime: Dapr (Pub/Sub, State Management, Bindings).
- Cloud Deployment: Local deployment on Minikube with Dapr sidecars.
- Language: Python 3.13 (FastAPI) with Dapr SDK / HTTP calls.

# CORE FEATURES (EVENT-DRIVEN)
1. Reminder/Notification System: Use Kafka topics (`reminders`) to trigger alerts.
2. Recurring Task Engine: Automatically spawn new tasks based on events.
3. Activity/Audit Log: Every CRUD operation must publish an event to Kafka (`task-events`).
4. Real-time Sync: Use WebSockets or Dapr Pub/Sub for cross-client updates.

# ARCHITECTURAL RULES
1. LOOSE COUPLING: Services must not call each other directly; use Dapr Service Invocation or Kafka Events.
2. SIDE CAR PATTERN: Every pod (Frontend/Backend) must have a Dapr sidecar.
3. ABSTRACTION: Use Dapr APIs to talk to Kafka/PostgreSQL so the code remains infrastructure-independent.

# DIRECTORY STRUCTURE
- Dapr Components: `/todo-web-app/k8s/dapr/`
- Notification Service: `/todo-web-app/services/notification/` (New microservice).

# AGENT BEHAVIOR
- Implement robust retry logic for event publishing.
- Ensure the AI Agent can trigger "Reminders" via MCP tools that interact with the Event Bus.

## Response snapshot

Constitution bumped from v2.1.0 → v2.2.0 (MINOR — four new principles added,
Phase 5 tech stack and directory layout extended, no existing principles modified).

New principles added:
- XII. Event-Driven Architecture — loose coupling via Kafka/Dapr only; no direct HTTP
- XIII. Dapr Sidecar Pattern — every pod carries a Dapr sidecar; manifests in k8s/dapr/
- XIV. Infrastructure Abstraction — code uses Dapr API only; no raw Kafka client libs
- XV. Event Publishing Reliability — retry with backoff; idempotent consumers; MCP tool

Phase 5 Core Features added: Audit Log, Reminder/Notification, Recurring Task Engine,
Real-time Sync, AI-Triggered Reminders (schedule_reminder MCP tool).

Directory layout extended with `services/notification/` and `k8s/dapr/` subtrees.
All Phase 2–4 principles (I–XI) retained verbatim.

## Outcome

- ✅ Impact: Constitution v2.2.0 ratified — Phase 5 architectural rules codified
- 🧪 Tests: N/A — constitution document, no executable tests
- 📁 Files: .specify/memory/constitution.md (overwritten)
- 🔁 Next prompts: /sp.specify (Phase 5 spec), /sp.plan (Phase 5 plan), /sp.adr for Kafka+Dapr decisions
- 🧠 Reflection: Four focused principles cleanly encode all Phase 5 constraints without disrupting existing gates.

## Evaluation notes (flywheel)

- Failure modes observed: None — clean MINOR version bump with no placeholder leakage
- Graders run and results (PASS/FAIL): Manual validation PASS (no bracket tokens, ISO dates, declarative language)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add ADR for Kafka broker choice (Redpanda vs Strimzi)
