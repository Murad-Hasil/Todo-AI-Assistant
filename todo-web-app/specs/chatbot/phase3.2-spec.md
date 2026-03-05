# Feature Specification: Phase 3.2 — AI Agent Logic & Stateless Chat Endpoint

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft
**Depends On**: Phase 3.1 (conversations + messages tables, MCP server with 5 tools)
**Input**: User description: "Phase 3.2 AI Agent Logic & Stateless Backend Endpoint"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Conversational Task Management via Chat (Priority: P1)

An authenticated user types a natural language message into the chatbot, such as
"Add buy milk to my tasks." The system receives the message, passes it to an AI
agent that invokes the appropriate task tool, and returns a friendly confirmation.
The user never writes commands or sees raw tool output — the AI handles the
translation between human intent and task operations.

**Why this priority**: This is the entire purpose of Phase 3.2. Without a working
`/api/chat` endpoint that connects the user's messages to the AI agent and task tools,
no other Phase 3 user story is possible.

**Independent Test**: A curl request with a valid JWT token and a task-related
message (`"Add buy groceries"`) returns a conversational response confirming the task
was created, and the task is visible via `GET /api/{user_id}/tasks`.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they POST `{"message": "Add buy milk to my tasks"}` to `/api/{user_id}/chat`, **Then** the response contains a friendly confirmation (e.g., "Got it! I've added 'buy milk' to your tasks.") and the task exists in the database.
2. **Given** an authenticated user, **When** they POST `{"message": "Show me my pending tasks"}`, **Then** the response lists the user's pending tasks in plain language.
3. **Given** an authenticated user, **When** they POST `{"message": "Mark buy milk as done"}`, **Then** the response confirms completion and the task's `completed` flag is `true` in the database.
4. **Given** an authenticated user, **When** they POST `{"message": "Delete buy milk"}`, **Then** the AI asks for confirmation before invoking the delete tool.
5. **Given** an unauthenticated request (missing or invalid JWT), **When** any message is sent to `/api/{user_id}/chat`, **Then** the system returns HTTP 401 without invoking the AI agent.

---

### User Story 2 — Persistent Conversation Context (Priority: P1)

A user starts a conversation and sends follow-up messages that reference earlier
turns ("the one I just added"). Because every request fetches the full conversation
history from the database, the AI maintains context across multiple turns even if
the server restarts between requests.

**Why this priority**: Without stateless history retrieval, follow-up messages lose
context and the chatbot becomes unusable for multi-turn interactions.

**Independent Test**: Send two sequential requests with the same `conversation_id`.
The second response correctly references the first turn's content without any
in-memory state between the two HTTP calls.

**Acceptance Scenarios**:

1. **Given** a first chat request (no `conversation_id`), **When** the request is processed, **Then** a new `conversations` record is created and its ID is returned in the response.
2. **Given** a second chat request with the same `conversation_id`, **When** the request is processed, **Then** the AI has access to the first turn's messages and responds with correct context.
3. **Given** a server restart between two turns of the same conversation, **When** the second message arrives with the original `conversation_id`, **Then** history is successfully fetched from the database and the AI responds coherently.
4. **Given** a `conversation_id` that belongs to a different user, **When** any message is sent, **Then** the system returns an error — cross-user conversation access is forbidden.

---

### User Story 3 — Roman Urdu Language Support (Priority: P2)

A user types "Mera kaam add karo: doodh lana" and the AI detects Roman Urdu,
calls the appropriate task tool, and replies in Roman Urdu:
"Ho gaya! 'doodh lana' aapki list mein add ho gaya."

**Why this priority**: Bonus requirement from the project spec. Enhances
accessibility for Urdu-speaking users with zero schema or tool changes — it is
purely an agent behaviour concern.

**Independent Test**: A Roman Urdu message triggers the correct MCP tool and the
response is in Roman Urdu, not English.

**Acceptance Scenarios**:

1. **Given** a user message in Roman Urdu, **When** the agent processes it, **Then** the response is in Roman Urdu.
2. **Given** a user switches from English to Roman Urdu mid-conversation, **When** the Roman Urdu message is processed, **Then** the agent responds in Roman Urdu.
3. **Given** a Roman Urdu message requesting task creation, **When** processed, **Then** the correct MCP tool is invoked and the task title is extracted accurately.

---

### Edge Cases

