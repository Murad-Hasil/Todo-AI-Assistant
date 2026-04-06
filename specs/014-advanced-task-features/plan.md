# Implementation Plan: Advanced Task Features (014)

**Spec:** `specs/014-advanced-task-features/spec.md`
**Constitution:** v2.3.0 (Principles V, VIII, X, XII)

---

## Architecture Overview

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tags storage | VARCHAR(500) comma-separated | Simple, no array complexity, sufficient for hackathon |
| Priority type | VARCHAR(10) with app-level enum | No DB enum type — easier migrations |
| Due date timezone | TIMESTAMPTZ | Consistent with existing `created_at`/`updated_at` |
| Migration approach | Additive Alembic migration (003) | Zero downtime, non-breaking |
| Agent integration | MCP tool params + SYSTEM_PROMPT rules | Follows constitution Principle X |

### Layer Diagram

```
Frontend (Next.js)
  └── AddTaskForm / TaskCardGrid
        ├── priority <select>
        ├── tags <input>
        └── due_date <datetime-local>
              ↓ FormData → Server Action
Backend (FastAPI)
  └── routes/tasks.py (TaskCreate/TaskUpdate schemas)
        └── logic/task_ops.py (op_create_task / op_update_task)
              └── models.py (Task — 3 new columns)
                    └── Neon PostgreSQL (migration 003)
AI Agent
  └── mcp/server.py (add_task / update_task tools)
        └── agent/prompts.py (priority/tags/due_date rules)
```

### Migration Strategy

- **Migration 003** — additive only
- `priority` has `server_default='medium'` so all existing tasks get a valid value
- `tags` and `due_date` are NULL — existing tasks unaffected
- No downtime — columns added without locking existing rows

## Phase Breakdown

### Phase 1 — Database (T-6.1.x)
- Create Alembic migration 003
- Apply to Neon PostgreSQL

### Phase 2 — Backend Core (T-6.2.x)
- Update `Task` model
- Update schemas (`TaskCreate`, `TaskUpdate`, `TaskRead`)
- Update `op_create_task`, `op_update_task` in task_ops.py
- Update route handlers to pass new fields

### Phase 3 — AI Agent (T-6.3.x)
- Update MCP `add_task` + `update_task` tools
- Update SYSTEM_PROMPT with priority/tags/due_date rules

### Phase 4 — Frontend (T-6.4.x)
- Update Task TypeScript interfaces
- Update `AddTaskForm` component
- Update `TaskCardGrid` — priority badge, tag pills, due date label
- Update Server Actions to pass new fields

### Phase 5 — Deploy (T-6.5.x)
- Run migration on Neon prod
- Deploy backend to HF Space
- Deploy frontend to Vercel
- Verify E2E

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration fails on Neon | High | Test locally first; migration is additive only |
| Agent hallucinates priority | Low | Explicit PRIORITY RULE in SYSTEM_PROMPT |
| Frontend datetime-local timezone mismatch | Medium | Send as UTC ISO string; backend stores with timezone |
