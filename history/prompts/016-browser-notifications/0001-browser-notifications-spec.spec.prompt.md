---
id: "0001"
title: Browser Notifications Spec
stage: spec
date: 2026-04-08
surface: agent
model: claude-sonnet-4-6
feature: 016-browser-notifications
branch: 016-browser-notifications
user: Murad Hasil
command: /sp.specify
labels: ["spec", "notifications", "browser", "reminder", "dapr", "frontend"]
links:
  spec: specs/016-browser-notifications/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/016-browser-notifications/spec.md
tests:
  - null
---

## Prompt

Browser-visible reminder notifications — when a reminder fires via Dapr Jobs/PubSub pipeline, the user should see a native OS browser notification popup AND an in-app toast on the dashboard. Backend needs a notifications table (Alembic migration), save notification in publish_reminder_event(), and GET /api/{user_id}/notifications + POST mark-read endpoints. Frontend needs a NotificationPoller component that polls every 10s, requests browser notification permission, shows native OS popup via Web Notifications API, and shows an in-app toast strip on the dashboard. Feature name: 016-browser-notifications

## Response snapshot

Spec created at specs/016-browser-notifications/spec.md. Branch 016-browser-notifications created. 3 user stories defined (P1: native browser popup, P2: in-app toast, P3: persistent on return). 10 functional requirements, 5 success criteria. Key entity: UserNotification (id, user_id, task_title, message, is_read, created_at).

## Outcome

- ✅ Impact: Spec complete — browser-visible reminder notifications fully specified
- 🧪 Tests: Acceptance scenarios defined for all 3 user stories
- 📁 Files: specs/016-browser-notifications/spec.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Feature fills critical gap — reminder pipeline was invisible to user; now spec'd for OS popup + in-app toast

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): /sp.plan
