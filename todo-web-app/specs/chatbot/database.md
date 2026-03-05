# Database Specification: Phase 3 Conversation & Message Storage

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft
**Phase**: 3.1 — Database Evolution

## Purpose

Extend the existing Neon PostgreSQL schema (Phase 2: `users`, `tasks`) with two
new tables that enable stateless conversation history retrieval for the AI loop.
Every AI request fetches the full history from these tables; no in-memory state
is maintained between requests.

---

## Table: `conversations`

### Schema

| Column       | Type                        | Constraints                        |
|--------------|-----------------------------|------------------------------------|
| `id`         | UUID                        | PRIMARY KEY, default gen_random_uuid() |
| `user_id`    | UUID                        | NOT NULL, FK → users.id ON DELETE CASCADE |
| `created_at` | TIMESTAMP WITH TIME ZONE    | NOT NULL, default now()            |
| `updated_at` | TIMESTAMP WITH TIME ZONE    | NOT NULL, default now()            |

### Indexes

- `idx_conversations_user_id` on `(user_id)` — fast lookup of all conversations
  belonging to a user.

### Constraints

- `user_id` MUST reference a valid row in `users` (Phase 2 table). Deleting a
  user MUST cascade-delete all their conversations.
- `updated_at` MUST be refreshed on every new message appended to the conversation.

### SQLModel Model (reference, not implementation)

```
class Conversation(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: list["Message"] = Relationship(back_populates="conversation")
```

---

## Table: `messages`

### Schema

| Column            | Type                     | Constraints                                    |
|-------------------|--------------------------|------------------------------------------------|
| `id`              | UUID                     | PRIMARY KEY, default gen_random_uuid()         |
| `conversation_id` | UUID                     | NOT NULL, FK → conversations.id ON DELETE CASCADE |
| `user_id`         | UUID                     | NOT NULL, FK → users.id ON DELETE CASCADE      |
| `role`            | VARCHAR(20)              | NOT NULL, CHECK (role IN ('user', 'assistant'))|
| `content`         | TEXT                     | NOT NULL                                       |
| `created_at`      | TIMESTAMP WITH TIME ZONE | NOT NULL, default now()                        |

### Indexes

- `idx_messages_conversation_id` on `(conversation_id, created_at)` — ordered
  message retrieval for a given conversation (chronological AI history feed).
- `idx_messages_user_id` on `(user_id)` — user-scoped message lookup.

### Constraints

- `conversation_id` MUST reference a valid row in `conversations`. Deleting a
  conversation MUST cascade-delete all its messages.
- `user_id` MUST match the `user_id` of the parent `conversations` row — this
  redundancy allows fast user-scoped queries without a join and enables the
  MCP tool boundary enforcement.
- `role` MUST be one of exactly `'user'` or `'assistant'`; no other values are
  permitted.
- `content` MUST NOT be empty (length ≥ 1 character).

### SQLModel Model (reference, not implementation)

```
class Message(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    role: str = Field(max_length=20, nullable=False)  # "user" | "assistant"
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    conversation: Conversation = Relationship(back_populates="messages")
```

---

## Alembic Migration Requirements

- Migration MUST be created as a new revision (not modifying existing Phase 2
  migrations). File: `migrations/versions/<rev_id>_add_conversations_messages.py`
- Migration MUST be idempotent (safe to run on a database that already has
  Phase 2 tables; MUST NOT alter `users` or `tasks` tables).
- `upgrade()`: create `conversations` table → create `messages` table
  (order matters: FK dependency).
- `downgrade()`: drop `messages` table → drop `conversations` table.
- Migration MUST include the `idx_conversations_user_id`,
  `idx_messages_conversation_id`, and `idx_messages_user_id` indexes.

---

## Acceptance Criteria

- [ ] `conversations` table exists in Neon PostgreSQL after migration runs.
- [ ] `messages` table exists with correct FK relationships.
- [ ] Inserting a message with an invalid `role` value raises a database constraint error.
- [ ] Deleting a user cascades to delete their conversations and messages.
- [ ] `alembic upgrade head` runs without error on a Phase 2 database.
- [ ] `alembic downgrade -1` cleanly removes Phase 3 tables without touching Phase 2 tables.
- [ ] Existing Phase 2 API endpoints (`/api/tasks`, `/api/auth`) are unaffected by migration.
