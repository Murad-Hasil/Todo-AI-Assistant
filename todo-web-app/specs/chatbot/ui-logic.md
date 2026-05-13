# UI Logic Specification: Phase 3.3 — Conversation Management & API Integration

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-04
**Status**: Draft
**Phase**: 3.3 — Frontend Chat UI
**Depends On**:
  - `ui-design.md` — visual component structure
  - `api-endpoint.md` — `POST /api/{user_id}/chat` contract
  - `todo-web-app/frontend/src/lib/api.ts` — existing typed API client

---

## Overview

This document specifies the client-side state management, message history
retrieval, conversation threading, and API integration for the Phase 3.3 chat
interface. It defines what data the chat component owns, how it fetches and
persists data, how it connects to the backend, and what the user experiences
when they revisit a conversation after a page reload.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Chat History Persists Across Page Reloads (Priority: P1)

A user completes a multi-turn conversation, then navigates away or refreshes
the page. When they return to the Dashboard, their previous chat messages are
still visible in the Chat Window. The `conversation_id` is preserved (via URL
query parameter or local storage) and the chat component fetches historical
messages from the backend on mount.

**Why this priority**: Without persistence across reloads, every visit to the
Dashboard starts a blank conversation, which breaks the stateful chat experience
promised by Phase 3. This directly impacts one of the five acceptance criteria.

**Independent Test**: Start a conversation with at least two turns, note the
`conversation_id`, reload the page, and verify all prior messages are restored
in the correct order without sending a new message.

**Acceptance Scenarios**:

1. **Given** a user with an existing conversation, **When** they reload the
   Dashboard page, **Then** the chat window shows all messages from the
   previous session in chronological order.
2. **Given** a URL with a `?conversation_id=<UUID>` query parameter, **When**
   the chat component mounts, **Then** it fetches message history for that
   specific conversation and renders it before showing the input.
3. **Given** a user with no prior conversation (first visit), **When** the
   Dashboard loads, **Then** the chat window is empty and ready for a new
   message — no fetch errors or empty-state confusion.
4. **Given** a `conversation_id` that the backend returns 404 for, **When**
   the component mounts, **Then** it clears the stored `conversation_id` and
   starts a fresh conversation silently.

---

### User Story 2 — Seamless Conversation Threading (Priority: P1)

After the user sends their first message, the backend returns a
`conversation_id`. Every subsequent message in the same session includes that
`conversation_id` so the AI agent has access to the full history. The user
never has to manually manage this — the component threads all messages
automatically.

**Why this priority**: Conversation threading is the foundation of multi-turn
AI interactions. Without it, the AI loses context after every message and the
chatbot becomes a single-turn Q&A tool.

**Independent Test**: Send three sequential messages. Inspect the outgoing
request body for the second and third messages — each must include the
`conversation_id` returned by the first response.

**Acceptance Scenarios**:

1. **Given** the user sends their first message (no `conversation_id` in state),
   **When** the backend responds, **Then** the returned `conversation_id` is
   stored in component state and the URL is updated to `?conversation_id=<UUID>`.
2. **Given** a stored `conversation_id`, **When** the user sends a follow-up
   message, **Then** the request body includes `{ message: "...", conversation_id: "<UUID>" }`.
3. **Given** a user clicks "New Chat" (if that control exists), **When** the
   action is triggered, **Then** the `conversation_id` is cleared from state
   and URL, and the next message starts a fresh conversation.

---

### User Story 3 — Auto-Scroll to Latest Message (Priority: P2)

As new messages appear in the chat window — whether from the user, the
assistant, or fetched history — the chat list scrolls automatically to show the
most recent message at the bottom. The user does not need to manually scroll
after every exchange.

**Why this priority**: Auto-scroll is a standard chat UX expectation. Without
it, the user must manually scroll to see new messages, which creates friction
during an active conversation.

**Independent Test**: Render a chat window with 30+ messages programmatically
and verify the scroll position is at the bottom without user interaction.

**Acceptance Scenarios**:

1. **Given** the chat window contains messages, **When** a new user or assistant
   message is appended, **Then** the scroll position moves to the bottom of the
   message list within one render cycle.
2. **Given** the user has manually scrolled up to read history, **When** they
   submit a new message, **Then** the window scrolls back to the bottom once
   the user's message bubble appears.
3. **Given** historical messages are fetched on mount, **When** rendering
   completes, **Then** the scroll position is at the bottom (most recent message
   visible), not the top.

