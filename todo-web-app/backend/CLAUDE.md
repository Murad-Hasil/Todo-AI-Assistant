# Backend — Agent Context

**Phase**: 3.2 (AI Agent Logic & Stateless Chat Endpoint) ✅
**Last Updated**: 2026-03-03

## Tech Stack

- Python 3.13
- FastAPI 0.115+
- SQLModel 0.0.21+ (SQLAlchemy + Pydantic)
- psycopg2-binary (sync driver)
- Neon Serverless PostgreSQL
- Alembic (migrations)
- PyJWT 2.8.0+ (Phase 2.2 — HS256 JWT verification)
- mcp[cli]>=1.0.0 (Phase 3.1 — Official MCP SDK + FastMCP)
- openai-agents>=0.0.12 (Phase 3.2 — OpenAI Agents SDK, installed: 0.10.3)
- uv (package manager)

## Directory Layout

```
todo-web-app/backend/
├── app/
│   ├── main.py              # FastAPI app v3.2.0, CORS, router mount
│   ├── db.py                # Engine (NullPool), get_session dep, Settings (+ Groq fields)
│   ├── models.py            # Task, Conversation, Message SQLModel tables
│   ├── schemas.py           # Pydantic schemas (TaskCreate/Update/Read + ChatRequest/Response)
│   ├── auth.py              # JWT verification (Phase 2.2 — real HS256 via PyJWT)
│   ├── agent/               # Phase 3.2 — AI agent package
│   │   ├── __init__.py
│   │   ├── prompts.py       # SYSTEM_PROMPT_TEMPLATE — "Todo Architect" persona
│   │   └── runner.py        # Stateless 7-step run_chat() cycle (Groq + MCP + DB)
│   ├── logic/
│   │   ├── __init__.py
│   │   └── task_ops.py      # Shared CRUD logic (used by routes + MCP tools)
│   ├── routes/
│   │   ├── tasks.py         # Thin HTTP adapters — delegates to logic/task_ops.py
│   │   └── chat.py          # POST /api/{user_id}/chat — JWT-protected chat endpoint
│   └── mcp/
│       ├── __init__.py
│       └── server.py        # FastMCP server — 5 tools: add/list/complete/delete/update
├── migrations/
│   └── versions/
│       ├── 001_create_tasks_table.py
│       └── 002_add_conversations_messages.py
├── tests/
│   ├── contract/
│   └── integration/
├── .env.example
├── pyproject.toml
└── README.md
```

## Key Rules (Constitution v2.1.0)

1. **Every query MUST include `WHERE Task.user_id == user_id`** (Principle V)
2. **REST routes use `Depends(get_session)`** — MCP tools open via `_get_session()` (stateless)
3. **Auth** (`auth.py`) verifies HS256 JWT using `BETTER_AUTH_SECRET`; returns `sub` as `user_id`
4. **NullPool** is mandatory — Neon serverless drops idle connections
5. **No FK constraint** to `users` table — Better Auth owns that DDL
6. **PEP8 + Black** (<=88 chars), type hints on all public functions (Principle VIII)
7. **`BETTER_AUTH_SECRET` and `GROQ_API_KEY` required at startup** — app refuses to start if absent
8. **MCP tools are the ONLY interface** between AI agent and tasks DB (Principle X)
9. **logic/task_ops.py is the shared layer** — routes AND MCP tools call it; no duplication
10. **`run_chat()` is stateless** — no module-level agent state; each call creates a fresh agent

## Running Locally

```bash
cp .env.example .env           # fill in DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY
uv sync
uv run alembic upgrade head    # runs both 001 + 002 migrations
uv run uvicorn app.main:app --reload --port 8000
```

## Chat Endpoint (Phase 3.2)

```
POST /api/{user_id}/chat
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "message": "Add buy groceries to my tasks",
  "conversation_id": null  # optional UUID; omit for new conversation
}

Response:
{
  "conversation_id": "<uuid>",
  "response": "Got it! I've added 'buy groceries' to your tasks.",
  "tool_calls": ["add_task"]
}
```

**Agent runner notes** (`app/agent/runner.py`):
- `run_chat(user_id, message, conversation_id)` — 7-step stateless cycle
- Steps: resolve conv → fetch history → save user msg → build agent → Runner.run() → collect tool names → save assistant reply
- Groq client: `AsyncOpenAI(base_url="https://api.groq.com/openai/v1")`
- MCP integration: `MCPServerStdio` subprocess (cache_tools_list=True)
- Error handling: `openai.APITimeoutError` / `APIConnectionError` → HTTP 503

## MCP Server — Standalone Execution

```bash
# Inspect tools interactively (MCP dev inspector):
uv run mcp dev app/mcp/server.py

# Run as a server process (for agent use in Phase 3.2):
uv run mcp run app/mcp/server.py
```

Expected output from `mcp dev`:
```
Tools registered: add_task, list_tasks, complete_task, delete_task, update_task
```

## Environment Variables

| Variable             | Required | Description                                            |
|----------------------|----------|--------------------------------------------------------|
| `DATABASE_URL`       | YES      | Neon PostgreSQL connection string (psycopg2 format)    |
| `BETTER_AUTH_SECRET` | YES      | Shared HS256 secret (same value in frontend)           |
| `GROQ_API_KEY`       | YES      | Groq API key — get from console.groq.com               |
| `CORS_ORIGINS`       | NO       | Comma-separated allowed origins (default: localhost:3000) |
| `ENVIRONMENT`        | NO       | Set to `production` for production deployment          |

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 2.1 — CRUD API | ✅ Complete | All 6 endpoints, user-scoped queries |
| 2.2 — JWT Auth | ✅ Complete | HS256 via PyJWT, startup validation |
| 2.3 — Frontend | ✅ Complete | Next.js + Better Auth integrated |
| 3.1 — DB + MCP | ✅ Complete | conversations/messages tables + 5 MCP tools |
| 3.2 — AI Agent | ✅ Complete (2026-03-03) | `/api/{user_id}/chat` + Groq + stateless runner |
| 3.3 — ChatKit UI | 🔜 Next | Frontend chat component (Next.js + ChatKit) |
