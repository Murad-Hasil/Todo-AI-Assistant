---
id: "0005"
title: Notification Toast Debug and Fix
stage: green
date: 2026-04-09
surface: agent
model: claude-sonnet-4-6
feature: 016-browser-notifications
branch: 016-browser-notifications
user: Murad Hasil
command: debug notification toast not appearing + fix themeColor warning
labels: ["debug","fix","notifications","metadata","playwright","k8s"]
links:
  spec: specs/016-browser-notifications/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/routes/tasks.py
  - todo-web-app/frontend/src/app/layout.tsx
tests:
  - Playwright MutationObserver: toastAppeared=true (confirmed)
  - Backend evaluate: notifCount=1 after task creation (confirmed)
  - K8s pod grep: save_reminder_notification present at line 149 (confirmed)
  - HF Space: deployed commit 3fd0f84
---

## Prompt

Mere pas mujhe local pe koi notification toast nahi dekha raha, our frontend logs main mujhe ye har dafa frontend run karne pe unsuppoted matadata dekha deta ha isko bhi sai kar do, our notification bhi check kar lo tum khud locally apne playwright mcp ke sath.

## Response snapshot

**Root cause (notification):** Commit `fe962f3` moved `save_reminder_notification()` from `publish_reminder_event()` to `jobs.py` Dapr callback only. On HF Space and local K8s port-forward, Dapr Jobs never fires → notification row never written → poller gets empty array → no toast.

**Fix (notification):** Added direct `background_tasks.add_task(save_reminder_notification, task.title, user_id)` in `tasks.py` `create_task` handler — independent of Dapr availability.

**Root cause (metadata):** Next.js 16 moved `themeColor` from `Metadata` to `Viewport` export. `layout.tsx` was still using old `metadata.themeColor`.

**Fix (metadata):** Added `export const viewport: Viewport = { themeColor: "#0f172a" }` to `layout.tsx`, removed from `metadata`.

**Playwright verification:**
- Backend evaluate: task created → `notifCount: 1` ✅
- MutationObserver: `toastAppeared: true` with correct HTML (purple bell, dark glass) ✅
- K8s REVISION 9 deployed, pod verified with grep ✅
- HF Space deployed commit 3fd0f84 ✅

**Port-forward note:** Pod restart (REVISION 9) broke the port-forward. Restarted via `kubectl port-forward svc/todoai-backend-svc 8001:8000`.

## Outcome

- ✅ Impact: Notification toasts now work on both HF Space (production) and K8s (local) — Dapr-independent save on task creation
- 🧪 Tests: Playwright MutationObserver confirmed toast DOM appears; backend evaluate confirmed DB row saved
- 📁 Files: tasks.py (1 import + 1 line), layout.tsx (viewport export added, themeColor removed from metadata)
- 🔁 Next prompts: Vercel frontend deploy with themeColor fix; cleanup test tasks
- 🧠 Reflection: The timing fix commit (fe962f3) was correct for K8s Dapr Jobs semantics but broke production (HF Space). Dual-path save (tasks.py immediate + jobs.py at scheduled time) is the correct cross-environment solution.

## Evaluation notes (flywheel)

- Failure modes observed: Auto-dismiss (8s) makes toast easy to miss; port-forward breaks on pod restart silently
- Graders run and results (PASS/FAIL): MutationObserver PASS; backend API eval PASS; K8s grep PASS
- Prompt variant (if applicable): null
- Next experiment: Increase auto-dismiss to 12s or add a persistent notification bell icon counter