---

### User Story 4 — Secure API Calls with JWT (Priority: P1)

Every request to `POST /api/{user_id}/chat` is authenticated with the user's
JWT token. The token is retrieved from the Better Auth session and attached as
a `Bearer` header automatically — exactly as existing task CRUD calls are made.
An unauthenticated or expired session triggers the existing redirect to
`/sign-in?reason=session_expired` without additional error handling code.

**Why this priority**: Security is non-negotiable. An unauthenticated chat
endpoint would allow anyone to invoke AI tools on a user's task data.

**Independent Test**: Expire or remove the session token, send a chat message,
and verify the request returns 401 and the browser redirects to the sign-in
page.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they send a chat message, **Then**
   the outgoing request includes `Authorization: Bearer <valid_jwt>`.
2. **Given** an expired or missing session, **When** the chat request is sent,
   **Then** the backend returns 401 and the client redirects to
   `/sign-in?reason=session_expired` (handled by existing `fetchWithAuth`
   logic in `api.ts`).
3. **Given** a valid session, **When** the response returns the new
   `conversation_id`, **Then** it is stored without exposing JWT or user ID
   details in client-accessible storage beyond what Better Auth already manages.

---

### Edge Cases

- What happens when `GET /api/{user_id}/conversations/{id}/messages` is not
  available? → The frontend falls back to rendering an empty chat window and
  treats the stored `conversation_id` as the thread to continue — new messages
  will still maintain context via the backend.
- What happens when `localStorage` or `sessionStorage` is unavailable (private
  browsing)? → The `conversation_id` is stored only in URL query parameters as
  the authoritative source; no storage dependency.
- What happens when the user opens the same conversation in two browser tabs?
  → Each tab operates independently; no real-time sync is required for Phase 3.3.
- What happens on a network timeout during a chat request? → After 30 seconds
  with no response, the typing indicator is replaced by an inline error: "The
  request timed out. Please try again." The `conversation_id` is retained.
- What happens when the user sends a message while a previous request is still
  in flight? → The Send button is disabled until the in-flight request completes
  (see `ui-design.md` FR-007). This prevents race conditions.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Chat component MUST store the active `conversation_id` in
  React state AND reflect it as a `?conversation_id=<UUID>` URL query parameter
  so it survives a page refresh.
- **FR-002**: On component mount, if a `conversation_id` is present in the URL
  or state, the component MUST fetch message history from the backend before
  rendering the input field as interactive.
- **FR-003**: Fetched message history MUST be displayed in chronological order
  (oldest at top, newest at bottom) using the same `role` property from the
  database (`user` / `assistant`) to determine bubble styling.
- **FR-004**: The component MUST call `POST /api/{user_id}/chat` exclusively
  through the existing `fetchWithAuth` wrapper in `@/lib/api.ts` (or a new
  typed function added to that module) — no direct `fetch()` calls in component
  code.
- **FR-005**: The request body for every chat call MUST include `message`
  (string) and `conversation_id` (UUID string, omitted if starting a new
  conversation).
- **FR-006**: On a successful response, the component MUST:
  a. Store the returned `conversation_id` in state and URL.
  b. Append the user's message bubble and the assistant's response bubble to
     the local message list.
  c. Trigger a task list refresh so newly created or modified tasks appear
     without a full page reload.
- **FR-007**: The component MUST auto-scroll the message list to the bottom:
  - After initial history load on mount.
  - After each new message is appended (user or assistant).
  - Implementation MUST use a `ref` on the bottom of the message list and
    call `.scrollIntoView({ behavior: "smooth" })` or equivalent.
- **FR-008**: The JWT token for chat requests MUST be sourced from
  `authClient.token()` (the same mechanism used by `fetchWithAuth` in
  `api.ts`) — the component MUST NOT read or store JWT values directly.
- **FR-009**: A `sendChat` function MUST be added to `@/lib/api.ts` with the
  following signature contract:
  ```
  sendChat(userId: string, message: string, conversationId?: string)
    → Promise<{ conversation_id: string; response: string; tool_calls: string[] }>
  ```
- **FR-010**: If the backend returns a 404 for the stored `conversation_id`
  (conversation deleted or invalid), the component MUST clear the stored ID,
  reset the local message list, and allow the user to start a new conversation
  without an error page.
- **FR-011**: The component MUST expose the list of `tool_calls` from the most
  recent response to the Typing Indicator component (see `ui-design.md` FR-008)
  so it can render the appropriate status label during the next in-flight request.

