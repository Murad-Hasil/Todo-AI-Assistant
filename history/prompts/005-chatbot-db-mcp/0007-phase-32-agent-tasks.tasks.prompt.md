---
id: "0007"
title: "Phase 3.2 Agent Tasks"
stage: tasks
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.tasks
labels: ["tasks","ai-agent","openai-agents-sdk","groq","mcp","fastapi","phase3.2"]
links:
  spec: todo-web-app/specs/chatbot/phase3.2-spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3-agent-tasks.md
tests:
  - none (tasks stage)
---

## Prompt

Generate a task list for Phase 3.2: AI Agent Logic & Stateless Backend Endpoint in `/todo-web-app/specs/chatbot/phase3-agent-tasks.md` based strictly on the plan `@/todo-web-app/specs/chatbot/phase3-agent-plan.md`.

The task list must include:
1. SETUP & CONFIGURATION:
   - T-3.2.1: AI Dependencies (Update `pyproject.toml` with `openai` SDK and `pydantic-settings`).
   - T-3.2.2: Groq Client Config (Setup environment variables for `GROQ_API_KEY` and configure the OpenAI client with Groq's `base_url`).

2. DATA PERSISTENCE HELPERS:
   - T-3.2.3: History Retrieval Logic (Implement a function to fetch the last 10 messages from the database for a specific `conversation_id`, formatted for the AI SDK).
   - T-3.2.4: Message Logging Logic (Implement functions to save incoming user messages and outgoing assistant responses to the `messages` table).

3. AGENT CORE:
   - T-3.2.5: System Prompt Definition (Create `app/agent/prompts.py` with the "Todo Architect" instructions, tool usage rules, and Urdu support).
   - T-3.2.6: Agent Runner (Implement the core loop in `app/agent/runner.py` that connects the LLM, the system prompt, the message history, and the MCP tools from `app/mcp/server.py`).

4. API INTEGRATION:
   - T-3.2.7: Chat Endpoint Implementation (Create `app/routes/chat.py` with the `POST /api/{user_id}/chat` endpoint).
   - T-3.2.8: Request Orchestration (Wire the endpoint to: Authenticate -> Load/Create Conversation -> Save Message -> Run Agent -> Save Response -> Return JSON).

5. VERIFICATION CRITERIA:
   - T-3.2.4 is verified when a user message is visible in the `messages` table after an API call.
   - T-3.2.8 is verified when a POST request returns a logical response from the AI and includes the `tool_calls` made to the database.

6. STYLISTIC RULES:
   - Use Task IDs in comments: `# [Task]: T-3.2.x`.
   - Ensure the Agent loop handles Groq API errors and tool execution failures gracefully.

## Response snapshot

Created `todo-web-app/specs/chatbot/phase3-agent-tasks.md` with:
- 5 phases: Setup (T-3.2.1–T-3.2.2), Scaffold (T-3.2.0), US2 DB helpers (T-3.2.3–T-3.2.4), US1 Agent+Endpoint (T-3.2.5–T-3.2.8), Verification (T-3.2.9–T-3.2.10)
- 11 total tasks (T-3.2.0 through T-3.2.10)
- US1 (P1): Conversational Task Management — T-3.2.5, T-3.2.6, T-3.2.7, T-3.2.8
- US2 (P1): Persistent Conversation Context — T-3.2.3, T-3.2.4
- US3 (P2): Roman Urdu — covered by LANGUAGE ADAPTATION rule in T-3.2.5 (prompts.py)
- Full code blocks for all 8 user-specified tasks with exact file paths
- Groq error handling (APITimeoutError, APIConnectionError) → HTTP 503 in T-3.2.6
- MCPServerFastMCP in-process preferred; MCPServerStdio subprocess fallback in T-3.2.6
- Dependency graph + parallel execution examples
- Note: `app/logic/task_ops.py` is used (not `app/services/tasks.py`) per Phase 3.1 implementation

## Outcome

- ✅ Impact: Phase 3.2 tasks generated — ready for /sp.implement
- 🧪 Tests: None at tasks stage
- 📁 Files: 1 file created (phase3-agent-tasks.md)
- 🔁 Next prompts: /sp.implement to execute all T-3.2.x tasks
- 🧠 Reflection: T-3.2.0 (package scaffold) added as an implicit prerequisite not in user's list but required before any runner.py imports resolve; `app/logic/task_ops.py` vs `app/services/tasks.py` noted explicitly to prevent confusion during implementation

## Evaluation notes (flywheel)

- Failure modes observed: Session was interrupted by context compaction mid-task; resumed cleanly from plan file read
- Graders run and results (PASS/FAIL): Format validation — all 11 tasks follow checklist format (checkbox, ID, [P]/[USx] labels, file paths)
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add a quickstart.md with end-to-end curl test sequence for Phase 3.2
