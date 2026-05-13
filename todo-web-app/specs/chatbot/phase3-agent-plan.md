# Implementation Plan: Phase 3.2 — AI Agent Logic & Stateless Backend Endpoint

**Branch**: `005-chatbot-db-mcp` | **Date**: 2026-03-03
**Spec**: `todo-web-app/specs/chatbot/phase3.2-spec.md`
**API Contract**: `todo-web-app/specs/chatbot/api-endpoint.md`
**Cycle Logic**: `todo-web-app/specs/chatbot/cycle-logic.md`
**Depends On**: Phase 3.1 ✅ (conversations/messages tables + 5 MCP tools live)

---

## Summary

Phase 3.2 wires the AI brain into the backend. Three tightly-scoped deliverables:

1. **`app/agent/`** — stateless agent runner: fetches history, builds agent with Groq
   via OpenAI Agents SDK, connects MCP tools in-process, collects tool call names,
   persists both messages.
2. **`app/routes/chat.py`** — single JWT-protected route: `POST /api/{user_id}/chat`.
   Thin adapter that delegates to the runner and returns `ChatResponse`.
3. **`app/agent/prompts.py`** — static system prompt with `{user_id}` placeholder
   injected at runtime.

Phase 3.3 (ChatKit frontend UI) depends on this plan and is out of scope.

---

## Technical Context

| Attribute           | Value                                                            |
|---------------------|------------------------------------------------------------------|
| Language/Version    | Python 3.13                                                      |
| AI SDK              | `openai-agents>=0.0.12` (OpenAI Agents SDK)                     |
| Provider            | Groq — OpenAI-compatible endpoint                               |
| Model               | `llama-3.3-70b-versatile`                                       |
| Groq Base URL       | `https://api.groq.com/openai/v1`                                |
| MCP Integration     | `MCPServerFastMCP` (in-process) — wraps Phase 3.1 FastMCP instance |
| New Dependencies    | `openai-agents>=0.0.12`, `httpx>=0.27.0`                       |
| Existing Deps Used  | `fastapi`, `sqlmodel`, `PyJWT`, `mcp[cli]` (Phase 3.1)         |
| Target Files        | 6 files changed/created (see Project Structure below)            |
| Constraint          | Phase 2 routes untouched; no in-memory agent state              |
| History Window      | Last 10 messages per conversation (spec FR-003, plan default)   |

---

## Constitution Check

*GATE: Must pass before implementation begins.*

- [x] **I. Strict Spec-Driven** — Spec, API contract, and cycle logic all approved. All code refs this plan.
- [x] **II. Read-Before-Write** — Phase 3.1 code (models, MCP server, routes) fully audited.
- [x] **III. Non-Destructive** — Phase 2 routes unchanged. New code exclusively in `app/agent/` and `app/routes/chat.py`.
- [x] **IV. API-First** — `POST /api/{user_id}/chat` is the formal contract; all I/O via Pydantic schemas.
- [x] **V. Multi-User Isolation** — `user_id` ownership check for `conversation_id`; injected into system prompt so agent always passes correct `user_id` to tools.
- [x] **VI. JWT Security** — `get_current_user_id()` dependency reused on chat route; no new auth logic.
- [x] **VII. Monorepo Pattern** — New dirs only in `backend/app/agent/`; no top-level dirs.
- [x] **VIII. Code Quality** — PEP8, Black 88, async/await throughout, type hints on all functions.
- [x] **IX. Stateless AI Cycle** — History fetched from DB per request; `runner.py` holds zero module-level state.
- [x] **X. MCP Tool Enforcement** — Agent connects to `app/mcp/server.py` via `MCPServerFastMCP`; no direct DB calls from `runner.py`.
- [x] **XI. Agent Behavior Contract** — System prompt enforces friendly confirmations, delete confirmation, Roman Urdu, error translation.

---

## Project Structure Changes

```text
todo-web-app/backend/
├── pyproject.toml                        # UPDATE: add openai-agents>=0.0.12
├── app/
│   ├── db.py                             # UPDATE: add Groq/agent settings fields
│   ├── schemas.py                        # UPDATE: add ChatRequest, ChatResponse
│   ├── main.py                           # UPDATE: mount chat_router
│   ├── agent/                            # NEW directory
│   │   ├── __init__.py                   # NEW (empty)
│   │   ├── prompts.py                    # NEW: SYSTEM_PROMPT with {user_id} placeholder
│   │   └── runner.py                     # NEW: stateless 7-step agent runner
│   └── routes/
│       ├── tasks.py                      # UNCHANGED (Phase 2)
│       └── chat.py                       # NEW: POST /api/{user_id}/chat route handler
```