- **Empty message**: User POSTs `{"message": ""}` → agent responds with a prompt to clarify intent; no tool call is made.
- **Groq API unavailable**: AI provider times out → endpoint returns HTTP 503 with a user-friendly message; the user's message IS stored in the DB, the failed assistant response is NOT stored.
- **Unknown conversation_id**: Caller passes a UUID that does not exist in `conversations` → endpoint returns HTTP 404.
- **Tool returns error**: MCP tool returns `{"success": false, "error": "..."}` → agent converts this to a human-readable message (e.g., "I couldn't find that task.") before responding.
- **No tasks exist**: `list_tasks` returns 0 tasks → agent responds "You have no tasks yet. Want me to add one?"
- **Ambiguous delete request**: User says "delete task 3" but no task with index 3 exists → agent asks for clarification before calling `delete_task`.
- **Very long message (>2000 chars)**: Request rejected with HTTP 422 before reaching the AI.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /api/{user_id}/chat` secured by the same JWT dependency used by Phase 2 CRUD endpoints.
- **FR-002**: System MUST create a new `conversations` record when `conversation_id` is absent from the request, and return the new ID in the response.
- **FR-003**: System MUST fetch the full message history for the given `conversation_id` from the database at the start of every request — no in-memory conversation buffer.
- **FR-004**: System MUST persist the user's message to the `messages` table (role=`user`) before invoking the AI agent.
- **FR-005**: System MUST persist the assistant's reply to the `messages` table (role=`assistant`) before returning the HTTP response.
- **FR-006**: System MUST NOT persist an assistant message if the AI agent or Groq API call fails — only successfully generated replies are stored.
- **FR-007**: The AI agent MUST exclusively use the five MCP tools (`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`) to interact with the task database — no direct DB access from agent code.
- **FR-008**: Every MCP tool call during a request cycle MUST be logged at INFO level with the tool name, inputs, and result summary.
- **FR-009**: The AI agent MUST request explicit user confirmation before invoking `delete_task`.
- **FR-010**: The AI agent MUST detect Roman Urdu input and respond in Roman Urdu.
- **FR-011**: The response body MUST include: `conversation_id` (UUID), `response` (string), `tool_calls` (list of tool names invoked).
- **FR-012**: Cross-user conversation access MUST be rejected — the endpoint must verify that the requested `conversation_id` belongs to the JWT `user_id`.
- **FR-013**: The endpoint MUST reject messages longer than 2000 characters with HTTP 422.

### Key Entities

- **ChatRequest**: A single HTTP request carrying `message` (string) and optional `conversation_id` (UUID string).
- **ChatResponse**: The HTTP response carrying `conversation_id` (UUID string), `response` (string), `tool_calls` (list of strings).
- **AI Agent**: A stateless orchestrator that receives a system prompt + conversation history + user message, decides which MCP tools to call, and produces a final reply string.
- **Conversation**: An existing Phase 3.1 entity — the session-level grouping of messages for one user.
- **Message**: An existing Phase 3.1 entity — a single turn (user or assistant) stored in the database.

> **Data type note**: `conversation_id` is a UUID (stored as `uuid.UUID` in Phase 3.1 models),
> returned as a UUID string in the API. The project specification document uses `int` —
> this spec uses UUID to match the already-implemented Phase 3.1 schema.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A complete chat round-trip (send message → AI response with tool calls → confirmation) completes in under 5 seconds for typical single-tool interactions at p90.
- **SC-002**: 100% of chat requests without a valid JWT are rejected before reaching the AI agent — zero unauthorized tool calls.
- **SC-003**: Conversation history is available to the agent within one database round-trip per request; no in-memory state survives between requests.
- **SC-004**: 100% of MCP tool invocations are logged with tool name, inputs, and result summary — no silent tool calls.
- **SC-005**: A Roman Urdu user message triggers a Roman Urdu AI response in ≥95% of test cases covering the defined Roman Urdu trigger vocabulary.
- **SC-006**: The Groq API failure path returns a user-friendly error within 10 seconds (timeout + fallback message) and does NOT persist a failed assistant message.
- **SC-007**: Zero cross-user data leaks — a conversation belonging to User A is never accessible to User B's chat endpoint calls.

---

## Detailed Specifications

- API contract (endpoint, request/response schemas, error codes):
  → `todo-web-app/specs/chatbot/api-endpoint.md`
- Stateless request cycle and agent system prompt:
  → `todo-web-app/specs/chatbot/cycle-logic.md`
- MCP tool parameter contracts (Phase 3.1, unchanged):
  → `todo-web-app/specs/chatbot/mcp-tools.md`
- Agent behavior rules and Roman Urdu triggers (Phase 3.1, unchanged):
  → `todo-web-app/specs/chatbot/behavior.md`