### Key Entities

- **ChatMessage (client-side)**: A locally managed object representing a single
  message in the rendered list. Fields: `id` (string or UUID), `role`
  (`"user"` | `"assistant"`), `content` (string), `isRTL` (boolean, derived
  from content), `createdAt` (ISO string).
- **ConversationState**: The component-level state object. Fields:
  `conversationId` (string | null), `messages` (ChatMessage[]), `isLoading`
  (boolean), `lastToolCalls` (string[]).
- **sendChat (API function)**: The typed function added to `api.ts` for posting
  chat messages. Calls `POST /api/{user_id}/chat`, handles 401/403/404/503
  error mapping consistent with existing API error conventions.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a page refresh, 100% of messages from a prior conversation
  are restored and rendered in correct order — measured by automated end-to-end
  test replaying a 3-turn conversation.
- **SC-002**: A task created via chat appears in the Dashboard task list within
  one render cycle after the assistant's confirmation bubble appears — no
  manual refresh required.
- **SC-003**: Zero unauthenticated chat requests reach the backend — confirmed
  by testing with an expired token and verifying the 401 redirect occurs before
  any agent logic runs.
- **SC-004**: The `conversation_id` in the URL matches the `conversation_id`
  returned by the backend in 100% of new-conversation flows — verified by
  integration test.
- **SC-005**: Auto-scroll brings the latest message into view within one
  animation frame (≤16ms delay) after the message is appended to the DOM.
- **SC-006**: The `sendChat` function in `api.ts` correctly maps all documented
  error status codes (401, 403, 404, 503) to the project's existing error
  class hierarchy (`ApiError`, `ForbiddenError`, `NotFoundError`,
  `ServerError`) — verified by unit tests.

---

## API Integration Reference

The following contract is defined in `todo-web-app/specs/chatbot/api-endpoint.md`
and is restated here for implementer convenience.

### Chat Endpoint

```
POST /api/{user_id}/chat
Authorization: Bearer <JWT>
Content-Type: application/json

Request body:
{
  "message": "Add buy milk to my tasks",
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"  // optional
}

Response body (HTTP 200):
{
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "response": "Got it! I've added 'buy milk' to your tasks.",
  "tool_calls": ["add_task"]
}
```

### Message History Endpoint

The frontend requires a way to fetch prior messages for a stored
`conversation_id` on page load. If this endpoint does not yet exist in the
backend, the frontend MUST gracefully handle the absence by starting a fresh
conversation with the stored `conversation_id` as the thread to continue
(stateless context is maintained server-side anyway). A dedicated history
endpoint (`GET /api/{user_id}/conversations/{id}/messages`) is recommended as
a Phase 3.3 backend addition but is not strictly required for the core flow.

### Error Handling Mapping

| HTTP Status | Frontend Behaviour                                                 |
|-------------|---------------------------------------------------------------------|
| 401         | Redirect to `/sign-in?reason=session_expired` (existing behaviour)  |
| 403         | Show inline error: "Access denied."                                 |
| 404         | Clear `conversation_id`, reset chat, start new conversation         |
| 422         | Show inline error: "Message too long. Please shorten it."           |
| 503         | Show inline error: "AI service unavailable. Please try again."      |
| Network err | Show inline error: "Unable to reach server. Check your connection." |

---

## Implementation Notes

### `conversation_id` Storage Strategy

The authoritative store for `conversation_id` is the URL query parameter
(`?conversation_id=<UUID>`). React state is the in-memory mirror. The URL is
updated with `router.replace` (no push to avoid polluting browser history) on
every change. On mount, the component reads from the URL first, then falls back
to component state.

### Task List Refresh Strategy

When the assistant's response includes a non-empty `tool_calls` array containing
any write operation (`add_task`, `complete_task`, `delete_task`, `update_task`),
the component MUST trigger a task list refresh. The preferred mechanism is to
call `router.refresh()` (Next.js App Router) which re-runs Server Component
data fetches for the current route without a full navigation.

### RTL Detection

The same heuristic defined in `ui-design.md` applies: if more than 10% of the
message's characters fall in the Unicode range U+0600–U+06FF (Arabic/Urdu
script), set `isRTL = true` on the `ChatMessage` object. This flag is computed
once when the message is appended to local state and stored in the
`ChatMessage` object — it MUST NOT be recomputed on every render.
