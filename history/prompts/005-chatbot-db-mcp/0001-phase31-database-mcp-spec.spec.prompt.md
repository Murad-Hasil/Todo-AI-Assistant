---
id: "0001"
title: Phase 3.1 Database and MCP Spec
stage: spec
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.specify
labels: ["spec","phase3","chatbot","mcp","database","conversations","messages","roman-urdu"]
links:
  spec: todo-web-app/specs/chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chatbot-db-mcp/spec.md
  - specs/005-chatbot-db-mcp/checklists/requirements.md
  - todo-web-app/specs/chatbot/spec.md
  - todo-web-app/specs/chatbot/database.md
  - todo-web-app/specs/chatbot/mcp-tools.md
  - todo-web-app/specs/chatbot/behavior.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 3.1: Database Evolution & MCP Server in the `/todo-web-app/specs/chatbot/` directory, derived strictly from the Project PDF (Pages 17-20).

The specification must cover:
1. DATABASE MODELS (@specs/chatbot/database.md):
   - Table `conversations`: id (PK), user_id (FK), created_at, updated_at.
   - Table `messages`: id (PK), conversation_id (FK), user_id (FK), role (user/assistant), content (text), created_at.
   - Purpose: Store stateless conversation history for retrieval in the AI loop.

2. MCP TOOLS SPECIFICATION (@specs/chatbot/mcp-tools.md):
   - Based on Page 18-19 of the PDF, define the parameters and return types for:
     - `add_task`: user_id, title, description (optional).
     - `list_tasks`: user_id, status (all/pending/completed).
     - `complete_task`: user_id, task_id.
     - `delete_task`: user_id, task_id.
     - `update_task`: user_id, task_id, title (optional), description (optional).
   - Constraint: All tools must be stateless and interact directly with the Neon DB via SQLModel.

3. AGENT BEHAVIOR SPEC (@specs/chatbot/behavior.md):
   - Define triggers for each tool (e.g., "When user says done/finished, use complete_task").
   - Requirement for Urdu support (Bonus point): The agent must understand and respond in Urdu if addressed in Urdu.

4. ACCEPTANCE CRITERIA:
   - MCP server must correctly list tools via the Official MCP SDK.
   - Database migrations must support new conversation and message tables.

## Response snapshot

Created branch `005-chatbot-db-mcp` and 6 specification files:

**SDD root** (`specs/005-chatbot-db-mcp/`):
- `spec.md` — SDD index with artifact table and Constitution Check (I–XI all pass).
- `checklists/requirements.md` — all items pass; spec ready for /sp.plan.

**Chatbot specs** (`todo-web-app/specs/chatbot/`):
- `spec.md` — 3 user stories (persistence P1, MCP tools P1, Roman Urdu P2),
  10 FRs, 5 measurable success criteria, edge cases.
- `database.md` — full schema for `conversations` and `messages` tables, indexes,
  FK constraints, cascade rules, SQLModel reference models, Alembic migration
  requirements, 6 acceptance criteria.
- `mcp-tools.md` — 5 MCP tool contracts with typed parameters, JSON return shapes,
  error conditions for all edge cases, MCP server requirements, 10 acceptance criteria.
- `behavior.md` — trigger definitions for all 5 tools in English + Roman Urdu,
  language detection/switching rules, error-to-UX translation table, general
  agent behavioral rules, 10 acceptance criteria.

All 11 Constitution principles checked. No [NEEDS CLARIFICATION] markers.

## Outcome

- ✅ Impact: Phase 3.1 spec complete — database, MCP tool contracts, and agent behavior fully specified across 4 artifact files.
- 🧪 Tests: null
- 📁 Files: 6 files created across specs/005-chatbot-db-mcp/ and todo-web-app/specs/chatbot/
- 🔁 Next prompts: /sp.plan for Phase 3.1 architecture design, then /sp.tasks for implementation tasks
- 🧠 Reflection: Spec correctly separated concerns into 3 focused artifacts (database, MCP, behavior) for clarity and independent testability. Roman Urdu trigger vocabulary is explicit enough to implement without further clarification.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): requirements checklist — all items PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
