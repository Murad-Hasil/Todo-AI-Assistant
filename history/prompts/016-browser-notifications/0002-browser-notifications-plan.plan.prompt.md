---
id: "0002"
title: Browser Notifications Plan
stage: plan
date: 2026-04-08
surface: agent
model: claude-sonnet-4-6
feature: 016-browser-notifications
branch: 016-browser-notifications
user: Murad Hasil
command: /sp.plan
labels: ["plan", "notifications", "browser", "dapr", "alembic", "polling"]
links:
  spec: specs/016-browser-notifications/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/016-browser-notifications/plan.md
  - specs/016-browser-notifications/data-model.md
  - specs/016-browser-notifications/contracts/GET_notifications.md
  - specs/016-browser-notifications/contracts/POST_notifications_read.md
tests:
  - null
---

## Prompt

016-browser-notifications

## Response snapshot

Plan complete. Architecture: UserNotification DB table (Alembic 003), save in publish_reminder_event(), GET /api/{user_id}/notifications + POST /api/{user_id}/notifications/read-all, NotificationPoller frontend component (10s polling + Web Notifications API + in-app toast). All 9 constitution gates pass. No new npm packages or K8s changes required.

## Outcome

- ✅ Impact: Full implementation plan ready — backend + frontend changes clearly defined
- 🧪 Tests: E2E smoke test defined: task add → reminder fires → OS popup visible
- 📁 Files: plan.md, data-model.md, contracts/GET_notifications.md, contracts/POST_notifications_read.md
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: Polling approach chosen over SSE/WebSockets — simpler, works with WSL2 port-forward, sufficient for demo

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): All 9 constitution gates PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): /sp.tasks
