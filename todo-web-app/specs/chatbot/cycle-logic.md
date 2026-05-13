# Stateless Request Cycle: Phase 3.2 AI Chat

**Feature**: Phase 3.2 — AI Agent Logic & Stateless Chat Endpoint
**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-03
**Constitution**: Principle IX (Stateless AI Request Cycle), Principle X (MCP Tool Enforcement)

---

## Overview

Every call to `POST /api/{user_id}/chat` executes a 7-step stateless cycle.
No conversational state survives in memory between HTTP requests.
All state lives in the `conversations` and `messages` tables (Phase 3.1).

---

## Request Cycle — Step by Step

### Step 1 — Authenticate & Validate Input

```
Route handler: app/routes/chat.py
```

- Extract and verify JWT from `Authorization: Bearer <token>` via `get_current_user_id()`.
- Assert `path_user_id == jwt_user_id` (constitution Principle VI + V).
- Validate request body via `ChatRequest` Pydantic model.
- If `conversation_id` provided: query DB to confirm it exists AND belongs to `user_id` → 404 if not found.
- If `conversation_id` absent: create a new `Conversation` record for `user_id` → use its UUID.

---

### Step 2 — Fetch Conversation History

```
Location: app/agent/runner.py → fetch_history()
```

- Query `messages` table: `WHERE conversation_id = :cid ORDER BY created_at ASC LIMIT :max_history`.
- `max_history` default: 20 messages (configurable via `MAX_HISTORY_MESSAGES` env var).
- Result: ordered list of `{"role": "user"|"assistant", "content": "..."}` dicts.
- This list becomes the `input` to the OpenAI Agents SDK (alongside the current user message).

```python
# Fetch pattern (app/agent/runner.py)
history = session.exec(
    select(Message)
    .where(Message.conversation_id == conversation_id)
    .order_by(Message.created_at.asc())
    .limit(settings.max_history_messages)
).all()
```

---

### Step 3 — Persist the User Message

```
Location: app/agent/runner.py → save_message()
```

- Before invoking the AI agent, save the user's message to the `messages` table.
- `role = MessageRole.USER`, `content = request.message`, `user_id = user_id`.
- This ensures the message is persisted even if the agent call subsequently fails.

```python
user_msg = Message(
    conversation_id=conversation_id,
    user_id=user_id,
    role=MessageRole.USER.value,
    content=request.message,
)
session.add(user_msg)
session.commit()
```

---

### Step 4 — Configure Groq Client & OpenAI Agents SDK

```
Location: app/agent/runner.py → build_agent()
```

Build the agent client using Groq's OpenAI-compatible endpoint:

```python
from openai import AsyncOpenAI
from agents import Agent, OpenAIChatCompletionsModel

groq_client = AsyncOpenAI(
    base_url=settings.openai_base_url,  # https://api.groq.com/openai/v1
    api_key=settings.groq_api_key,
)

model = OpenAIChatCompletionsModel(
    model=settings.groq_model,          # llama-3.3-70b-versatile
    openai_client=groq_client,
)
```

Configure the MCP server connection so the agent can call the 5 tools:

```python
from agents.mcp import MCPServerStdio

mcp_server = MCPServerStdio(
    params={
        "command": "uv",
        "args": ["run", "mcp", "run", "app/mcp/server.py"],
        "cwd": str(Path(__file__).parent.parent.parent),  # backend root
    }
)
```

Build the agent with the system prompt (see Agent System Prompt section below):

```python
agent = Agent(
    name="TodoArchitect",
    model=model,
    instructions=SYSTEM_PROMPT,
    mcp_servers=[mcp_server],
)
```

---

### Step 5 — Run Agent (Tool Calls Handled Automatically)

```
Location: app/agent/runner.py → run_agent()
```

Pass the full conversation history plus the current user message to the agent:

```python
from agents import Runner

# Build input: history messages + current user message
input_messages = [
    {"role": msg.role, "content": msg.content}
    for msg in history
]
input_messages.append({"role": "user", "content": request.message})

result = await Runner.run(
    agent,
    input=input_messages,
)
```

- The agent autonomously calls MCP tools as needed (0 to N tool calls per request).
- Each tool call is intercepted and logged at INFO level (see Logging section).
- `result.final_output` contains the agent's final natural-language reply.
- `tool_calls` is collected from `result.new_messages` (messages with `role="tool"`).

---

### Step 6 — Persist Assistant Response

```
Location: app/agent/runner.py → save_message()
```

- ONLY persist if `result.final_output` is non-empty and no exception occurred.
- `role = MessageRole.ASSISTANT`, `content = result.final_output`, `user_id = user_id`.

