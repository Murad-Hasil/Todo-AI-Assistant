---
id: "0004"
title: Browser Notifications Implementation
stage: green
date: 2026-04-08
surface: agent
model: claude-sonnet-4-6
feature: 016-browser-notifications
branch: main
user: Murad Hasil
command: /sp.implement
labels: ["green", "notifications", "browser", "polling", "toast", "fastapi", "next.js"]
links:
  spec: specs/016-browser-notifications/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/models.py
  - todo-web-app/backend/app/schemas.py
  - todo-web-app/backend/migrations/versions/004_add_notifications_table.py
  - todo-web-app/backend/app/logic/events.py
  - todo-web-app/backend/app/routes/notifications.py
  - todo-web-app/backend/app/main.py
  - todo-web-app/frontend/src/lib/api.ts
  - todo-web-app/frontend/src/components/NotificationPoller.tsx
  - todo-web-app/frontend/src/components/dashboard/DashboardShell.tsx
  - specs/016-browser-notifications/tasks.md
tests:
  - T020 (localhost E2E — pending K8s redeploy)
  - T021 (Vercel smoke — pending HF deploy)
---

## Prompt

016-browser-notifications (continued from previous session via /sp.implement)

## Response snapshot

Implemented all 17 implementation tasks (T001–T017) for feature 016-browser-notifications across backend and frontend.

Backend changes (git submodule):
- T003: UserNotification SQLModel added to models.py
- T004: NotificationRead + NotificationsReadAllResponse schemas added to schemas.py
- T005: Alembic migration 004_add_notifications_table.py created (stamped as applied — table existed from init_db)
- T007: publish_reminder_event() now calls save_reminder_notification() after successful Dapr publish (204)
- T008+T009: app/routes/notifications.py — GET /api/{user_id}/notifications + POST /api/{user_id}/notifications/read-all
- T010: notifications router registered in main.py

Frontend changes:
- T011: getNotifications() + markNotificationsRead() added to api.ts with Notification interface type
- T012: NotificationPoller.tsx created — useCallback + useRef patterns, immediate first poll + 10s interval, Web Notifications API + in-app toast strip with auto-dismiss at 8s + manual dismiss button
- T013: Mounted <NotificationPoller userId={userId} /> in DashboardShell.tsx

Deploys launched in background: Docker rebuild (T018) + HF Space deploy (T019).

## Outcome

- ✅ Impact: Full browser notification pipeline — OS native popup + in-app glass toast for every reminder that fires
- 🧪 Tests: T020 (local E2E smoke) + T021 (Vercel smoke) — pending deploy completion
- 📁 Files: 9 files modified/created across backend + frontend
- 🔁 Next prompts: T020 smoke test after Docker rebuild; T021 after HF deploy; then Vercel frontend deploy
- 🧠 Reflection: Mounted NotificationPoller in DashboardShell (client component) rather than layout.tsx (server component) — cleaner architecture, no need for layout refactor

## Evaluation notes (flywheel)

- Failure modes observed: Migration number mismatch (expected 003, was 004 due to prior 003 migration); resolved with alembic stamp
- Graders run and results (PASS/FAIL): N/A (pending E2E)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): T020 localhost smoke test after K8s redeploy
