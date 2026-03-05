---
id: "0013"
title: Phase 3.3 Frontend Chat UI Implementation
stage: green
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.implement
labels: ["phase3.3", "frontend", "chat-ui", "nextjs", "tailwind", "rtl", "urdu", "router-refresh"]
links:
  spec: todo-web-app/specs/chatbot/ui-design.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/src/lib/api.ts
  - todo-web-app/backend/app/routes/chat.py
  - todo-web-app/frontend/src/app/dashboard/layout.tsx
  - todo-web-app/frontend/src/app/dashboard/page.tsx
  - todo-web-app/frontend/src/components/chat/ChatWindow.tsx
  - todo-web-app/frontend/src/components/chat/MessageBubble.tsx
  - todo-web-app/frontend/src/components/chat/ChatInput.tsx
  - todo-web-app/frontend/CLAUDE.md
  - todo-web-app/specs/chatbot/phase3-ui-tasks.md
tests:
  - none (not requested in spec)
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/chatbot/phase3-ui-tasks.md` for Phase 3.3: Frontend Chat UI.

STRICT IMPLEMENTATION RULES:
1. DIRECTORY ISOLATION: All frontend code must be placed strictly within `/todo-web-app/frontend/`.
2. READ-BEFORE-WRITE: Before generating code, read the Phase 3 Constitution, the Backend Chat API spec (@/todo-web-app/specs/chatbot/api-endpoint.md), and the Phase 3.3 Plan/Tasks.
3. TASK MAPPING: Implement tasks T-3.3.1 through T-3.3.8 in sequence. Every file must include a comment at the top referencing the Task ID, e.g., `// [Task]: T-3.3.x`.
4. CHAT UI LOGIC:
   - Create a floating `ChatWidget` or a side-panel in the `/dashboard` layout.
   - Implement message history fetching so users see their previous conversation on load.
   - Handle the `isProcessing` state to disable input and show a "Typing..." indicator while the Groq AI is thinking.
5. URDU & RTL SUPPORT:
   - Implement a utility to detect Urdu/Arabic characters or use a flag from the backend to apply `dir="rtl"` and an Urdu-friendly font (like Noto Nastaliq or a clean Sans-serif) to specific message bubbles.
6. STATE SYNCHRONIZATION:
   - CRITICAL: When the AI returns a response that includes `tool_calls` (indicating a task was added/updated/deleted), trigger a refresh of the main Todo list data using `router.refresh()` or a shared state update.
7. STYLING:
   - Use Tailwind CSS for a polished, modern chat interface.
   - Distinctive colors for User (e.g., Indigo) vs. Assistant (e.g., Gray/Slate) bubbles.

FILES TO CREATE/UPDATE:
- `/todo-web-app/frontend/components/chat/ChatWindow.tsx`: Main chat logic.
- `/todo-web-app/frontend/components/chat/MessageBubble.tsx`: Individual message rendering.
- `/todo-web-app/frontend/components/chat/ChatInput.tsx`: Input and send logic.
- `/todo-web-app/frontend/app/dashboard/layout.tsx`: Integrate the Chat UI into the dashboard.
- `/todo-web-app/frontend/lib/api.ts`: Ensure chat endpoints are correctly mapped.
- `/todo-web-app/frontend/CLAUDE.md`: Update with Chat UI interaction notes.

## Response snapshot

Implemented all 23 tasks (T001–T023) for Phase 3.3 Frontend Chat UI across 9 files:

**api.ts** — Added 4 TypeScript interfaces (`ChatSendRequest`, `ChatSendResponse`, `ChatHistoryMessage`, `ChatHistoryResponse`) plus `sendChat()` and `getChatHistory()` functions using `fetchWithAuth`.

**backend/routes/chat.py** — Added `GET /{user_id}/conversations/{conversation_id}/messages` route: JWT-protected, ownership guard, 404 on missing conversation, returns messages ordered by `created_at ASC`.

**dashboard/layout.tsx** — Single class change: `max-w-3xl` → `max-w-5xl` to accommodate chat side panel.

**dashboard/page.tsx** — Wrapped content in `grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start`; left column = task management; right column = `<Suspense fallback={null}><ChatWindow userId={userId} /></Suspense>`.

**components/chat/MessageBubble.tsx** — Presentational; indigo-600 user bubbles, slate-100 assistant bubbles; `dir="rtl"` + `text-right` for RTL messages.

**components/chat/ChatInput.tsx** — Textarea (2 rows, maxLength=2000), Send button (lucide-react `<Send>`), Enter-to-send / Shift+Enter-for-newline, character counter, disabled when empty/loading/historyNotLoaded.

**components/chat/ChatWindow.tsx** — Full client component owning all chat state:
- `detectRTL()`: `/[\u0600-\u06FF]/g` regex, >10% threshold
- `TypingIndicator`: 3 bounce dots with staggered animation-delay; label "Updating Tasks…" / "Fetching Tasks…" / "Thinking…"
- History fetch on mount with `cancelled` flag pattern
- Optimistic user bubble append before API call
- `router.replace()` to sync `conversation_id` to URL (not `push`)
- `router.refresh()` after write tool_calls (not `revalidatePath` — unavailable in client context)
- 3 auto-scroll `useEffect` hooks (instant on history load, smooth on messages/isLoading)
- Inline error banner with role-specific error messages
- `role="log"` `aria-live="polite"` on message container

**frontend/CLAUDE.md** — Updated to Phase 3.3; added chat component directory tree, interaction notes, RTL guide, tool status label logic, and error-mapping table.

**phase3-ui-tasks.md** — T001–T023 marked `[x]`.

## Outcome

- ✅ Impact: Complete Phase 3.3 Frontend Chat UI — AI chat side panel integrated into dashboard; users can manage tasks via natural language; Urdu/Arabic RTL rendering supported; conversation history persists via URL query param.
- 🧪 Tests: No automated tests (not requested in spec). Manual verification criteria defined in tasks file: T-3.3.5 (send/receive), T-3.3.8 (add milk → appears in task list without refresh).
- 📁 Files: 7 modified/created source files + 2 documentation updates
- 🔁 Next prompts: T024 (manual Phase 2 smoke test); run `npm run build` to verify no TypeScript errors; deploy and test end-to-end with live Groq backend.
- 🧠 Reflection: Key decision — used `router.refresh()` not `revalidatePath` (client component constraint). Side panel chosen over floating widget (max-w-3xl layout makes overlay impractical). `useSearchParams()` Suspense requirement caught at planning stage. Backend history endpoint added proactively since it was missing.

## Evaluation notes (flywheel)

- Failure modes observed: `layout.tsx` Edit failed on first attempt (file not read first); `research.md` write blocked by existing Phase 3.1 content; PHR #0012 required read-before-write. All resolved with read-first pattern.
- Graders run and results (PASS/FAIL): None (no automated test suite for frontend)
- Prompt variant (if applicable): sp.implement with explicit file list and color scheme constraints
- Next experiment (smallest change to try): Add `npm run build` step after implementation to catch TypeScript errors before manual testing
