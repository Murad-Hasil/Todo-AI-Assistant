# Feature Specification: Phase 3.1 — Database Evolution & MCP Server

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Phase 3.1 Database Evolution & MCP Server for AI-powered Todo Chatbot"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Stateless Conversation Persistence (Priority: P1)

A user starts a chat session with the AI Chatbot. Each message they send and
each assistant response is stored in the database. If the server restarts
between turns, the conversation continues seamlessly because the next request
fetches history from the database — no in-memory state is lost.

**Why this priority**: Without persistent conversation history, the AI agent
has no context for follow-up messages ("the one I just added"). This is the
foundational data layer for all Phase 3 features.

**Independent Test**: A conversation can be started, the server can be
restarted, and the next message still receives a contextually correct reply.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they send a chat message, **Then**
   the message is stored in `messages` with `role="user"` and the AI's reply
   is stored with `role="assistant"`.
2. **Given** a stored conversation, **When** the server restarts and the user
   sends a follow-up, **Then** the agent has access to all prior messages and
   responds with correct context.
3. **Given** a user with no conversations, **When** they send their first
   message, **Then** a new `conversations` record is created for them.

---

### User Story 2 — MCP-Mediated Task Management (Priority: P1)

An authenticated user types "Add buy milk to my tasks" in the chatbot. The AI
Agent calls the `add_task` MCP tool with the user's `user_id` and title "buy
milk". The tool creates the task in the database and returns it. The agent
confirms to the user: "Got it! I've added 'buy milk' to your task list."

**Why this priority**: MCP tools are the exclusive interface between the AI
agent and the task database. Without them, the Phase 3 system cannot function.

**Independent Test**: Each of the five MCP tools (`add_task`, `list_tasks`,
`complete_task`, `delete_task`, `update_task`) can be called in isolation via
the MCP test client and produces the correct database change.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `add_task` is called with valid
   `user_id` and `title`, **Then** a task row is created in the database and
   returned.
2. **Given** a task belonging to User A, **When** `complete_task` is called
   with User B's `user_id` and that task's `task_id`, **Then** the tool returns
   `{ "success": false, "error": "Task not found." }`.
3. **Given** `list_tasks` is called with `status="pending"`, **When** the user
   has 2 pending and 3 completed tasks, **Then** only 2 tasks are returned.
4. **Given** `delete_task` is called with a valid `user_id` and `task_id`,
   **When** the call succeeds, **Then** `list_tasks` no longer includes that task.

---

### User Story 3 — Roman Urdu Language Support (Priority: P2)

A user types "Mera kaam add karo: doodh lana" in the chatbot. The AI Agent
detects Roman Urdu, calls `add_task` with title "doodh lana", and responds:
"Ho gaya! 'doodh lana' aapki list mein add ho gaya."

**Why this priority**: Bonus requirement from the project PDF. Enhances
accessibility for Urdu-speaking users without any schema or tool changes.

**Independent Test**: A test conversation in Roman Urdu triggers the correct
MCP tool and receives a Roman Urdu response.

**Acceptance Scenarios**:

1. **Given** a user messages in Roman Urdu, **When** the agent processes it,
   **Then** the response is in Roman Urdu.
2. **Given** a user switches from English to Roman Urdu mid-conversation,
   **When** the Roman Urdu message is processed, **Then** the agent responds
   in Roman Urdu (not locked to the previous English).

---

### Edge Cases

- What happens when a user sends an empty message? → Agent responds with a
  prompt to clarify what they need.
- What happens when the Groq API is unavailable? → Agent returns a user-friendly
  error; the message is NOT stored as an `assistant` message.
- What happens when `add_task` is called with an empty title? → Tool returns
  error; agent tells user to provide a task name.
- What happens when `list_tasks` returns an empty list? → Agent responds:
  "You have no tasks yet."
- What happens when a user mentions "delete task 3" but there is no task 3 by
  index? → Agent asks for clarification before calling the tool.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist every user message and AI assistant response
  in the `messages` table with the correct `role`, `content`, `user_id`, and
  `conversation_id`.
- **FR-002**: System MUST create a new `conversations` record when a user sends
  their first message in a session (or when a new conversation is explicitly
  started).
- **FR-003**: System MUST fetch full conversation history from the database at
  the start of every AI request (no in-memory state).
- **FR-004**: The MCP server MUST expose exactly five tools: `add_task`,
  `list_tasks`, `complete_task`, `delete_task`, `update_task`.
- **FR-005**: Every MCP tool MUST accept `user_id` as a required parameter and
  MUST reject task access where `task.user_id ≠ user_id`.
- **FR-006**: The MCP server MUST be accessible from the FastAPI AI agent
  orchestration layer and MUST correctly list its tools via the MCP SDK protocol.
- **FR-007**: The agent MUST detect Roman Urdu input and respond in Roman Urdu.
- **FR-008**: The agent MUST confirm every successful tool call with a
  user-friendly message and MUST handle tool errors gracefully (no raw errors).
- **FR-009**: The `delete_task` MCP tool MUST only be invoked after the agent
  receives explicit user confirmation.
- **FR-010**: The Alembic migration MUST add `conversations` and `messages`
  tables without modifying Phase 2 tables (`users`, `tasks`).

### Key Entities

- **Conversation**: A session-level grouping of messages for one user. Has `id`,
  `user_id`, `created_at`, `updated_at`. One user can have many conversations.
- **Message**: A single turn in a conversation. Has `id`, `conversation_id`,
  `user_id`, `role` (user/assistant), `content`, `created_at`. One conversation
  has many messages.
- **MCP Tool**: A named, callable function exposed by the MCP server. Accepts
  typed parameters, interacts with the task database, returns structured results.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five MCP tools respond correctly in under 500ms for typical
  task operations (single-user, <100 tasks).
- **SC-002**: The Alembic migration runs successfully on a Phase 2 database
  without errors and without altering existing tables.
- **SC-003**: 100% of task-modifying MCP tool calls enforce user-data isolation
  (no cross-user data access possible).
- **SC-004**: A Roman Urdu user message receives a Roman Urdu response in 95%
  of test cases covering the defined trigger vocabulary.
- **SC-005**: Conversation history is available to the agent within one database
  round-trip; no re-processing of prior turns is required.

---

## Detailed Specifications

- Database schema, migration, and SQLModel models:
  → `todo-web-app/specs/chatbot/database.md`
- MCP tool parameter contracts, return types, and error conditions:
  → `todo-web-app/specs/chatbot/mcp-tools.md`
- Agent tool-trigger mapping, Roman Urdu rules, error-handling UX:
  → `todo-web-app/specs/chatbot/behavior.md`