---

## Phase 0: Research Findings

### R-1: OpenAI Agents SDK + Groq Integration Pattern

**Decision**: Use `openai-agents` package with `OpenAIChatCompletionsModel` pointed at
Groq's OpenAI-compatible endpoint. Groq's API returns standard OpenAI tool-call
structures, which the SDK handles transparently.

```python
from openai import AsyncOpenAI
from agents import Agent, OpenAIChatCompletionsModel, Runner

groq_client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.groq_api_key,
)
model = OpenAIChatCompletionsModel(
    model="llama-3.3-70b-versatile",
    openai_client=groq_client,
)
```

**Rationale**: Groq is 100% OpenAI API-compatible for chat completions and tool calls.
The `openai-agents` SDK only needs the `base_url` override — no other changes.

**Alternatives considered**:
- Direct `httpx` + tool-calling loop — rejected (manual loop is error-prone; SDK handles retries, streaming, tool dispatch).
- LangChain — rejected (heavy dependency, violates constitution Principle III non-destructive).

---

### R-2: MCP Integration — In-Process via `MCPServerFastMCP`

**Decision**: Connect the Phase 3.1 FastMCP instance directly using `MCPServerFastMCP`
(available in `agents.mcp`). This avoids spawning a subprocess per request.

```python
from agents.mcp import MCPServerFastMCP
from app.mcp.server import mcp as fastmcp_instance

mcp_server = MCPServerFastMCP(fastmcp_instance)
```

**Rationale**: `MCPServerStdio` spawns `uv run mcp run app/mcp/server.py` as a child
process on every agent run. In a FastAPI server handling concurrent requests, this
creates unnecessary process overhead and startup latency (~200–500ms per request).
`MCPServerFastMCP` wraps the already-loaded `FastMCP` instance in-process — zero
subprocess cost.

**Fallback if `MCPServerFastMCP` is unavailable in installed SDK version**:

```python
from pathlib import Path
from agents.mcp import MCPServerStdio

BACKEND_ROOT = Path(__file__).parent.parent.parent  # todo-web-app/backend/
mcp_server = MCPServerStdio(
    params={
        "command": "uv",
        "args": ["run", "mcp", "run", "app/mcp/server.py"],
        "cwd": str(BACKEND_ROOT),
    }
)
```

> **Implementation note**: Check at `uv add openai-agents` time whether
> `MCPServerFastMCP` is exported. If not, use the `MCPServerStdio` fallback.
> Both approaches produce identical tool-call behaviour.

---

### R-3: `user_id` Injection into Agent Context

**Decision**: Inject `user_id` into the system prompt at runtime (not a static global).
The agent is instructed to always pass this exact value to all tool calls.

```python
# In runner.py
from app.agent.prompts import SYSTEM_PROMPT_TEMPLATE

system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_id=user_id)
agent = Agent(name="TodoArchitect", model=model, instructions=system_prompt, ...)
```

**Rationale**: MCP tools require `user_id` as an explicit parameter (constitution
Principle V). Injecting it into the prompt ensures the model passes the correct value
without any trust boundary — the route layer also validates conversation ownership
independently (defence in depth).

**Alternatives considered**:
- Global `contextvars.ContextVar` — rejected (threading/async unsafe across concurrent requests).
- Custom tool wrapper that auto-injects `user_id` — rejected (over-engineering; the prompt approach is simpler and already supported by the SDK).

---

### R-4: Tool Call Collection

**Decision**: Extract tool call names from `result.new_messages` after `Runner.run()`.

```python
tool_calls = [
    msg.content[0].name  # ToolCallOutputItem has .name
    for msg in result.new_messages
    if hasattr(msg, "type") and msg.type == "tool_call"
]
```

Exact attribute names depend on the SDK version. The simplest reliable approach:
iterate `result.new_messages` and check for messages whose role/type indicates a
tool call, extracting the tool name. Log each at INFO level (FR-008).

---

### R-5: Groq Timeout & Error Handling

**Decision**: Wrap `Runner.run()` in a `try/except` catching
`openai.APITimeoutError`, `openai.APIConnectionError`, and generic `Exception`.
On failure: return HTTP 503. Do NOT persist a failed assistant message (FR-006).

```python
try:
    result = await Runner.run(agent, input=messages, context=ctx)
except (openai.APITimeoutError, openai.APIConnectionError) as exc:
    logger.error("Groq API error: %s", exc)
    raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")
except Exception as exc:
    logger.error("Agent runner error: %s", exc)
    raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")
```

