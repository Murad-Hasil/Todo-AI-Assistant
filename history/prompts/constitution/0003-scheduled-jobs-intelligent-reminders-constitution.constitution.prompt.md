---
id: "0003"
title: Scheduled Jobs Intelligent Reminders Constitution Update
stage: constitution
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Murad Hasil
command: /sp.constitution
labels: ["constitution","phase5","dapr-jobs","scheduled-jobs","intelligent-reminders","scheduling"]
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

Update the Phase 5 Constitution to include Scheduled Jobs and Intelligent Reminders.

# ADDITION TO MISSION
Implement a high-precision scheduling system using Dapr Jobs API to allow the AI Agent to set future reminders and automate task life-cycles.

# TECHNICAL ADDITIONS
- Runtime API: Dapr Jobs API (v1.0-alpha1 or current stable).
- Logic Flow: AI Agent -> MCP Tool -> Backend -> Dapr Sidecar -> (Wait Time) -> Backend Callback -> Kafka -> Notification Service.

# DEVELOPMENT RULES
- CALLBACK SECURITY: The endpoint for job triggers (`/api/jobs/trigger`) must verify that the request is coming from the local Dapr sidecar (localhost) to prevent spoofing.
- PERSISTENCE: Jobs must be backed by the Neon Direct State Store to ensure they survive cluster restarts.
- TIMEZONES: All scheduled times must be handled in UTC internally and converted to the user's local time in the UI.

# AGENT BEHAVIOR
- The AI must confirm the scheduled time back to the user: "I've scheduled a reminder for you at [Time]."

## Response snapshot

Constitution bumped from v2.2.0 → v2.3.0 (MINOR — two new principles added,
Dapr Jobs API tech stack entry added, Phase 5 Core Features extended, directory
layout updated with jobs.py route and k8s/dapr/jobs.yaml).

New principles added:
- XVI. Dapr Jobs Scheduling — exclusive use of Dapr Jobs API; canonical AI→MCP→Backend→Dapr→Callback→Kafka flow;
    callback security via localhost IP check (HTTP 403 for all other origins);
    Neon Direct State Store for job persistence; UTC-only internal datetime contract
- XVII. Intelligent Reminder Confirmation — agent MUST confirm scheduled time in user's
    local timezone; `schedule_job` MCP tool (separate from `schedule_reminder`);
    Dapr API error surfaces as plain-language failure; Roman Urdu parity with Principle XI

Tech stack additions:
- Dapr Jobs API: `http://localhost:3500/v1.0-alpha1/jobs/<job-name>`
- New env var: `JOBS_CALLBACK_SECRET` (optional hardening layer)

Directory layout additions:
- `backend/app/routes/jobs.py` — POST /api/jobs/schedule + POST /api/jobs/trigger
- `k8s/dapr/jobs.yaml` — Dapr Jobs component manifest

All Phase 2–5.2 principles (I–XV) retained verbatim.

## Outcome

- ✅ Impact: Constitution v2.3.0 ratified — Scheduled Jobs and Intelligent Reminders architectural rules codified
- 🧪 Tests: N/A — constitution document, no executable tests
- 📁 Files: .specify/memory/constitution.md (overwritten)
- 🔁 Next prompts: /sp.specify (Phase 5.5 spec), /sp.plan (Dapr Jobs plan), /sp.adr for Jobs API design decision
- 🧠 Reflection: Two focused principles clearly separate technical scheduling contract (XVI) from agent UX contract (XVII), matching the structure of existing principle pairs (XII/XIII, XIV/XV).

## Evaluation notes (flywheel)

- Failure modes observed: None — clean MINOR version bump with no placeholder leakage
- Graders run and results (PASS/FAIL): Manual validation PASS (no bracket tokens, ISO dates, declarative MUST language throughout)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add ADR for Dapr Jobs API vs. external scheduler (cron CronJob) tradeoff
