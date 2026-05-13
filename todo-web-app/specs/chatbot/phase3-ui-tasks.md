# Tasks: Phase 3.3 — Frontend Chat UI

**Input**: `todo-web-app/specs/chatbot/phase3-ui-plan.md` + `ui-design.md` + `ui-logic.md`
**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-04

**Organization**: Grouped by user story — each phase is an independently testable increment.
**Tests**: Not included (not requested in spec).
**Task ID reference**: T-3.3.x IDs from user request are noted inline.

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no shared state dependencies)
- **[USn]**: User story this task belongs to
- All file paths are relative to `todo-web-app/frontend/src/`

---

## Phase 1: Setup — API Client & Backend Route

**Purpose**: Add `sendChat` and `getChatHistory` to the API client; add history endpoint to backend. These are the only shared prerequisites — all component work can begin in parallel once Phase 1 is complete.

**⚠️ CRITICAL**: T001 (API types) must complete before T004 (ChatPanel state). All other Phase 1 tasks are independent of each other.

- [x] T001 [T-3.3.1] Add `ChatSendRequest`, `ChatSendResponse`, `ChatHistoryMessage`, `ChatHistoryResponse` TypeScript interfaces to `lib/api.ts` (append to the types section after `SortOrder`)
- [x] T002 [P] [T-3.3.5] Add `sendChat(userId, message, conversationId?)` function to `lib/api.ts` — calls `fetchWithAuth` on `POST /api/${userId}/chat`, returns `ChatSendResponse`
- [x] T003 [P] [T-3.3.4] Add `getChatHistory(userId, conversationId)` function to `lib/api.ts` — calls `fetchWithAuth` on `GET /api/${userId}/conversations/${conversationId}/messages`, returns `ChatHistoryResponse`
- [x] T004 [P] [T-3.3.4] Add `GET /{user_id}/conversations/{conversation_id}/messages` route to `todo-web-app/backend/app/routes/chat.py` — JWT-protected, returns messages ordered by `created_at` ASC, reuses existing `Conversation`, `Message` models and `get_current_user_id` dependency

**Checkpoint**: `lib/api.ts` exports `sendChat` and `getChatHistory`. Backend returns message history for a valid conversation UUID.

---

## Phase 2: Foundational — Dashboard Layout Expansion

**Purpose**: Widen the dashboard to a two-column grid to accommodate the chat side panel. This change unblocks all component integration tasks.

**⚠️ CRITICAL**: Must complete before ChatPanel can be mounted in `dashboard/page.tsx`.

- [x] T005 [T-3.3.2] Widen `<main>` in `app/dashboard/layout.tsx` from `max-w-3xl` to `max-w-5xl` (single class change; nav stays at `max-w-3xl`)
- [x] T006 [T-3.3.2] Wrap dashboard content in `app/dashboard/page.tsx` with a two-column grid: `<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">` — left column holds existing task management UI; right column is a `<Suspense fallback={null}>` placeholder for `ChatPanel`

**Checkpoint**: Dashboard renders a two-column layout on `lg+` viewports. Task list appears in the left column. Right column is empty (Suspense fallback). No existing Phase 2 components are broken.

---

## Phase 3: User Story 1 — Send & Receive Messages (Priority: P1) 🎯 MVP

**Goal**: A user can type a message, submit it, and see their message and the assistant's reply as styled bubbles. The chat panel is visible in the dashboard.

**Independent Test (T-3.3.5)**: Open the Dashboard. Type "Add buy milk to my tasks" in the chat input. Press Enter. A user bubble appears immediately. A typing indicator appears. When the AI responds, the typing indicator disappears and an assistant bubble shows the reply. Verify by checking `POST /api/{userId}/chat` in network inspector.