---

### R-6: Runner Context Object for user_id

**Decision**: Use the OpenAI Agents SDK `RunContext` / `context` parameter to pass
`user_id` as structured data alongside the system prompt. This provides type-safe
access in hooks without parsing the prompt string.

```python
from dataclasses import dataclass

@dataclass
class AgentContext:
    user_id: str
    conversation_id: uuid.UUID

ctx = AgentContext(user_id=user_id, conversation_id=conversation_id)
result = await Runner.run(agent, input=messages, context=ctx)
```

---

## Phase 1: Detailed Implementation Design

### Step 1 — `pyproject.toml`: Add `openai-agents`

```toml
dependencies = [
    # ... existing deps ...
    "openai-agents>=0.0.12",    # OpenAI Agents SDK — Groq + MCP integration
]
```

Run `uv sync` after adding. Verify import: `python -c "from agents import Agent; print('OK')"`.

---

### Step 2 — `app/db.py`: Add Agent Settings

Append to the `Settings` class (do NOT alter existing fields):

```python
# [Phase 3.2] AI Agent settings
groq_api_key: str = ""
openai_base_url: str = "https://api.groq.com/openai/v1"
groq_model: str = "llama-3.3-70b-versatile"
max_history_messages: int = 10
```

Add a startup validator for `GROQ_API_KEY` (mirroring `_require_auth_secret`):

```python
@model_validator(mode="after")
def _require_groq_key(self) -> "Settings":
    if not self.groq_api_key:
        raise ValueError(
            "GROQ_API_KEY must be set. Add it to your .env file."
        )
    return self
```

> **Note**: This validator will break local startup if `GROQ_API_KEY` is absent.
> Add it to `.env.example` and document in README.

---

### Step 3 — `app/schemas.py`: Add Chat Schemas

Append to the existing schemas file (do NOT alter existing schemas):

```python
# [Phase 3.2] Chat endpoint schemas

class ChatRequest(BaseModel):
    """Input schema for POST /api/{user_id}/chat."""
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[uuid.UUID] = Field(default=None)


class ChatResponse(BaseModel):
    """Response schema for POST /api/{user_id}/chat."""
    conversation_id: uuid.UUID
    response: str
    tool_calls: list[str] = Field(default_factory=list)
```

---

### Step 4 — `app/agent/__init__.py`: Package Marker

Empty file. Marks `app/agent/` as a Python package.

---

### Step 5 — `app/agent/prompts.py`: System Prompt

```python
"""
Agent system prompt — "Todo Architect" persona.

Contains a single template string with {user_id} placeholder injected at runtime.
NEVER commit actual user IDs here — the placeholder is filled per request in runner.py.
"""

SYSTEM_PROMPT_TEMPLATE = """
You are a Helpful Todo Architect — a friendly, efficient assistant that helps
users manage their task list through natural conversation.

You are operating on behalf of user ID: {user_id}
ALWAYS pass this exact user_id value to every tool call you make.

RULES:
1. VERIFY BEFORE ANSWERING: Always call list_tasks to check the current state
   before answering questions about tasks. Never make up task titles, IDs, or statuses.

2. CONFIRM DELETIONS: Before calling delete_task, ask the user for explicit
   confirmation. Example: "Are you sure you want to delete 'buy milk'? This cannot
   be undone." Only proceed after the user confirms.

3. CONFIRM AMBIGUOUS UPDATES: If it's unclear which task the user wants to update
   or what the new value should be, ask for clarification before calling update_task.

4. LANGUAGE ADAPTATION: Detect the language of the user's message and respond in
   the same language. If the user writes in Roman Urdu, respond entirely in Roman
   Urdu. Do not mix languages unless the user does so first.
   Examples of Roman Urdu triggers: "add karo", "dekho", "delete karo", "mera kaam".

5. FRIENDLY CONFIRMATIONS: After every successful tool call, give a warm, concise
   natural-language confirmation:
   - After add_task: "Got it! I've added '[title]' to your tasks."
   - After complete_task: "Nice work! I've marked '[title]' as done."
   - After delete_task: "Done. '[title]' has been deleted."
   - After update_task: "Updated! '[title]' has been changed."
   - After list_tasks: Present the tasks in a clean, readable list.

6. GRACEFUL ERRORS: If a tool returns {{"success": false, "error": "..."}}, convert
   the error into a helpful plain-language message. Never expose raw JSON, internal
   tool names, or stack traces to the user.

7. EMPTY LIST RESPONSE: If list_tasks returns zero tasks, respond:
   "You have no tasks yet. Want me to add one?"

8. SCOPE: You only help with task management. If the user asks about something
   unrelated to their task list, politely redirect:
   "I'm here to help with your tasks! Want to add, view, or manage them?"
"""
```

