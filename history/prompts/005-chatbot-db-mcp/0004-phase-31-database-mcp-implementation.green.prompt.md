---
id: "0004"
title: "Phase 3.1 Database MCP Implementation"
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.implement
labels: ["green","mcp","database","alembic","fastmcp","logic-extraction","phase3.1"]
links:
  spec: todo-web-app/specs/chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/pyproject.toml
  - todo-web-app/backend/app/models.py
  - todo-web-app/backend/app/logic/__init__.py
  - todo-web-app/backend/app/logic/task_ops.py
  - todo-web-app/backend/app/routes/tasks.py
  - todo-web-app/backend/app/mcp/__init__.py
  - todo-web-app/backend/app/mcp/server.py
  - todo-web-app/backend/migrations/versions/002_add_conversations_messages.py
  - todo-web-app/backend/CLAUDE.md
  - .claude/settings.json
  - todo-web-app/specs/chatbot/phase3-mcp-tasks.md
tests:
  - "Import: from app.mcp.server import mcp → OK"
  - "Tool count: 5 tools registered (add_task, list_tasks, complete_task, delete_task, update_task)"
  - "Migration: alembic current → 002 (head)"
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/chatbot/phase3-mcp-tasks.md` for Phase 3.1: Database Evolution & MCP Server.

STRICT IMPLEMENTATION RULES:
1. DIRECTORY ISOLATION: All backend code must be placed strictly within `/todo-web-app/backend/`.
2. READ-BEFORE-WRITE: Before generating code, read the Phase 3 Constitution, the existing Phase 2 database models.
3. TASK MAPPING: Implement tasks T-3.1.1 through T-3.1.9 in sequence. Every file must include a comment referencing the Task ID.
4. DATABASE EVOLUTION: Use SQLModel to define Conversation and Message tables.
5. LOGIC REFACTORING: Extract the task CRUD logic into app/logic/task_ops.py.
6. MCP SERVER IMPLEMENTATION: Use the mcp Python SDK in app/mcp/server.py with 5 tools, each requiring user_id.

## Response snapshot

All Phase 3.1 tasks (T-3.0.1 → T-3.1.9) implemented and verified:
- pyproject.toml: mcp[cli]>=1.0.0 added, uv sync OK
- app/models.py: MessageRole, Conversation, Message added (SQLModel nullable+sa_column conflict fixed)
- migrations/002: runs cleanly → alembic at 002 (head)
- app/logic/task_ops.py: 6 pure functions (get_task_for_user + 5 op_*)
- app/routes/tasks.py: refactored as thin HTTP adapters
- app/mcp/server.py: FastMCP with 5 tools, all stateless, all user_id-first
- .claude/settings.json: broken todo-mcp-server path fixed
- Verification: 5/5 tools listed, all imports clean

## Outcome

- ✅ Impact: Phase 3.1 complete — DB evolved, logic extracted, MCP server live with 5 tools
- 🧪 Tests: Import check PASS, tool registration 5/5 PASS, alembic 002 head PASS
- 📁 Files: 11 files created/modified
- 🔁 Next prompts: Phase 3.2 — /api/chat endpoint + OpenAI Agents SDK + Groq
- 🧠 Reflection: SQLModel Field(nullable=..., sa_column=...) conflict is a known gotcha; app/logic/ used instead of app/services/ per explicit implement command

## Evaluation notes (flywheel)

- Failure modes observed: SQLModel RuntimeError on Field(nullable=..., sa_column=...) — fixed by removing nullable kwarg
- Graders run and results (PASS/FAIL): import PASS, tool registration PASS, migration PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add a live smoke test script for MCP tools against Neon DB