- [x] T007 [P] [T-3.3.1] [US1] Create `components/ChatMessageBubble.tsx` as a `"use client"` presentational component — accepts `{ message: ChatMessage }` prop; renders `justify-end` for `role="user"` (bubble: `bg-blue-600 text-white rounded-2xl rounded-br-sm max-w-[75%] px-4 py-2.5 text-sm`) and `justify-start` for `role="assistant"` (bubble: `bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm max-w-[75%] px-4 py-2.5 text-sm`); includes `// [Task]: T-3.3.1` comment
- [x] T008 [P] [T-3.3.1] [US1] Create `components/TypingIndicator.tsx` as a `"use client"` presentational component — accepts `{ lastToolCalls: string[] }` prop; renders three `animate-bounce` dots with `[animation-delay:-0.3s]`, `-0.15s`, and `0s` stagger; shows `getStatusLabel(lastToolCalls)` text beside dots; label logic: write tools (`add_task`, `update_task`, `delete_task`, `complete_task`) → `"Updating Tasks…"`, `list_tasks` → `"Fetching Tasks…"`, empty → `"Thinking…"`; includes `// [Task]: T-3.3.1` comment
- [x] T009 [T-3.3.1] [T-3.3.3] [US1] Create `components/ChatPanel.tsx` as a `"use client"` component — define `ChatMessage` interface (`id`, `role`, `content`, `isRTL: boolean`, `createdAt`) and `ConversationState` interface (`conversationId: string | null`, `messages: ChatMessage[]`, `isLoading: boolean`, `lastToolCalls: string[]`, `error: string | null`); import `useRouter`, `useSearchParams`, `useState`, `useEffect`, `useRef` from React/Next.js; initialize state from `useSearchParams().get("conversation_id")`; render empty panel shell with header ("AI Assistant"), scrollable message area (`role="log"` `aria-live="polite"`), and input area; includes `// [Task]: T-3.3.1` and `// [Task]: T-3.3.3` comments
- [x] T010 [T-3.3.2] [T-3.3.5] [US1] Implement the `handleSend` function in `components/ChatPanel.tsx` — on submit: (1) append optimistic user `ChatMessage` (`id: opt-${Date.now()}`) to `state.messages`; (2) set `isLoading: true`, clear `error`; (3) call `sendChat(userId, text, state.conversationId ?? undefined)` from `lib/api.ts`; (4) on success: append assistant bubble to `state.messages`, set `conversationId` from response, set `lastToolCalls`, set `isLoading: false`; (5) call `router.replace(\`/dashboard?conversation_id=${data.conversation_id}\`, { scroll: false })` on first response; handle errors per error-mapping table (see plan Section 3.1); includes `// [Task]: T-3.3.5` comment
- [x] T011 [T-3.3.2] [US1] Implement `ChatInput` UI inside `components/ChatPanel.tsx` — `<textarea>` with `aria-label="Message the AI assistant"`, `rows={2}`, `maxLength={2000}`, `onKeyDown` handler (Enter sends, Shift+Enter newlines); Send `<button>` with `<Send size={16} />` icon from `lucide-react`, `aria-label="Send message"`, disabled when `inputText.trim().length === 0 || state.isLoading`; character count `{inputText.length}/2000`; all styled with Phase 2 Tailwind tokens (`border-gray-300`, `focus:ring-blue-500`, `bg-blue-600`); includes `// [Task]: T-3.3.2` comment
- [x] T012 [T-3.3.2] [US1] Mount `<ChatPanel userId={userId} />` inside `<Suspense fallback={null}>` in the right grid column of `app/dashboard/page.tsx`; import `ChatPanel` and `Suspense`; pass `userId` from the session; includes `// [Task]: T-3.3.2` comment
- [x] T013 [T-3.3.2] [US1] Apply chat panel container styling in `components/ChatPanel.tsx` — outer div: `bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-8rem)] lg:sticky lg:top-8 min-h-[400px]`; message area: `flex-1 overflow-y-auto px-4 py-3 space-y-3`; include empty-state text ("Ask me to add, view, or manage your tasks.") when `messages.length === 0 && !isLoading`; render `<ChatMessageBubble>` for each message and `<TypingIndicator>` when `isLoading`; includes `// [Task]: T-3.3.2` comment

**Checkpoint (T-3.3.5 verified)**: A user message sent via the chat input produces a user bubble and, after AI response, an assistant bubble. The Send button is disabled during processing. Network inspector shows `POST /api/{userId}/chat` with `Authorization: Bearer <jwt>`.

---

## Phase 4: User Story 2 — Chat History & Conversation Threading (Priority: P1)