---

### Step 6 — `app/agent/runner.py`: Stateless Agent Runner

Full implementation of the 7-step cycle:

```python
"""
Stateless AI agent runner for Phase 3.2.

Implements the 7-step request cycle defined in cycle-logic.md.
Each call creates a fresh agent instance — no module-level state.

Constitution compliance:
  - Principle IX: no in-memory conversation state between calls
  - Principle X: agent uses ONLY MCP tools from app/mcp/server.py
  - Principle V: user_id injected into system prompt + context; all tools user-scoped
"""
import json
import logging
import uuid
from dataclasses import dataclass
from typing import Optional

import openai
from agents import Agent, OpenAIChatCompletionsModel, Runner
from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlmodel import Session, select

from app.agent.prompts import SYSTEM_PROMPT_TEMPLATE
from app.db import engine, settings
from app.models import Conversation, Message, MessageRole

logger = logging.getLogger("agent.runner")
tool_logger = logging.getLogger("agent.tools")


# ---------------------------------------------------------------------------
# Context dataclass — passed to Runner for type-safe access in hooks
# ---------------------------------------------------------------------------


@dataclass
class AgentContext:
    user_id: str
    conversation_id: uuid.UUID


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


def _get_or_create_conversation(
    session: Session,
    user_id: str,
    conversation_id: Optional[uuid.UUID],
) -> uuid.UUID:
    """Return existing conversation UUID or create a new one."""
    if conversation_id is not None:
        conv = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        ).first()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )
        return conv.id

    new_conv = Conversation(user_id=user_id)
    session.add(new_conv)
    session.commit()
    session.refresh(new_conv)
    return new_conv.id


def _fetch_history(session: Session, conversation_id: uuid.UUID) -> list[Message]:
    """Return last N messages ordered chronologically (constitution Principle IX)."""
    return list(
        session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(settings.max_history_messages)
        ).all()
    )


def _save_message(
    session: Session,
    conversation_id: uuid.UUID,
    user_id: str,
    role: MessageRole,
    content: str,
) -> None:
    """Persist a single message to the messages table."""
    msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role.value,
        content=content,
    )
    session.add(msg)
    session.commit()


# ---------------------------------------------------------------------------
# MCP server builder
# ---------------------------------------------------------------------------


def _build_mcp_server():
    """Return an MCP server instance connected to Phase 3.1 FastMCP tools."""
    try:
        # Preferred: in-process (zero subprocess overhead)
        from agents.mcp import MCPServerFastMCP
        from app.mcp.server import mcp as fastmcp_instance
        return MCPServerFastMCP(fastmcp_instance)
    except (ImportError, AttributeError):
        # Fallback: subprocess (works with all SDK versions)
        from pathlib import Path
        from agents.mcp import MCPServerStdio
        backend_root = Path(__file__).parent.parent.parent
        logger.warning(
            "MCPServerFastMCP unavailable — falling back to MCPServerStdio subprocess"
        )
        return MCPServerStdio(
            params={
                "command": "uv",
                "args": ["run", "mcp", "run", "app/mcp/server.py"],
                "cwd": str(backend_root),
            }
        )


# ---------------------------------------------------------------------------
# Main runner — called by routes/chat.py
# ---------------------------------------------------------------------------


async def run_chat(
    user_id: str,
    message: str,
    conversation_id: Optional[uuid.UUID],
) -> tuple[uuid.UUID, str, list[str]]:
    """
    Execute the 7-step stateless chat cycle.

    Returns:
        (conversation_id, assistant_reply, tool_call_names)
    """
    with Session(engine) as session:
        # Step 1 — resolve/create conversation
        conv_id = _get_or_create_conversation(session, user_id, conversation_id)

        # Step 2 — fetch history
        history = _fetch_history(session, conv_id)

        # Step 3 — persist user message BEFORE running agent
        _save_message(session, conv_id, user_id, MessageRole.USER, message)

    # Steps 4–5: build agent and run (outside DB session — agent is async)
    groq_client = AsyncOpenAI(
        base_url=settings.openai_base_url,
        api_key=settings.groq_api_key,
    )
    model = OpenAIChatCompletionsModel(
        model=settings.groq_model,
        openai_client=groq_client,
    )
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_id=user_id)
    mcp_server = _build_mcp_server()

    agent = Agent(
        name="TodoArchitect",
        model=model,
        instructions=system_prompt,
        mcp_servers=[mcp_server],
    )

    # Build messages list: history + current user message
    input_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]
    input_messages.append({"role": "user", "content": message})

    ctx = AgentContext(user_id=user_id, conversation_id=conv_id)

    try:
        result = await Runner.run(agent, input=input_messages, context=ctx)
    except (openai.APITimeoutError, openai.APIConnectionError) as exc:
        logger.error("Groq API connection error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again.",
        )
    except Exception as exc:
        logger.error("Agent runner unexpected error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again.",
        )

    # Collect tool call names for response + logging (FR-008)
    tool_call_names: list[str] = []
    for new_msg in result.new_messages:
        # SDK message types vary by version — check for tool-related content
        if hasattr(new_msg, "type") and new_msg.type == "tool_call":
            tool_name = getattr(new_msg, "name", None) or "unknown"
            tool_call_names.append(tool_name)
            tool_logger.info(
                "MCP tool called: tool=%s user_id=%s",
                tool_name,
                user_id,
            )
        elif hasattr(new_msg, "role") and new_msg.role == "tool":
            # Alternative SDK shape
            tool_call_names.append("tool")

    assistant_reply = result.final_output or ""

    # Step 6 — persist assistant reply (ONLY if non-empty and no exception)
    if assistant_reply:
        with Session(engine) as session:
            _save_message(
                session, conv_id, user_id, MessageRole.ASSISTANT, assistant_reply
            )

    # Step 7 — return to route handler
    return conv_id, assistant_reply, tool_call_names
```

