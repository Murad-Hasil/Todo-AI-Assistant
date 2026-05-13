# Feature Spec: Advanced Task Features (014)

**Phase:** V — Part A (Advanced Features)
**Branch:** `014-advanced-task-features`
**Constitution:** `.specify/memory/constitution.md` v2.3.0

---

## Overview

Implement Intermediate and Advanced Level task features as required by Phase V Part A of the hackathon specification. This elevates the Todo app from basic CRUD to a fully-featured task management system with organization, prioritization, and scheduling capabilities.

## User Stories

### US1 — Task Priority
**As a user**, I can assign a priority level (high/medium/low) to each task so I can focus on what matters most.

**Acceptance Criteria:**
- Tasks have a `priority` field: `"high"`, `"medium"` (default), or `"low"`
- Priority is visible as a colored badge in the task list (high=red, medium=yellow, low=green)
- Priority can be set on creation and updated later
- AI agent understands priority intent ("urgent" → high, "someday" → low)

### US2 — Task Tags / Categories
**As a user**, I can add tags/categories to tasks (e.g. "work", "home", "shopping") to organize them.

**Acceptance Criteria:**
- Tasks have an optional `tags` field (comma-separated string, max 500 chars)
- Tags are displayed as small pills in the task list
- Tags can be set on creation and updated later
- AI agent extracts category intent ("for work" → tags="work")

### US3 — Due Dates
**As a user**, I can set a due date/time on tasks so I know when things need to be done.

**Acceptance Criteria:**
- Tasks have an optional `due_date` field (timezone-aware datetime)
- Due dates are displayed in the task list ("Due: Apr 10")
- Overdue tasks (past due_date, not completed) show in red
- AI agent parses natural language dates ("by Friday", "tomorrow 3pm")
- Integrates with existing Dapr Jobs reminder system

## Out of Scope

- Recurring Tasks (separate feature — complexity too high for current sprint)
- Search/Filter by tag or priority (Phase V Part A follow-up)
- Due date notifications via email/push (Kafka reminder system already handles this)

## Data Model Changes

### Task table additions (Neon PostgreSQL)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `priority` | VARCHAR(10) | NOT NULL | `'medium'` | low\|medium\|high |
| `tags` | VARCHAR(500) | NULL | — | comma-separated |
| `due_date` | TIMESTAMPTZ | NULL | — | future recommended |

## API Contract Changes

### POST /api/{user_id}/tasks
**Request additions:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "priority": "low|medium|high (default: medium)",
  "tags": "work,home (optional)",
  "due_date": "2026-04-10T14:00:00Z (optional ISO 8601)"
}
```

### PUT /api/{user_id}/tasks/{id}
Same additions as POST — all new fields optional in update.

### GET /api/{user_id}/tasks (TaskRead response)
**Response additions:**
```json
{
  "priority": "medium",
  "tags": "work,home",
  "due_date": "2026-04-10T14:00:00Z"
}
```

## MCP Tool Changes

### `add_task` tool
New optional parameters: `priority`, `tags`, `due_date` (ISO string)

### `update_task` tool
New optional parameters: `priority`, `tags`, `due_date` (ISO string)

## Frontend Changes

- Task card: priority badge, tag pills, due date label (red if overdue)
- Add Task form: priority select, tags text input, due date datetime picker
- Edit task inline: same new fields editable

## Non-Functional Requirements

- Migration is additive (no breaking changes to existing tasks)
- Existing tasks default to priority="medium", no tags, no due_date
- Agent backward compatible — new fields optional in all flows
