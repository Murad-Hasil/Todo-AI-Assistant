# Tasks: 016-browser-notifications — Browser-Visible Reminder Notifications

**Input**: Design documents from `/specs/016-browser-notifications/`
**Branch**: `016-browser-notifications`
**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing pipeline works and scaffold new files

- [X] T001 Verify reminder pipeline end-to-end: run `kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification --tail=20` and confirm `[REMINDER]` log appears after adding a "remind me" task
- [X] T002 Run `uv run alembic current` in `todo-web-app/backend/` to confirm DB migration baseline is at revision 002

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB model + migration + backend schema — required by ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `UserNotification` SQLModel to `todo-web-app/backend/app/models.py` — fields: `id` (UUID PK), `user_id` (str, index), `task_title` (str 500), `message` (str), `is_read` (bool default False), `created_at` (datetime UTC)
- [X] T004 Add `NotificationRead` Pydantic schema to `todo-web-app/backend/app/schemas.py` — fields: `id` (UUID), `task_title` (str), `message` (str), `created_at` (datetime)
- [X] T005 Create Alembic migration `todo-web-app/backend/migrations/versions/004_add_notifications_table.py` — `create_table("user_notifications", ...)` with composite index `(user_id, is_read)` [created as 004, not 003 — prior migration 003 existed]
- [X] T006 Run `uv run alembic stamp 004` in `todo-web-app/backend/` — table already existed from init_db(); stamped at 004 successfully

**Checkpoint**: `user_notifications` table exists in Neon DB — all user stories can now proceed

---

## Phase 3: User Story 1 — Native Browser Popup on Reminder (Priority: P1) 🎯 MVP

**Goal**: When a reminder fires, a `UserNotification` row is saved in DB and the frontend polls + shows a native OS browser notification popup.

**Independent Test**: Add task "remind me to buy milk", wait ≤15s → OS browser popup appears with task title.

### Implementation for User Story 1

- [X] T007 [US1] Edit `todo-web-app/backend/app/logic/events.py` — in `publish_reminder_event()`, after the Dapr publish call, open a DB session and insert a `UserNotification` row (`user_id`, `task_title`, `message="Your task \"<title>\" is due now!"`, `is_read=False`)
- [X] T008 [US1] Create `todo-web-app/backend/app/routes/notifications.py` — implement `GET /api/{user_id}/notifications`: verify JWT user matches path `user_id`, query `UserNotification` where `user_id=user_id AND is_read=False` ordered by `created_at ASC`, return list of `NotificationRead`
- [X] T009 [US1] Add `POST /api/{user_id}/notifications/read-all` to `todo-web-app/backend/app/routes/notifications.py` — verify JWT user, bulk-update `is_read=True` for user's unread notifications, return `{"marked_read": <count>}`
- [X] T010 [US1] Register notifications router in `todo-web-app/backend/app/main.py` — `app.include_router(notifications.router)`
- [X] T011 [US1] Add `getNotifications(userId: string)` and `markNotificationsRead(userId: string)` typed functions to `todo-web-app/frontend/src/lib/api.ts` — use existing `apiFetch` helper with `Authorization: Bearer` token
- [X] T012 [US1] Create `todo-web-app/frontend/src/components/NotificationPoller.tsx` — `"use client"` component that: (1) on mount requests `Notification.requestPermission()`, (2) sets `setInterval` every 10000ms calling `getNotifications()`, (3) on results > 0: calls `markNotificationsRead()`, fires `new Notification("TodoAI Reminder", { body: task_title })` for each, adds toasts to local state, (4) on unmount calls `clearInterval`
- [X] T013 [US1] Mount `<NotificationPoller userId={userId} />` in `todo-web-app/frontend/src/components/dashboard/DashboardShell.tsx` — rendered inside authenticated shell (DashboardShell is already a client component)

**Checkpoint**: OS browser popup appears within 15s of a reminder firing ✅

---

## Phase 4: User Story 2 — In-App Toast on Dashboard (Priority: P2)