---

### Step 7 — `app/routes/chat.py`: FastAPI Route Handler

```python
"""
Chat route — POST /api/{user_id}/chat.

Thin HTTP adapter: validates JWT, delegates to runner.run_chat(),
returns ChatResponse. Stateless by design (constitution Principle IX).
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.agent.runner import run_chat
from app.auth import get_current_user_id
from app.db import get_session
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(tags=["chat"])


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    body: ChatRequest,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ChatResponse:
    """
    Stateless AI chat endpoint.

    Authenticates user, delegates to the agent runner, and returns the
    assistant's reply with conversation context.
    """
    # Re-use the same ownership guard as Phase 2 routes (constitution Principle V)
    if user_id != current_user_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )

    conv_id, response, tool_calls = await run_chat(
        user_id=user_id,
        message=body.message,
        conversation_id=body.conversation_id,
    )

    return ChatResponse(
        conversation_id=conv_id,
        response=response,
        tool_calls=tool_calls,
    )
```

---

### Step 8 — `app/main.py`: Mount Chat Router

Add the chat router alongside the tasks router (minimal change):

```python
# Add at top of file:
from app.routes.chat import router as chat_router

# Add after the existing tasks router line:
app.include_router(chat_router, prefix="/api")

# Update version string:
app = FastAPI(title="Todo API", version="3.2.0", ...)
```

---

## Complexity Tracking

> **No constitution violations.** All gates pass cleanly.

| Decision | Complexity | Notes |
|----------|-----------|-------|
| `MCPServerFastMCP` vs `MCPServerStdio` | Medium | In-process preferred; subprocess fallback provided |
| `user_id` via system prompt | Low | Runtime format() injection; simple and reliable |
| Tool call collection | Low | Iterate `result.new_messages`; SDK shape may vary |
| Groq timeout | Low | Standard `openai` exception hierarchy |

---

## Risks and Follow-ups

1. **`openai-agents` SDK API surface instability** — The SDK is at `0.0.x` (pre-stable).
   `MCPServerFastMCP` may not exist in all patch versions, and `result.new_messages`
   structure may change. The fallback to `MCPServerStdio` is documented in Step 6,
   and tool-call collection uses `hasattr` guards to survive shape changes.

2. **Groq `llama-3.3-70b-versatile` tool-call reliability** — Open-source models
   occasionally hallucinate tool parameters or skip required args. If `user_id` is
   omitted from a tool call, the MCP tool returns `{"success": false, "error": "Task
   not found."}` — the agent should recover gracefully via system prompt rule 6.
   Monitor logs (FR-008) after first deploy.

3. **`_require_groq_key` validator on startup** — Adding a required `GROQ_API_KEY`
   validator to `Settings` will break CI/CD pipelines that don't have the key.
   Ensure `.env.example` and deployment docs are updated before merging to main.