**Goal**: A user's previous messages are visible after a page refresh. Every new message sent in a session is threaded to the same conversation via `conversationId`.

**Independent Test (T-3.3.4)**: Complete a 2-turn conversation. Note the `?conversation_id=<UUID>` in the URL. Reload the page. Verify both prior messages appear in the chat window without sending a new message.

- [x] T014 [T-3.3.4] [US2] Implement history-fetch `useEffect` in `components/ChatPanel.tsx` — on mount: if `urlConversationId` is truthy, call `getChatHistory(userId, urlConversationId)`; map `ChatHistoryMessage[]` to `ChatMessage[]` with `isRTL` computed via `detectRTL(content)`; set `state.messages`; on `NotFoundError`: clear `conversationId` from state and call `router.replace("/dashboard", { scroll: false })`; on all other errors: fall through silently (preserve `conversationId`); use `cancelled` cleanup flag; set `historyLoaded = true` in `finally`; input disabled until `historyLoaded` is `true`; includes `// [Task]: T-3.3.4` comment
- [x] T015 [T-3.3.3] [T-3.3.8] [US2] Implement task-list refresh in `handleSend` inside `components/ChatPanel.tsx` — after successful `sendChat` response, if `data.tool_calls.some(t => WRITE_TOOLS.has(t))` (where `WRITE_TOOLS = new Set(["add_task", "complete_task", "delete_task", "update_task"])`), call `router.refresh()` to re-run Server Component data fetches for `/dashboard`; includes `// [Task]: T-3.3.3` and `// [Task]: T-3.3.8` comments
- [x] T016 [T-3.3.3] [US2] Ensure `conversationId` is synced to URL in `components/ChatPanel.tsx` — on first successful response when `state.conversationId` was `null`, call `router.replace(\`/dashboard?conversation_id=${data.conversation_id}\`, { scroll: false })`; on `NotFoundError` from history fetch or send, call `router.replace("/dashboard", { scroll: false })` and reset `conversationId` to `null`; includes `// [Task]: T-3.3.3` comment

**Checkpoint (T-3.3.8 verified)**: Type "Add buy milk" in chat. AI confirms task created. Without reloading, the milk task appears in the todo list on the left. Reload the page — both prior chat messages are still visible. URL contains `?conversation_id=<UUID>`.

---

## Phase 5: User Story 3 — Auto-Scroll & Typing Indicator UX (Priority: P2)

**Goal**: The chat window always scrolls to show the latest message. A typing indicator with contextual tool status is visible during AI processing.

**Independent Test (T-3.3.6)**: Render a chat window with 30 messages. Verify the scroll position is at the bottom without manual scrolling. Send a new message — typing indicator appears immediately. When AI responds, indicator disappears and new assistant bubble is scrolled into view.

- [x] T017 [T-3.3.6] [US3] Implement auto-scroll logic in `components/ChatPanel.tsx` using three `useEffect` hooks: (1) after `state.messages` changes AND `historyLoaded` is `true` → `bottomRef.current?.scrollIntoView({ behavior: "smooth" })`; (2) after `historyLoaded` becomes `true` → `bottomRef.current?.scrollIntoView({ behavior: "instant" })` (no distracting scroll from top on initial load); (3) after `state.isLoading` becomes `true` → `bottomRef.current?.scrollIntoView({ behavior: "smooth" })` (scroll to typing indicator immediately); place `<div ref={bottomRef} aria-hidden="true" />` as the last child of the message area; includes `// [Task]: T-3.3.6` comment
- [x] T018 [T-3.3.6] [US3] Wire `<TypingIndicator lastToolCalls={state.lastToolCalls} />` into the message area of `components/ChatPanel.tsx` — render only when `state.isLoading` is `true`; `lastToolCalls` carries the tool_calls array from the **previous** response (predicts what the current call will do); verify animated dots render correctly with staggered bounce via `[animation-delay:-0.3s]` / `[animation-delay:-0.15s]` Tailwind arbitrary values; includes `// [Task]: T-3.3.6` comment

