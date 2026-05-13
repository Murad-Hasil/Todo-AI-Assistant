---
id: "0003"
title: Browser Notifications Tasks
stage: tasks
date: 2026-04-08
surface: agent
model: claude-sonnet-4-6
feature: 016-browser-notifications
branch: 016-browser-notifications
user: Murad Hasil
command: /sp.tasks
labels: ["tasks", "notifications", "browser", "alembic", "polling", "toast"]
links:
  spec: specs/016-browser-notifications/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/016-browser-notifications/tasks.md
tests:
  - null
---

## Prompt

016-browser-notifications

## Response snapshot

tasks.md generated with 21 tasks across 6 phases. Phase 2 foundational: UserNotification model + Alembic 003 migration. Phase 3 US1 MVP: events.py save + 2 endpoints + api.ts helpers + NotificationPoller component + layout mount. Phase 4 US2: toast UI + auto-dismiss. Phase 5 US3: mount verification. Phase 6: Docker rebuild + HF deploy + E2E smoke.

## Outcome

- ✅ Impact: 21 immediately executable tasks with exact file paths
- 🧪 Tests: T020 (localhost E2E) and T021 (Vercel smoke)
- 📁 Files: specs/016-browser-notifications/tasks.md
- 🔁 Next prompts: /sp.implement
- 🧠 Reflection: US3 verification only — polling on mount already handles persistence

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): /sp.implement
