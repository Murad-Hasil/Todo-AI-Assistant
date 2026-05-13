---
id: "0006"
title: "Phase 3.2 AI Agent Implementation Plan"
stage: plan
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.plan
labels: ["plan","ai-agent","openai-agents-sdk","groq","mcp","fastapi","phase3.2"]
links:
  spec: todo-web-app/specs/chatbot/phase3.2-spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3-agent-plan.md
tests:
  - none (plan stage)
---

## Prompt

Generate the technical plan for Phase 3.2: AI Agent Logic & Stateless Backend Endpoint in `/todo-web-app/specs/chatbot/phase3-agent-plan.md`. The plan must include AI agent configuration (OpenAI Agents SDK + Groq), stateless conversation logic (history fetch, message formatting, user_id injection), FastAPI route implementation (chat.py), system prompt design (prompts.py), and error handling (Groq timeouts, MCP tool errors).

## Response snapshot

Created `todo-web-app/specs/chatbot/phase3-agent-plan.md` with:
- 6 Research findings (Groq integration, MCPServerFastMCP vs Stdio, user_id injection, tool call collection, error handling, AgentContext dataclass)
- 8 implementation steps with complete code blocks: pyproject.toml, db.py settings, schemas.py, agent/__init__.py, agent/prompts.py, agent/runner.py, routes/chat.py, main.py mount
- Full MCPServerFastMCP (in-process) + MCPServerStdio (subprocess fallback) pattern
- SYSTEM_PROMPT_TEMPLATE with runtime {user_id} injection
- AgentContext dataclass for type-safe user_id threading
- Groq exception handling (APITimeoutError, APIConnectionError) → HTTP 503
- All 11 Constitution principles satisfied

## Outcome

- ✅ Impact: Phase 3.2 fully planned — ready for /sp.tasks then /sp.implement
- 🧪 Tests: None at plan stage
- 📁 Files: 1 file created (phase3-agent-plan.md)
- 🔁 Next prompts: /sp.tasks to generate Phase 3.2 task list, then /sp.implement
- 🧠 Reflection: MCPServerFastMCP in-process approach avoids subprocess overhead per request; SDK instability at 0.0.x is the primary risk — fallback to MCPServerStdio documented

## Evaluation notes (flywheel)

- Failure modes observed: openai-agents SDK at 0.0.x is pre-stable; MCPServerFastMCP may not exist in all versions — fallback documented
- Graders run and results (PASS/FAIL): Constitution check 11/11 PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add a quickstart.md for Phase 3.2 with end-to-end curl test sequence
