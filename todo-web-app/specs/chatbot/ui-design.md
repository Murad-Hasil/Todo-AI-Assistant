# UI Design Specification: Phase 3.3 — Frontend Chat Interface

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-04
**Status**: Draft
**Phase**: 3.3 — Frontend Chat UI
**Depends On**: Phase 3.2 (`POST /api/{user_id}/chat` endpoint live and accepting JWT)

---

## Overview

This document specifies the visual design, component structure, and interaction
patterns for the Phase 3.3 chat interface. The chat UI is embedded in the
existing Dashboard and allows authenticated users to manage their tasks through
natural language conversation with the AI agent.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Send a Message and Receive a Reply (Priority: P1)

An authenticated user opens the Dashboard and sees a Chat Window alongside
their task list. They type "Add buy milk to my tasks" and press Enter (or click
Send). A typing indicator appears while the AI processes the request. When the
response arrives, it appears in a visually distinct "Assistant" bubble and the
task list refreshes to show the newly created task.

**Why this priority**: This is the primary interaction loop of the entire Phase
3 feature. Without a functional send/receive chat flow, all other chat UI
stories are unreachable.

**Independent Test**: A user can open the Dashboard, type a task-creation
request in the chat input, submit it, and see the assistant's confirmation
bubble appear — independently of conversation history, RTL support, or tool
feedback features.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Dashboard, **When** they type a
   message and press Enter or click Send, **Then** their message appears
   immediately in a "User" bubble and a typing indicator appears below it.
2. **Given** the typing indicator is visible, **When** the AI response arrives,
   **Then** the typing indicator disappears and the assistant's reply appears
   in an "Assistant" bubble.
3. **Given** a successful task-creation response, **When** the assistant bubble
   appears, **Then** the task list panel on the Dashboard refreshes to include
   the new task without a full page reload.

---

### User Story 2 — Visual Distinction Between User and Assistant Messages (Priority: P1)

The user can immediately tell which messages they sent versus which messages
came from the AI. User bubbles are styled differently from assistant bubbles in
colour, alignment, and shape — following the conventions of familiar chat
applications (e.g., right-aligned user, left-aligned assistant).

**Why this priority**: Without visual distinction, the conversation becomes
unreadable and the user cannot follow the dialogue. This is a foundational
design requirement.

**Independent Test**: A screenshot of a two-turn conversation shows User and
Assistant bubbles that are clearly differentiated without relying on labels.

**Acceptance Scenarios**:

1. **Given** a chat history with alternating user and assistant messages,
   **When** the chat window is rendered, **Then** user bubbles appear on the
   right side with one colour/style and assistant bubbles appear on the left
   with a distinct colour/style.
2. **Given** a long assistant message, **When** rendered, **Then** the bubble
   does not overflow the chat window horizontally and text wraps correctly.
3. **Given** a short user message ("OK"), **When** rendered, **Then** the
   bubble width is proportional to the content, not stretched to full width.

---

### User Story 3 — Urdu Text Rendering (Priority: P2)

A user whose AI assistant has responded in Urdu script (right-to-left) sees
the text rendered correctly — characters are not reversed, the text flows from
right to left, and the bubble layout accommodates RTL alignment. This enables
Urdu-speaking users to read responses naturally.

**Why this priority**: The project specification requires Urdu script support.
Incorrect RTL rendering makes responses unreadable and defeats the purpose of
multilingual support. However, this is a bonus requirement — ranked P2 because
English-only scenarios are still fully usable without it.

**Independent Test**: An assistant bubble containing a sample Arabic-script
Urdu string renders with correct RTL direction, without mirrored characters or
broken layout.

**Acceptance Scenarios**:

1. **Given** an assistant message containing Urdu script (e.g., "آپ کا کام شامل
   ہو گیا"), **When** rendered in the chat bubble, **Then** the text flows
   right-to-left and the bubble text alignment is right-justified.
2. **Given** a conversation mixing English and Urdu messages, **When** both
   types are rendered, **Then** each bubble applies its own text direction
   independently without affecting adjacent bubbles.
3. **Given** a Roman Urdu response (Latin script), **When** rendered, **Then**
   the bubble uses standard left-to-right direction (Roman Urdu does not
   require RTL rendering).

---

### User Story 4 — Tool Feedback Visual Indicator (Priority: P3 — Bonus)

While the AI agent is "thinking" or actively calling a task tool (e.g.,
`add_task`, `list_tasks`), a descriptive status message replaces the generic
typing bubble. The status changes from "Thinking…" to "Updating Tasks…" based
on which tool is being executed, giving the user a sense of what is happening
behind the scenes.

**Why this priority**: This is explicitly listed as a bonus feature. It
enhances transparency but is not required for the core chatbot flow.

**Independent Test**: A mock that triggers a `tool_calls: ["add_task"]` response
shows "Updating Tasks…" in place of the generic typing indicator during the
simulated processing window.

**Acceptance Scenarios**:

1. **Given** a chat request is in flight, **When** no tool call has been
   confirmed yet, **Then** the indicator reads "Thinking…".
2. **Given** the API response includes `tool_calls: ["add_task"]`, **When**
   the response is received, **Then** a transient status indicator (visible for
   ≥1 second before the assistant bubble appears) reads "Updating Tasks…".
3. **Given** the API response includes `tool_calls: []` (no tools invoked),
   **When** the response arrives, **Then** the typing bubble simply disappears
   without a tool feedback message.

---

### Edge Cases

- What happens when the user submits an empty message? → The Send button/Enter
  key is disabled when the input field is blank; no request is made.
- What happens if the network request fails? → The typing indicator is replaced
  by an inline error message ("Something went wrong. Please try again.") and
  the user's message bubble remains visible so it is not lost.
- What happens on a very long assistant message? → The bubble scrolls
  internally or the chat window auto-scrolls to keep the message in view.
- What happens on a very small viewport (mobile)? → The chat window stacks
  below the task list or collapses into a floating toggle button.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Dashboard MUST include a Chat Window component — either as a
  floating panel (bottom-right overlay) or a dedicated side panel — that is
  visible to authenticated users without requiring navigation to a separate page.
- **FR-002**: The Chat Window MUST display message bubbles with visually distinct
  styles for `role="user"` (right-aligned, filled colour) and `role="assistant"`
  (left-aligned, muted/bordered style).
- **FR-003**: While awaiting an AI response, the Chat Window MUST display a
  typing/loading indicator (animated dots or equivalent) in the assistant bubble
  position.
- **FR-004**: The Chat Window MUST detect Urdu script in assistant messages and
  apply RTL text direction (`dir="rtl"`, `text-align: right`) to those specific
  bubbles.
- **FR-005**: The Chat Window MUST apply standard LTR text direction to Roman
  Urdu (Latin-script) messages — RTL rendering applies only to Arabic-script
  characters.
- **FR-006**: The Send button MUST be disabled when the input field is empty
  and re-enabled as soon as the user types at least one character.
- **FR-007**: The Send button MUST be disabled while a request is in flight to
  prevent duplicate submissions.
- **FR-008**: When the AI response includes a non-empty `tool_calls` array, the
  loading indicator MUST briefly display a context-sensitive status message:
  - `add_task` or `update_task` or `delete_task` or `complete_task` →
    "Updating Tasks…"
  - `list_tasks` → "Fetching Tasks…"
  - Unknown tool → "Thinking…"
- **FR-009**: The Chat Window MUST follow the Tailwind CSS utility class
  patterns established in Phase 2 (`dashboard/page.tsx`, `TaskItem.tsx`, etc.)
  — no external CSS frameworks beyond what is already installed.
- **FR-010**: The Chat Window MUST be accessible: input field has a visible
  label or `aria-label`, messages are in a `role="log"` or `role="list"`
  container, and the Send button has descriptive `aria-label` text.

### Key Entities

- **Chat Window**: The primary UI component containing the message history list,
  the text input field, and the Send button.
- **Message Bubble**: A styled container displaying a single message. Has two
  variants: `user` (right-aligned, coloured background) and `assistant`
  (left-aligned, neutral background). Carries text content and direction
  metadata.
- **Typing Indicator**: A transient animated element in the assistant position,
  visible only while a request is in flight. May display contextual status text.
- **Tool Status Label**: Optional text overlay on the Typing Indicator showing
  what the AI is doing (e.g., "Updating Tasks…"), derived from `tool_calls` in
  the previous response frame.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can read a multi-turn conversation and distinguish User
  from Assistant messages without reading any labels — validated by visual
  design review with 3+ reviewers.
- **SC-002**: Urdu script in assistant bubbles renders correctly (right-to-left,
  no character reversal) in the two most recent stable versions of Chrome,
  Firefox, and Safari.
- **SC-003**: The typing indicator appears within 100ms of the user submitting
  a message — no perceptible gap between send and loading state.
- **SC-004**: The chat interface is fully functional (send, receive, scroll) on
  viewport widths of 375px (mobile) through 1440px (desktop) without horizontal
  scrollbars or clipped content.
- **SC-005**: The Chat Window component passes Lighthouse accessibility audit
  with ≥90 score in the Accessibility category.
- **SC-006**: Empty-input guard prevents 100% of zero-character submissions —
  confirmed by automated interaction test.

---

## Design Notes

### Colour and Style Conventions (aligned with Phase 2 Tailwind patterns)

The Phase 2 Dashboard uses `blue-600` accents for interactive elements, `gray-100`
backgrounds for cards, and `white` for the page body. The Chat Window MUST
derive its colour palette from these same Tailwind tokens to maintain visual
consistency:

- **User bubble**: `bg-blue-600 text-white` (mirrors the primary action colour)
- **Assistant bubble**: `bg-gray-100 text-gray-800` (matches card background)
- **Input border focus**: `border-blue-500 ring-blue-200` (matches form inputs in Phase 2)
- **Send button**: `bg-blue-600 hover:bg-blue-700 text-white` (matches primary buttons)

### RTL Detection Heuristic

Urdu script characters fall in the Unicode range U+0600–U+06FF. The UI MUST
apply RTL direction when more than 10% of the message's characters fall within
this range. For all other messages (including Roman Urdu in Latin script), LTR
direction applies.

### Floating vs. Dedicated Panel

Both layouts are acceptable. The preferred layout is a **dedicated side panel**
(chat on the right, task list on the left) at desktop widths, collapsing to a
**full-screen overlay** on mobile. A floating button toggle is an acceptable
alternative if implementation constraints arise.