**Checkpoint**: Sending any message shows the typing indicator within 100ms. Label reads "Updating Tasks…" after a prior task-modifying message, or "Thinking…" on first message. Scroll position follows the latest content automatically.

---

## Phase 6: User Story 4 — Urdu RTL Rendering (Priority: P2)

**Goal**: Assistant messages containing Urdu script (Arabic Unicode block) render right-to-left with correct text direction. Roman Urdu (Latin script) renders left-to-right as expected.

**Independent Test (T-3.3.7)**: Hard-code a mock assistant message containing `"آپ کا کام شامل ہو گیا"` (Urdu script). Render the bubble. Verify `dir="rtl"` and `text-right` are applied to that bubble only. Verify a Latin-script bubble in the same list uses `dir="ltr"`.

- [x] T019 [T-3.3.7] [US4] Implement `detectRTL(text: string): boolean` utility in `components/ChatPanel.tsx` — use `/[\u0600-\u06FF]/g` regex; return `true` if `matches.length / text.length > 0.1` (more than 10% Arabic-script characters); return `false` for empty strings, Latin-only text (Roman Urdu), and text with fewer Arabic characters; includes `// [Task]: T-3.3.7` comment
- [x] T020 [P] [T-3.3.7] [US4] Apply RTL detection at all `ChatMessage` creation points in `components/ChatPanel.tsx` — (1) optimistic user bubble in `handleSend`: `isRTL: detectRTL(text)`; (2) assistant bubble on response: `isRTL: detectRTL(data.response)`; (3) hydrated history messages in mount effect: `isRTL: detectRTL(m.content)`; computed once and stored — never recomputed on render; includes `// [Task]: T-3.3.7` comment
- [x] T021 [T-3.3.7] [US4] Apply RTL rendering in `components/ChatMessageBubble.tsx` — add `dir={message.isRTL ? "rtl" : "ltr"}` HTML attribute to the bubble `<div>` (not just CSS `direction` — the HTML `dir` attribute is required for correct browser bidirectional text algorithm); add `message.isRTL ? "text-right" : "text-left"` to the Tailwind class list; verify a bubble with `isRTL=true` renders right-justified inside its left-aligned container; includes `// [Task]: T-3.3.7` comment

**Checkpoint**: An assistant bubble with Urdu script displays right-to-left. Arabic characters are not reversed. An adjacent Roman Urdu bubble uses standard left-to-right rendering. No layout overflow occurs.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error display, inline error messages, accessibility verification, and empty-state UX.

- [x] T022 [P] Implement inline error banner in `components/ChatPanel.tsx` — render `{state.error && <div className="mx-4 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{state.error}</div>}` between message area and input; error is cleared on next successful send; error copy per plan Section 3.1 error-mapping table (403 → "Access denied.", 422 → "Message too long. Please shorten it.", 503 → "AI service unavailable. Please try again.", NetworkError → "Unable to reach server. Check your connection.", generic → "Something went wrong. Please try again.")
- [x] T023 [P] Add accessibility attributes to `components/ChatPanel.tsx` — message list has `role="log"` and `aria-live="polite"` and `aria-label="Chat conversation"`; input has `aria-label="Message the AI assistant"`; Send button has `aria-label="Send message"`; verify no console warnings about missing ARIA roles
- [ ] T024 Verify all Phase 2 task management features still work (add, edit, delete, toggle, filter) — run through each action to confirm `dashboard/layout.tsx` and `dashboard/page.tsx` changes did not break existing Phase 2 components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T002, T003, T004 are parallel
- **Phase 2 (Foundational)**: No dependency on Phase 1; can run in parallel with Phase 1
- **Phase 3 (US1 — Send/Receive)**: Depends on T001 (types), T005, T006 (layout) — start after Phase 1 T001 and Phase 2 complete; T007, T008 are parallel with each other; T009 depends on T007, T008; T010–T013 depend on T009
- **Phase 4 (US2 — History)**: Depends on Phase 3 complete (shares `ChatPanel.tsx`)
- **Phase 5 (US3 — Auto-scroll)**: Depends on Phase 3 complete (shares `ChatPanel.tsx`)
- **Phase 6 (US4 — RTL)**: Depends on Phase 3 complete; T019–T021 can run in parallel with Phase 4 and 5
- **Phase 7 (Polish)**: Depends on all prior phases complete

