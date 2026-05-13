---
id: "0008"
title: Phase 3.2 AI Agent Implementation
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.implement
labels: ["phase3.2","ai-agent","groq","mcp","fastapi","openai-agents"]
links:
  spec: todo-web-app/specs/chatbot/phase3.2-spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/pyproject.toml
  - todo-web-app/backend/app/db.py
  - todo-web-app/backend/.env.example
  - todo-web-app/backend/app/agent/__init__.py
  - todo-web-app/backend/app/agent/prompts.py
  - todo-web-app/backend/app/agent/runner.py
  - todo-web-app/backend/app/routes/chat.py
  - todo-web-app/backend/app/schemas.py
  - todo-web-app/backend/app/main.py
  - todo-web-app/backend/CLAUDE.md
  - todo-web-app/specs/chatbot/phase3-agent-tasks.md
tests:
  - uv run python -c "from agents import Agent, Runner, OpenAIChatCompletionsModel; print('agents OK')"
  - uv run python -c "from app.agent.prompts import SYSTEM_PROMPT_TEMPLATE; print('prompts OK')"
  - uv run python -c "from app.agent.runner import run_chat, _build_mcp_server; print('runner OK')"
  - uv run python -c "from app.routes.chat import router; print('chat router OK')"
  - uv run python -c "from app.main import app; routes = [r.path for r in app.routes]; assert '/api/{user_id}/chat' in routes"
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/chatbot/phase3-agent-tasks.md` for Phase 3.2: AI Agent Logic & Stateless Backend Endpoint.

STRICT IMPLEMENTATION RULES:
1. DIRECTORY ISOLATION: All backend code must be placed strictly within `/todo-web-app/backend/`.
2. READ-BEFORE-WRITE: Before generating code, read the Phase 3 Constitution, the MCP Server implementation (`app/mcp/server.py`), and the Phase 3.2 Plan/Spec.
3. TASK MAPPING: Implement tasks T-3.2.1 through T-3.2.8 in sequence. Every file must include a comment at the top referencing the Task ID, e.g., `# [Task]: T-3.2.x`.
4. AI AGENT LOGIC (GROQ):
   - Use the `openai` SDK but configure the client with `base_url="https://api.groq.com/openai/v1"`.
   - Use the `GROQ_API_KEY` from environment variables.
   - Use model `llama-3.3-70b-versatile`.
5. STATELESSNESS & PERSISTENCE:
   - Ensure `app/agent/runner.py` retrieves the last 10 messages from the database before every LLM call.
   - Every user message and assistant response MUST be saved to the `messages` table.
   - Map `user`, `assistant`, and `system` roles correctly between the DB and the AI SDK.
6. TOOL INTEGRATION:
   - The Agent must be strictly instructed via the system prompt to use the MCP tools for any task-related actions.
   - Pass the `user_id` from the authenticated request into the tool execution context.
7. MULTI-LANGUAGE:
   - The system prompt must explicitly allow the AI to detect and respond in Urdu if the user initiates in Urdu.

## Response snapshot

Implemented all T-3.2.0 through T-3.2.8 + T-3.2.10 tasks in sequence:

**SDK Adaptation**: `openai-agents` installed at v0.10.3 (not 0.0.12 as in spec). Key API differences handled:
- `MCPServerFastMCP` does not exist in v0.10.3 — used `MCPServerStdio` with `MCPServerStdioParams` TypedDict directly
- `RunResult.new_messages` does not exist — used `result.new_items` (list of `RunItem` subclasses)
- `ToolCallItem.type == "tool_call_item"` and `ToolCallItem.raw_item.name` for tool name extraction

**Files created/modified**:
- `pyproject.toml`: Added `openai-agents>=0.0.12` (installed v0.10.3) + ran `uv sync`
- `app/db.py`: Added Groq settings fields + `_require_groq_key` validator
- `.env.example`: Added `GROQ_API_KEY` entry
- `app/agent/__init__.py`: Package marker
- `app/agent/prompts.py`: `SYSTEM_PROMPT_TEMPLATE` with Roman Urdu + delete confirmation rules
- `app/agent/runner.py`: Full stateless 7-step cycle — DB helpers + `_build_mcp_server()` + `run_chat()`
- `app/routes/chat.py`: `POST /api/{user_id}/chat` thin adapter
- `app/schemas.py`: `ChatRequest` + `ChatResponse` appended (reused existing imports)
- `app/main.py`: Mounted `chat_router`, bumped version to 3.2.0
- `CLAUDE.md`: Phase 3.2 complete status, Chat API docs, `GROQ_API_KEY` env var doc

All import checks passed. Route `/api/{user_id}/chat` confirmed registered.

## Outcome

- ✅ Impact: Phase 3.2 backend fully implemented — stateless AI chat endpoint live with Groq + MCP tool integration
- 🧪 Tests: Import checks pass; T-3.2.9 end-to-end smoke tests require running server with real GROQ_API_KEY
- 📁 Files: 10 files created/modified, all strictly within `todo-web-app/backend/`
- 🔁 Next prompts: T-3.2.9 smoke tests (requires real GROQ_API_KEY in .env); then Phase 3.3 ChatKit frontend
- 🧠 Reflection: SDK version mismatch (0.0.12 spec vs 0.10.3 installed) required adapting tool call extraction from `new_messages` to `new_items` and using `MCPServerStdio` instead of `MCPServerFastMCP`

## Evaluation notes (flywheel)

- Failure modes observed: `MCPServerFastMCP` missing in v0.10.3; `RunResult.new_messages` attribute absent — both adapted via SDK introspection before writing code
- Graders run and results (PASS/FAIL): Import tests PASS; end-to-end requires live API key
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Test with real GROQ_API_KEY; consider in-process MCP if future SDK adds FastMCP support