```python
assistant_msg = Message(
    conversation_id=conversation_id,
    user_id=user_id,
    role=MessageRole.ASSISTANT.value,
    content=result.final_output,
)
session.add(assistant_msg)
session.commit()
```

**Failure handling**: If Step 5 raises an exception (Groq timeout, etc.), Step 6 is
skipped entirely. The user's message persisted in Step 3 remains in the DB — the
next request will include it in history, giving the AI context that the previous
response failed.

---

### Step 7 — Return Response

```
Location: app/routes/chat.py
```

```python
return ChatResponse(
    conversation_id=conversation_id,
    response=result.final_output,
    tool_calls=collected_tool_names,  # list of tool name strings
)
```

---

## Agent System Prompt

```python
SYSTEM_PROMPT = """
You are a Helpful Todo Architect — a friendly, efficient assistant that helps
users manage their task list through natural conversation.

RULES:
1. ALWAYS use the available tools to verify the current state of tasks before
   answering questions about them. Never make up task titles, IDs, or statuses.

2. CONFIRM before destructive actions: Before calling delete_task, you MUST
   ask the user to confirm. Example: "Are you sure you want to delete
   'buy milk'? This cannot be undone."

3. CONFIRM before updates: For update_task, confirm the new values with the
   user if there is any ambiguity about which task or what changes are intended.

4. LANGUAGE ADAPTATION: Detect the language of the user's message and respond
   in the same language. If the user writes in Roman Urdu, respond entirely in
   Roman Urdu. Do not mix languages unless the user does.

5. FRIENDLY CONFIRMATIONS: After every successful tool call, give a warm,
   concise confirmation. Examples:
   - After add_task: "Got it! I've added 'buy milk' to your tasks."
   - After complete_task: "Nice work! I've marked 'buy milk' as done."
   - After list_tasks: Present the list in a readable format.

6. GRACEFUL ERRORS: If a tool returns an error, translate it into a helpful
   plain-language message. Never expose raw JSON, tool call details, or stack
   traces to the user.

7. EMPTY LIST: If list_tasks returns zero tasks, respond:
   "You have no tasks yet. Want me to add one?"

8. SCOPE: You only manage tasks. If the user asks about something unrelated
   to their task list, politely redirect: "I'm here to help with your tasks!"
"""
```

---

## Logging Contract (FR-008)

Every MCP tool call MUST be logged at `INFO` level:

```python
import logging

logger = logging.getLogger("agent.tools")

# Before each tool call (hook into OpenAI Agents SDK lifecycle):
logger.info(
    "MCP tool called: tool=%s inputs=%s",
    tool_name,
    json.dumps(tool_inputs, default=str),
)

# After each tool call:
logger.info(
    "MCP tool result: tool=%s success=%s",
    tool_name,
    result.get("success"),
)
```

---

## New Source Files for Phase 3.2

```text
todo-web-app/backend/
├── app/
│   ├── agent/
│   │   ├── __init__.py          # NEW (empty)
│   │   └── runner.py            # NEW — stateless agent runner (Steps 2–6)
│   ├── routes/
│   │   ├── tasks.py             # UNCHANGED (Phase 2)
│   │   └── chat.py              # NEW — POST /api/{user_id}/chat route handler
│   ├── schemas.py               # UPDATE — add ChatRequest, ChatResponse
│   └── main.py                  # UPDATE — mount chat_router
└── pyproject.toml               # UPDATE — add openai-agents SDK dependency
```

---

## Settings Additions (app/db.py)

```python
class Settings(BaseSettings):
    # ... existing Phase 2 settings ...
    groq_api_key: str = ""
    openai_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"
    max_history_messages: int = 20
```

---

## Constitution Compliance Checklist

| Principle | Requirement | Satisfied By |
|-----------|-------------|--------------|
| IX — Stateless AI Cycle | No in-memory conversation state | History fetched from DB on every request (Step 2) |
| X — MCP Tool Enforcement | Agent ONLY uses MCP tools | `MCPServerStdio` connection; no direct DB access in `runner.py` |
| V — Multi-User Isolation | No cross-user data | `conversation_id` ownership check in Step 1 |
| VI — JWT Security | Chat endpoint requires valid JWT | `get_current_user_id()` dependency on route |
| XI — Agent Behavior | Friendly confirmations + error handling | System prompt rules 5 + 6 |
| III — Non-Destructive | Phase 2 routes untouched | New `app/routes/chat.py`; `routes/tasks.py` unchanged |