### Parallel Opportunities

```bash
# Phase 1 — all parallel after T001
T002: api.ts sendChat function
T003: api.ts getChatHistory function
T004: backend history route

# Phase 3 — parallel component scaffolding
T007: ChatMessageBubble.tsx
T008: TypingIndicator.tsx

# Phase 6 — all parallel within RTL story
T019: detectRTL utility
T020: Apply isRTL at creation points
T021: Apply dir attribute in bubble

# Phase 7 — all parallel
T022: Error banner
T023: Accessibility attributes
```

### User Story Dependencies

- **US1 (Phase 3)**: After Phase 1 T001 + Phase 2 — no other story dependencies
- **US2 (Phase 4)**: After US1 — shares `ChatPanel.tsx` state
- **US3 (Phase 5)**: After US1 — shares `ChatPanel.tsx` refs and effects
- **US4 (Phase 6)**: After US1 — touches `ChatPanel.tsx` and `ChatMessageBubble.tsx`; independent of US2, US3

---

## Task ID Cross-Reference (User Request → Implementation Tasks)

| User Task ID | Standard Tasks | Phase |
|-------------|---------------|-------|
| T-3.3.1 Chat Component Structure | T007, T008, T009 | Phase 3 |
| T-3.3.2 Styling & Layout | T005, T006, T010, T011, T012, T013 | Phase 2 + 3 |
| T-3.3.3 Message State Management | T009, T015, T016 | Phase 3 + 4 |
| T-3.3.4 Message History Loader | T003, T004, T014 | Phase 1 + 4 |
| T-3.3.5 Chat API Integration | T001, T002, T010 | Phase 1 + 3 |
| T-3.3.6 Auto-Scroll & UX | T017, T018 | Phase 5 |
| T-3.3.7 Multi-language Rendering | T019, T020, T021 | Phase 6 |
| T-3.3.8 Task List Revalidation | T015 | Phase 4 |

---

## Implementation Strategy

### MVP (User Story 1 only — send & receive)

1. Complete Phase 1 (T001–T004) — API types and functions
2. Complete Phase 2 (T005–T006) — dashboard grid layout
3. Complete Phase 3 (T007–T013) — send/receive MVP
4. **STOP AND VALIDATE**: T-3.3.5 verification — send a message, see user + assistant bubbles
5. Demo: users can chat with the AI and tasks are managed via natural language

### Full Delivery (all stories)

1. MVP complete → Phase 4 (history persistence, revalidation)
2. Phase 5 (auto-scroll, typing indicator with tool status)
3. Phase 6 (RTL rendering for Urdu)
4. Phase 7 (polish, error handling, accessibility)
5. **Final Validation**: T-3.3.8 — "Add milk" → milk appears in task list without page refresh

---

## Verification Criteria

| ID | Criterion | How to Verify |
|----|-----------|--------------|
| T-3.3.5 | User message sent → assistant bubble appears | Send "Show my tasks" → see two bubbles, no page reload |
| T-3.3.8 | "Add milk" → milk in task list (no manual refresh) | Observe task list left panel updates after AI confirms |
| History | Prior messages visible after page reload | Complete 2-turn chat, reload, verify messages present |
| RTL | Urdu script renders right-to-left | Check `dir="rtl"` in DOM inspector for Arabic-script bubble |
| Auth | JWT attached to all chat requests | Network inspector → `Authorization: Bearer <token>` on POST /chat |
| Phase 2 | No existing features broken | Run through add/edit/delete/toggle tasks after layout change |

---

## Notes

- All new files use `"use client"` as first line (required for hooks)
- All new files include `// [Task]: T-3.3.x` comments per stylistic rule
- `router.refresh()` is used (not `revalidatePath`) — chat send happens in Client Component context where `revalidatePath` is unavailable
- `useSearchParams()` requires `<Suspense>` wrapper — already accounted for in T006/T012
- Backend history endpoint (T004) can be developed in parallel with frontend; frontend degrades gracefully if absent
- Never store JWT in component state — `fetchWithAuth` in `api.ts` handles token retrieval transparently
