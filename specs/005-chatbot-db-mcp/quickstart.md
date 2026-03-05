# Quickstart: Phase 3.1 MCP Server Verification

**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-03

This guide verifies the Phase 3.1 implementation independently of the AI Agent.

---

## Prerequisites

```bash
cd todo-web-app/backend
cp .env.example .env        # Fill DATABASE_URL, BETTER_AUTH_SECRET
uv sync                     # Install all dependencies including mcp[cli]
alembic upgrade head        # Creates conversations + messages tables
```

---

## 1. Run MCP Inspector (Standalone Tool Test)

The official MCP SDK ships with `mcp dev` — an interactive inspector that lists
and calls tools against a running MCP server via STDIO.

```bash
# From todo-web-app/backend/
uv run mcp dev app/mcp/server.py
```

This opens an interactive inspector at `http://localhost:5173` (default).
In the inspector:
1. Click "List Tools" — verify all 5 tools appear (`add_task`, `list_tasks`,
   `complete_task`, `delete_task`, `update_task`).
2. Select `add_task`, fill `user_id` and `title`, click "Call Tool".
3. Verify the response contains `{ "success": true, "task": { ... } }`.

---

## 2. CLI Test Script (Automated Verification)

A Python test script at `todo-web-app/backend/scripts/test_mcp_tools.py` can
be run without the AI Agent:

```bash
# From todo-web-app/backend/
TEST_USER_ID="test-user-001" uv run python scripts/test_mcp_tools.py
```

The script directly imports and calls the service functions from `app/services/tasks.py`
(not via MCP protocol) to verify CRUD correctness, then calls the MCP tool wrapper
functions to verify the contract layer.

Expected output:
```
[PASS] add_task: created task "Buy milk" (id=...)
[PASS] list_tasks (all): 1 task returned
[PASS] list_tasks (pending): 1 task returned
[PASS] list_tasks (completed): 0 tasks returned
[PASS] complete_task: task marked complete
[PASS] list_tasks (completed): 1 task returned
[PASS] update_task: title changed to "Buy oat milk"
[PASS] delete_task: task removed
[PASS] list_tasks (all): 0 tasks returned
[PASS] user isolation: cross-user task_id returns error
All 10 checks passed.
```

---

## 3. Alembic Migration Verification

```bash
# Verify Phase 2 tables untouched and Phase 3 tables present
uv run alembic current          # Should show: 002 (head)
uv run alembic history          # Should show: 001 -> 002 (head)

# Downgrade and upgrade test
uv run alembic downgrade -1     # Drops conversations + messages only
uv run alembic upgrade head     # Re-creates them
```

---

## 4. FastAPI Health Check (Confirm No Regressions)

```bash
uv run uvicorn app.main:app --reload --port 8000

# In another terminal:
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"2.1.0"}

curl -X GET http://localhost:8000/api/{user_id}/tasks \
     -H "Authorization: Bearer <valid_jwt>"
# Expected: Phase 2 list endpoint still works
```

---

## 5. Acceptance Criteria Verification Checklist

- [ ] `mcp dev app/mcp/server.py` lists exactly 5 tools
- [ ] `add_task` creates a task visible in `list_tasks`
- [ ] `complete_task` is idempotent (call twice → same success result)
- [ ] `delete_task` removes the task; subsequent `list_tasks` excludes it
- [ ] Cross-user `task_id` returns `{"success": false, "error": "Task not found."}`
- [ ] `alembic downgrade -1` removes Phase 3 tables without touching `tasks`
- [ ] `alembic upgrade head` re-creates Phase 3 tables cleanly
- [ ] Phase 2 REST endpoints (`/api/{user_id}/tasks`) work unchanged
