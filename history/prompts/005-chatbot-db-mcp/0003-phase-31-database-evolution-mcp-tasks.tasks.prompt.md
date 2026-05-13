---
id: "0003"
title: "Phase 3.1 Database Evolution MCP Tasks"
stage: tasks
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.tasks
labels: ["tasks","mcp","database","phase3.1","alembic","fastmcp","services"]
links:
  spec: todo-web-app/specs/chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3-mcp-tasks.md
tests:
  - none (no test tasks in Phase 3.1 per spec; verification via mcp dev inspector and test_mcp_tools.py script)
---

## Prompt

Generate a task list for Phase 3.1: Database Evolution & MCP Server in `/todo-web-app/specs/chatbot/phase3-mcp-tasks.md` based strictly on the plan `@/todo-web-app/specs/chatbot/phase3-mcp-plan.md`.

The task list must include:
1. DATABASE EVOLUTION TASKS:
   - T-3.1.1: Conversation Model (Define `Conversation` SQLModel in `app/models.py` with user_id relationship).
   - T-3.1.2: Message Model (Define `Message` SQLModel with role [user/assistant], content, and conversation_id).
   - T-3.1.3: DB Migration Execution (Update the Neon DB schema to include the new tables).

2. LOGIC REFACTORING TASKS:
   - T-3.1.4: Core Logic Extraction (Refactor `routes/tasks.py` logic into a shared `app/logic/task_ops.py` so that both the REST API and MCP Server can use the same code).

3. MCP SERVER TASKS:
   - T-3.1.5: MCP SDK Initialization (Setup the Official MCP SDK in `app/mcp/server.py`).
   - T-3.1.6: Implement `add_task` Tool (Wrap logic to allow AI to create tasks).
   - T-3.1.7: Implement `list_tasks` Tool (Wrap logic to allow AI to fetch tasks with status filters).
   - T-3.1.8: Implement `complete_task` & `delete_task` Tools (Wrap logic for status toggle and removal).
   - T-3.1.9: Implement `update_task` Tool (Wrap logic for title/description modification).

4. VERIFICATION CRITERIA:
   - T-3.1.3 is verified when the new tables are visible via the `postgres` MCP or DB console.
   - T-3.1.5-3.1.9 are verified when the MCP server successfully lists all 5 tools when queried by an external client.

5. STYLISTIC RULES:
   - Use Task IDs in comments: `# [Task]: T-3.1.x`.
   - Ensure all MCP tools are stateless and require `user_id` as an input parameter.

## Response snapshot

Generated `todo-web-app/specs/chatbot/phase3-mcp-tasks.md` with 5 phases and 14 tasks total (T-3.0.1–T-3.0.3, T-3.1.1–T-3.1.9, T-3.1.10–T-3.1.11).

Key decisions applied from the plan:
- Service layer path is `app/services/tasks.py` (per plan), not `app/logic/task_ops.py` (per user description — plan takes precedence per "based strictly on the plan" instruction).
- All 5 MCP tools include verbatim code blocks from the plan's Step 4, each prefixed with `# [Task]: T-3.1.x`.
- T-3.1.3 verification criteria: `alembic upgrade head` + DB console check (conversations + messages tables visible, alembic_version = 002).
- T-3.1.11 verification criteria: `mcp dev` inspector lists exactly 5 tools with correct parameter schemas.

## Outcome

- ✅ Impact: Phase 3.1 tasks file created; all 9 user-specified task IDs covered with LLM-executable instructions including exact code blocks from the plan.
- 🧪 Tests: No pytest tasks (plan specifies `mcp dev` + `scripts/test_mcp_tools.py` for verification, not pytest for Phase 3.1).
- 📁 Files: 1 created — `todo-web-app/specs/chatbot/phase3-mcp-tasks.md`
- 🔁 Next prompts: `/sp.implement` to execute Phase 3.1 tasks; or `/sp.adr` for MCP tool boundary decision.
- 🧠 Reflection: User specified `app/logic/task_ops.py` in T-3.1.4 but plan uses `app/services/tasks.py` — resolved in favour of plan (authoritative source). Noted in task description.

## Evaluation notes (flywheel)

- Failure modes observed: Minor path discrepancy (user description vs plan) — surfaced transparently in task notes.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add explicit `# [Task]: T-3.1.x` comment placement guidance to phr-template for code-heavy tasks.