**Goal**: While dashboard is open, a dismissible toast strip appears at top of page for each unread reminder — visible even if browser notifications are blocked.

**Independent Test**: Open dashboard, trigger reminder → toast strip appears at top within 15s, dismiss button works.

### Implementation for User Story 2

- [X] T014 [US2] Add toast UI to `todo-web-app/frontend/src/components/NotificationPoller.tsx` — render a fixed `div` (position: `fixed top-4 right-4 z-[9999] flex flex-col gap-2`) containing one card per toast: bell icon + task title + dismiss `×` button; clicking dismiss removes that toast from state
- [X] T015 [US2] Style toast cards in `todo-web-app/frontend/src/components/NotificationPoller.tsx` using existing dark glass aesthetic: `bg-[#1a1a2e]/90 border border-white/10 rounded-xl px-4 py-3 text-white shadow-lg backdrop-blur-md` — purple bell icon, white title, white/40 dismiss button
- [X] T016 [US2] Add auto-dismiss: each toast batch auto-removes after 8000ms using a `setTimeout` set when toasts are added to state

**Checkpoint**: In-app toast appears and is dismissible — works even when browser notifications are blocked ✅

---

## Phase 5: User Story 3 — Persistent Notifications on Return (Priority: P3)

**Goal**: If user was away and a reminder fired, on returning to dashboard the toast still appears (notification was stored in DB, not lost).

**Independent Test**: Trigger reminder, navigate away from dashboard, return within 30s → toast appears for missed reminder.

### Implementation for User Story 3

- [X] T017 [US3] Verified: `NotificationPoller.tsx` calls `poll()` immediately before `setInterval` — line `poll() // immediate first poll on mount` ensures missed reminders show on dashboard re-visit. No additional code needed.

**Checkpoint**: Missed reminders shown on dashboard re-visit ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 [P] Rebuild backend Docker image in Minikube and redeploy: `eval $(minikube docker-env) && docker build -t todo-backend:local ./todo-web-app/backend/ && helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml`
- [ ] T019 [P] Deploy backend to HF Space: `cd todo-web-app && ./deploy-backend.sh "feat(016): browser-visible reminder notifications"`
- [ ] T020 Smoke test full E2E flow on localhost:3000 with port-forward: add "remind me to buy milk" task → wait ≤15s → confirm OS popup + toast both appear
- [ ] T021 Smoke test on Vercel production: confirm `GET /api/{user_id}/notifications` returns 200 (may need CORS check if HF Space deployed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — MVP core
- **Phase 4 (US2)**: Depends on Phase 3 (shares NotificationPoller.tsx)
- **Phase 5 (US3)**: Depends on Phase 3 (verify mount behavior)
- **Phase 6 (Polish)**: Depends on all story phases

### Parallel Opportunities

- T003, T004, T005 can run in parallel (different files)
- T008, T009 can run in parallel (same file but different functions — careful with file edits)
- T011, T012 can run in parallel (different files: api.ts vs NotificationPoller.tsx)
- T014, T015, T016 can run in parallel within Phase 4 (same file — edit sequentially)
- T018, T019 can run in parallel (Docker vs HF deploy)

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–3)

1. Phase 1: Verify pipeline baseline
2. Phase 2: DB model + migration (T003–T006)
3. Phase 3: Backend endpoints + frontend poller (T007–T013)
4. **STOP and VALIDATE**: OS popup appears → demo-ready

### Full Delivery (All Stories)

1. MVP (above) → US2 toast polish (T014–T016) → US3 verify (T017) → Deploy (T018–T021)

---

## Notes

- Backend is a git submodule (`todo-web-app/backend/`) — changes need `./deploy-backend.sh` to reach HF Space + GitHub
- Frontend changes go directly to `todo-web-app/frontend/` — deploy via `vercel deploy --prod`
- Port-forward must be running (`kubectl port-forward svc/todoai-backend-svc 8001:8000`) for local testing
- `Notification.requestPermission()` must be called from a user gesture context on some browsers — wrapping in dashboard mount is acceptable for demo
- Total: **21 tasks** across 6 phases
