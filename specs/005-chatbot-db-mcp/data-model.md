# Data Model: Phase 3.1 — Conversation & Message

**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-03

---

## Entity: `Conversation`

Represents a single chat session between one authenticated user and the AI Agent.

### Fields

| Field        | Python Type | DB Type                  | Constraints                          |
|--------------|-------------|--------------------------|--------------------------------------|
| `id`         | `uuid.UUID` | `UUID`                   | PK, default `uuid4()`               |
| `user_id`    | `str`       | `VARCHAR`                | NOT NULL, indexed (Better Auth user) |
| `created_at` | `datetime`  | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`          |
| `updated_at` | `datetime`  | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`          |

**Note**: `user_id` is `str` (not `uuid.UUID`) to match the existing `Task.user_id`
pattern. Better Auth manages the `users` table DDL; no FK constraint is declared.

### Relationships

- `messages` → one-to-many with `Message` (via `conversation_id`)

### SQLModel (reference)

```python
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
    user_id: str = Field(nullable=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()))
    updated_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()))
    messages: list["Message"] = Relationship(back_populates="conversation")
```

---

## Entity: `Message`

Represents one turn in a conversation — either a user message or an AI assistant reply.

### Fields

| Field             | Python Type | DB Type                    | Constraints                                       |
|-------------------|-------------|----------------------------|---------------------------------------------------|
| `id`              | `uuid.UUID` | `UUID`                     | PK, default `uuid4()`                            |
| `conversation_id` | `uuid.UUID` | `UUID`                     | NOT NULL, FK → `conversations.id` (CASCADE)       |
| `user_id`         | `str`       | `VARCHAR`                  | NOT NULL, indexed                                 |
| `role`            | `str`       | `VARCHAR(20)`              | NOT NULL, CHECK IN ('user', 'assistant')          |
| `content`         | `str`       | `TEXT`                     | NOT NULL, min length 1                           |
| `created_at`      | `datetime`  | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`                        |

### Role Enum

```python
class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
```

Enforced at the Python layer via `MessageRole` enum. The Alembic migration adds a
`CHECK` constraint at the DB layer for defence in depth.

### Relationships

- `conversation` → many-to-one with `Conversation` (via `conversation_id`)

### SQLModel (reference)

```python
class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False, index=True)
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(max_length=20, nullable=False)  # use MessageRole enum at app layer
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()))
    conversation: "Conversation" = Relationship(back_populates="messages")
```

---

## Entity: `Task` (existing — unchanged)

No schema changes. Phase 3.1 reads task data through MCP tools only.

---

## State Transitions

```
User sends chat message
       │
       ▼
GET or CREATE Conversation (user_id)
       │
       ▼
Persist Message (role="user", content=user_input)
       │
       ▼
Fetch all Messages for Conversation (ordered by created_at ASC)
       │
       ▼
AI Agent processes with history → calls MCP tools → generates response
       │
       ▼
Persist Message (role="assistant", content=agent_response)
       │
       ▼
UPDATE Conversation.updated_at = now()
```

---

## Indexes

| Index Name                        | Table           | Columns                        | Purpose                         |
|-----------------------------------|-----------------|--------------------------------|---------------------------------|
| `idx_conversations_user_id`       | `conversations` | `(user_id)`                   | All conversations for a user    |
| `idx_messages_conversation_id`    | `messages`      | `(conversation_id, created_at)`| Ordered history for a chat      |
| `idx_messages_user_id`            | `messages`      | `(user_id)`                   | User-scoped message lookup      |

---

---

# Data Model: Phase 3.3 — Frontend Chat UI (Client-Side)

**Date**: 2026-03-04

No new database tables. Phase 3.3 is a frontend-only addition (plus one backend route).

---

## Client-Side Data Model (TypeScript)

### `ChatMessage` (component state, not persisted)

Represents a single rendered message bubble in the Chat Window. Hydrated from
`ChatHistoryMessage` (API response) on load, or constructed locally on send.

| Field       | Type                     | Source                                    |
|-------------|--------------------------|-------------------------------------------|
| `id`        | `string`                 | UUID from backend, or `opt-${Date.now()}` for optimistic user message |
| `role`      | `"user" \| "assistant"` | From API response or local constant       |
| `content`   | `string`                 | Message text                              |
| `isRTL`     | `boolean`                | Computed once via `detectRTL(content)` on append |
| `createdAt` | `string`                 | ISO 8601 from backend or `new Date().toISOString()` |

### `ConversationState` (component state)

| Field             | Type                     | Initial Value             |
|-------------------|--------------------------|---------------------------|
| `conversationId`  | `string \| null`        | From URL `?conversation_id` or `null` |
| `messages`        | `ChatMessage[]`         | `[]`                      |
| `isLoading`       | `boolean`               | `false`                   |
| `lastToolCalls`   | `string[]`              | `[]`                      |
| `error`           | `string \| null`        | `null`                    |

---

## API Response Types (frontend interfaces in `api.ts`)

### `ChatSendResponse` ← `POST /api/{user_id}/chat`

| Field             | Type       | Notes                        |
|-------------------|------------|------------------------------|
| `conversation_id` | `string`   | UUID string                  |
| `response`        | `string`   | AI assistant reply           |
| `tool_calls`      | `string[]` | MCP tool names invoked       |

### `ChatHistoryResponse` ← `GET /api/{user_id}/conversations/{id}/messages`

| Field      | Type                  | Notes                    |
|------------|-----------------------|--------------------------|
| `messages` | `ChatHistoryMessage[]`| Ordered by `created_at` ASC |

### `ChatHistoryMessage`

| Field        | Type                    | Notes            |
|--------------|-------------------------|------------------|
| `id`         | `string`                | UUID             |
| `role`       | `"user" \| "assistant"` | Message role     |
| `content`    | `string`                | Message text     |
| `created_at` | `string`                | ISO 8601         |

---

## New Backend Route

**File**: `backend/app/routes/chat.py`
**Method**: `GET /{user_id}/conversations/{conversation_id}/messages`
**Auth**: Same JWT dependency as all other routes
**Response**: `ChatHistoryResponse` shape (messages array ordered by `created_at` ASC)
**No new DB tables or model changes required.**
