---
id: "0002"
title: Phase 3.1 MCP Server Plan
stage: plan
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.plan
labels: ["plan","phase3","chatbot","mcp","database","service-layer","fastmcp","alembic"]
links:
  spec: todo-web-app/specs/chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chatbot-db-mcp/plan.md
  - specs/005-chatbot-db-mcp/research.md
  - specs/005-chatbot-db-mcp/data-model.md
  - specs/005-chatbot-db-mcp/quickstart.md
  - specs/005-chatbot-db-mcp/contracts/mcp-tools.json
  - todo-web-app/specs/chatbot/phase3-mcp-plan.md
  - CLAUDE.md
tests:
  - scripts/test_mcp_tools.py (verification script spec in quickstart.md)
---

## Prompt

Generate the technical plan for Phase 3.1: Database Evolution & MCP Server in `/todo-web-app/specs/chatbot/phase3-mcp-plan.md` based strictly on the approved specs in `@/todo-web-app/specs/chatbot/`.

The plan must include:
1. DATABASE MIGRATION STRATEGY:
   - Define `Conversation` and `Message` SQLModels in `app/models.py`.
   - Relationships: `User` -> `Conversations` (1:N), `Conversation` -> `Messages` (1:N).
   - Ensure the `Message` model includes the `role` (enum: user, assistant) and `content`.

2. MCP SERVER ARCHITECTURE:
   - Framework: Official MCP SDK (Python).
   - Location: `/todo-web-app/backend/app/mcp/server.py`.
   - Initialization: Setup a fast, lightweight server that exposes CRUD logic as tools.

3. TOOL LOGIC IMPLEMENTATION:
   - Logic: Wrap the existing CRUD functions from `routes/tasks.py` into MCP tool functions.
   - Statelessness: Each tool must accept `user_id` as a parameter to ensure the AI only modifies the correct user's data.
   - Tool Definitions: add_task, list_tasks, complete_task, delete_task, update_task

4. INTEGRATION WITH EXISTING LOGIC:
   - Refactor `logic.py` (if necessary) to make CRUD functions reusable by both the REST API and the MCP Server.
   - Ensure transaction safety when updating the database.

5. VERIFICATION PLAN:
   - Method to test the MCP server independently of the AI Agent.

## Response snapshot

Phase 0 — Research (7 key findings from code audit of `backend/app/`):
- No `logic.py` exists → create `app/services/tasks.py` as service layer.
- `user_id` is `str` (not UUID) per Better Auth pattern — Conversation/Message match.
- Alembic uses sequential numeric IDs; new migration is `002` with `down_revision="001"`.
- Use `FastMCP` from `mcp[cli]>=1.0.0` — supports `mcp dev` inspector for standalone testing.
- Service functions return `None` (not HTTPException) for not-found; MCP tools convert to error dicts.
- `complete_task` = idempotent set-to-true (not toggle like the REST PATCH).

Phase 1 — Design artifacts created:
- `research.md` — 7 decisions with rationale and alternatives.
- `data-model.md` — Conversation + Message entities with indexes and state transition diagram.
- `contracts/mcp-tools.json` — JSON Schema contracts for all 5 tools.
- `quickstart.md` — 5-step verification guide (mcp dev, CLI script, alembic test, health check).
- `todo-web-app/specs/chatbot/phase3-mcp-plan.md` — Full detailed plan with:
  - Technical Context table
  - Constitution Check (all 11 principles pass)
  - 5 implementation steps with complete reference code for models, migration, service layer, MCP server
  - Complexity Tracking (no violations)
  - 3 risks and follow-ups
- `specs/005-chatbot-db-mcp/plan.md` — SDD root plan
- `CLAUDE.md` — Updated with Phase 3.1 technology stack entries

## Outcome

- ✅ Impact: Phase 3.1 full technical plan complete — 7 artifacts, 11 constitution principles pass, 5 implementation steps with reference code.
- 🧪 Tests: verification script spec in quickstart.md; mcp dev inspector instructions
- 📁 Files: 7 planning artifacts + CLAUDE.md update
- 🔁 Next prompts: /sp.tasks to generate implementation task list
- 🧠 Reflection: Key insight — no logic.py existed, so service extraction was designed from scratch. `user_id` as str (not UUID) is a critical pattern inherited from Phase 2 that prevents FK constraint issues with Better Auth. `complete_task` idempotency (set vs toggle) resolved correctly via spec reading.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.sh didn't auto-detect tech from plan.md — manually updated CLAUDE.md
- Graders run and results (PASS/FAIL): constitution check — all 11 principles PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
