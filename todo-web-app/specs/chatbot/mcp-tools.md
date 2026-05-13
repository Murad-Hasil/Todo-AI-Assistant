# MCP Tools Specification: Phase 3 AI Agent Tool Boundary

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft
**Phase**: 3.1 — MCP Server

## Overview

The MCP (Model Context Protocol) server exposes exactly five tools that the AI
Agent MUST use — and exclusively use — to interact with the user's Todo list.
All tools are stateless: they accept parameters, interact with Neon PostgreSQL
via SQLModel, and return a result. No tool maintains internal state between calls.

The MCP server is implemented using the **Official MCP SDK (Python)**. Every
tool enforces user-data isolation via the `user_id` parameter — the AI Agent
MUST pass the authenticated user's ID (extracted from the verified JWT) to every
tool call. Tools MUST NOT trust any implicit session context.

---

## Tool Specifications

### 1. `add_task`

**Description**: Creates a new task for the specified user.

**Parameters**:

| Parameter     | Type   | Required | Description                                   |
|---------------|--------|----------|-----------------------------------------------|
| `user_id`     | string (UUID) | Yes | Authenticated user's ID — scopes the task. |
| `title`       | string | Yes      | Task title. 1–200 characters. Non-empty.      |
| `description` | string | No       | Optional task description. Max 1000 chars.    |

**Return type**:

```json
{
  "success": true,
  "task": {
    "id": "<uuid>",
    "title": "<string>",
    "description": "<string|null>",
    "completed": false,
    "user_id": "<uuid>",
    "created_at": "<ISO8601>"
  }
}
```

**Error return**:

```json
{ "success": false, "error": "<human-readable message>" }
```

**Error conditions**:
- `title` is empty or whitespace-only → error: "Task title cannot be empty."
- `title` exceeds 200 characters → error: "Task title too long (max 200 chars)."
- `user_id` does not exist in the `users` table → error: "User not found."
- Database write failure → error: "Failed to create task. Please try again."

---

### 2. `list_tasks`

**Description**: Retrieves the task list for the specified user, with optional
status filtering.

**Parameters**:

| Parameter | Type   | Required | Description                                         |
|-----------|--------|----------|-----------------------------------------------------|
| `user_id` | string (UUID) | Yes | Authenticated user's ID — scopes the query.  |
| `status`  | string | No       | Filter: `"all"` (default), `"pending"`, `"completed"` |

**Return type**:

```json
{
  "success": true,
  "tasks": [
    {
      "id": "<uuid>",
      "title": "<string>",
      "description": "<string|null>",
      "completed": true,
      "created_at": "<ISO8601>",
      "updated_at": "<ISO8601>"
    }
  ],
  "count": 3
}
```

**Error return**:

```json
{ "success": false, "error": "<human-readable message>" }
```

**Error conditions**:
- `status` is not one of `"all"`, `"pending"`, `"completed"` → error: "Invalid status filter. Use: all, pending, completed."
- `user_id` does not exist → returns `{ "success": true, "tasks": [], "count": 0 }` (user has no tasks).
- Database read failure → error: "Failed to retrieve tasks. Please try again."

**Behaviour**:
- Default `status = "all"` returns both completed and pending tasks.
- `status = "pending"` returns tasks where `completed = false`.
- `status = "completed"` returns tasks where `completed = true`.
- Results are ordered by `created_at DESC` (newest first).

---

### 3. `complete_task`

**Description**: Marks a specific task as completed. Idempotent — calling on
an already-completed task returns success without error.

**Parameters**:

| Parameter | Type          | Required | Description                                    |
|-----------|---------------|----------|------------------------------------------------|
| `user_id` | string (UUID) | Yes      | Authenticated user's ID — enforces ownership.  |
| `task_id` | string (UUID) | Yes      | ID of the task to mark complete.               |

**Return type**:

```json
{
  "success": true,
  "task": {
    "id": "<uuid>",
    "title": "<string>",
    "completed": true,
    "updated_at": "<ISO8601>"
  }
}
```

