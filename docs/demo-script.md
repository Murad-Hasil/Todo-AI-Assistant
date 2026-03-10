# TodoAI — 90-Second Demo Script

**Target duration**: 90 seconds
**Environment**: Production (Vercel + HuggingFace Space)
**URLs**:
- Frontend: https://frontend-murad-hasils-projects.vercel.app
- Backend health: https://mb-murad-todo-ai-assistant.hf.space/api/health

---

## Pre-Recording Checklist

- [ ] Open frontend URL in browser — verify it loads
- [ ] Check backend health endpoint — confirm `{"status":"ok"}` (wake up HF Space if cold)
- [ ] Log out of any existing session so recording starts from landing page
- [ ] Screen recorder ready (Loom / OBS)
- [ ] Window size: 1280×720 minimum

---

## Script (90 seconds)

### [0:00 – 0:10] Landing Page
**Action**: Open https://frontend-murad-hasils-projects.vercel.app
**Say/Show**: Landing page with hero section and feature grid loads.
**Expected**: Animated hero, "Get Started" button visible.

---

### [0:10 – 0:22] Sign In
**Action**: Click "Get Started" → `/login` page → enter credentials → submit
**Say/Show**: Login page with mesh gradient background.
**Expected**: Dashboard loads after login.

---

### [0:22 – 0:38] Task CRUD
**Action**:
1. Type `Buy groceries` in the Add Task field → press Enter
2. Task card appears in grid
3. Click the complete toggle → card shows strikethrough

**Say/Show**: Task is created and marked complete in real time.
**Expected**: Task visible in grid, toggle updates state.

---

### [0:38 – 0:58] AI Chatbot
**Action**:
1. Click the chat icon (bottom right) → ChatDrawer opens
2. Type: `"add a task: remind me to call the dentist"` → Send
3. Wait for AI response

**Say/Show**: AI processes the request using MCP tools and confirms task was added.
**Expected**: Response like "Done! I've added the task: remind me to call the dentist."
Task appears in dashboard grid.

---

### [0:58 – 1:12] Chatbot List + Natural Language
**Action**: Type `"show me my tasks"` → Send
**Say/Show**: AI calls `list_tasks` tool and returns the task list.
**Expected**: AI responds with a structured list of current tasks.

---

### [1:12 – 1:30] Event-Driven Notification (K8s demo OR log mention)

**Option A — If K8s is running locally**:
1. Switch to terminal
2. Run: `kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification --tail=5`
3. Show `[REMINDER]: Hey User ..., your task "remind me to call the dentist" is due now!`

**Option B — Fallback (mention in recording)**:
"When this task was created, the backend published a reminder event to Kafka via Dapr. The notification microservice consumed it and logged the delivery. This is the full Phase 5 event-driven pipeline."

---

## Key Features to Highlight (by Phase)

| Phase | Feature shown |
|-------|--------------|
| 1 | (foundational — not shown directly) |
| 2 | Task CRUD, auth (sign in), Neon PostgreSQL |
| 3 | AI chatbot, MCP tool calls, Groq LLM |
| 4 | (K8s — optional terminal shot) |
| 5 | Reminder event → Kafka → Notification service |

---

## Fallback if HF Space is Cold

If the backend takes >10s to respond during recording:
1. Open https://mb-murad-todo-ai-assistant.hf.space/api/health in a new tab
2. Wait for `{"status":"ok"}`
3. Return to frontend and retry

The cold start happens once; subsequent requests are instant.