**Error return**:

```json
{ "success": false, "error": "<human-readable message>" }
```

**Error conditions**:
- Task with `task_id` does not exist OR belongs to a different user →
  error: "Task not found."
- Database write failure → error: "Failed to update task. Please try again."

---

### 4. `delete_task`

**Description**: Permanently removes a task from the user's list. This action
is irreversible.

**Parameters**:

| Parameter | Type          | Required | Description                                    |
|-----------|---------------|----------|------------------------------------------------|
| `user_id` | string (UUID) | Yes      | Authenticated user's ID — enforces ownership.  |
| `task_id` | string (UUID) | Yes      | ID of the task to delete.                      |

**Return type**:

```json
{
  "success": true,
  "deleted_task_id": "<uuid>",
  "message": "Task deleted successfully."
}
```

**Error return**:

```json
{ "success": false, "error": "<human-readable message>" }
```

**Error conditions**:
- Task with `task_id` does not exist OR belongs to a different user →
  error: "Task not found."
- Database write failure → error: "Failed to delete task. Please try again."

---

### 5. `update_task`

**Description**: Updates the title and/or description of an existing task.
At least one of `title` or `description` MUST be provided.

**Parameters**:

| Parameter     | Type          | Required | Description                                           |
|---------------|---------------|----------|-------------------------------------------------------|
| `user_id`     | string (UUID) | Yes      | Authenticated user's ID — enforces ownership.         |
| `task_id`     | string (UUID) | Yes      | ID of the task to update.                             |
| `title`       | string        | No       | New title (1–200 chars). Replaces existing if provided. |
| `description` | string        | No       | New description (max 1000 chars). Pass empty string `""` to clear it. |

**Return type**:

```json
{
  "success": true,
  "task": {
    "id": "<uuid>",
    "title": "<string>",
    "description": "<string|null>",
    "completed": false,
    "updated_at": "<ISO8601>"
  }
}
```

**Error return**:

```json
{ "success": false, "error": "<human-readable message>" }
```

**Error conditions**:
- Neither `title` nor `description` provided → error: "Provide at least title or description to update."
- Task with `task_id` does not exist OR belongs to a different user →
  error: "Task not found."
- `title` is empty string or whitespace → error: "Task title cannot be empty."
- `title` exceeds 200 characters → error: "Task title too long (max 200 chars)."
- Database write failure → error: "Failed to update task. Please try again."

---

## MCP Server Requirements

- Server MUST be implemented with the **Official MCP SDK for Python**.
- Server MUST expose a `list_tools` endpoint that returns the five tools above
  with their full parameter schemas (JSON Schema format).
- Server MUST accept a database session or connection string at startup — no
  hardcoded connection strings.
- Server MUST NOT store any user state between tool calls.
- Tool handler functions MUST be pure: given the same inputs and database state,
  they MUST return the same output.
- All database operations MUST use SQLModel ORM sessions (no raw SQL strings)
  to prevent SQL injection.

---

## Acceptance Criteria

- [ ] MCP server starts without errors and correctly lists all 5 tools via `list_tools`.
- [ ] `add_task` creates a task visible via `list_tasks` with the correct `user_id`.
- [ ] `list_tasks` with `status="pending"` returns only incomplete tasks.
- [ ] `list_tasks` with `status="completed"` returns only completed tasks.
- [ ] `complete_task` sets `completed=true`; calling again on same task returns success (idempotent).
- [ ] `delete_task` removes the task; subsequent `list_tasks` does not include it.
- [ ] `update_task` modifies title/description; unchanged fields retain their values.
- [ ] All tools return `{ "success": false, "error": "Task not found." }` when
      a `task_id` from a different user is provided (user-isolation enforced).
- [ ] All tools return appropriate errors for invalid inputs (empty title, bad status filter).
- [ ] No tool call succeeds without a valid `user_id` that exists in the database.
