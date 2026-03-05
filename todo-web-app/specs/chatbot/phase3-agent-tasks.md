# Tasks: Phase 3.2 — AI Agent Logic & Stateless Backend Endpoint

**Feature**: `005-chatbot-db-mcp` | **Branch**: `005-chatbot-db-mcp`
**Plan**: `todo-web-app/specs/chatbot/phase3-agent-plan.md`
**Spec**: `todo-web-app/specs/chatbot/phase3.2-spec.md`
**API Contract**: `todo-web-app/specs/chatbot/api-endpoint.md`
**Cycle Logic**: `todo-web-app/specs/chatbot/cycle-logic.md`
**Date**: 2026-03-03
**Depends On**: Phase 3.1 ✅ — conversations/messages tables + 5 MCP tools live

**Format**: `[TaskID] [P?] [Story?] Description — file path`
- **[P]**: Parallelizable (different files, no blocking dependencies)
- **[US1]**: User Story 1 — Conversational Task Management via Chat
- **[US2]**: User Story 2 — Persistent Conversation Context
- **[US3]**: User Story 3 — Roman Urdu Support

---

## Phase 1: Setup (Prerequisites)

**Purpose**: Add AI SDK dependency and Groq configuration before any agent code
is written. All Phase 2–4 tasks depend on this phase.

**⚠️ CRITICAL**: Complete before writing any code in `app/agent/`.

- [X] T-3.2.1 Add `openai-agents>=0.0.12` to `[project.dependencies]` in `todo-web-app/backend/pyproject.toml`; run `uv sync` to install and verify with `python -c "from agents import Agent; print('OK')"`

  **Exact diff** (append after `"mcp[cli]>=1.0.0"` line):
  ```toml
  # [Task]: T-3.2.1
  "openai-agents>=0.0.12",    # OpenAI Agents SDK — Groq + MCP tool orchestration
  ```

  **Verification**: `uv run python -c "from agents import Agent, Runner, OpenAIChatCompletionsModel; print('agents OK')"` exits with code 0.

- [X] T-3.2.2 Add Groq/agent settings to the `Settings` class in `todo-web-app/backend/app/db.py`; add `GROQ_API_KEY` to `.env.example`

  **Exact additions** (append to `Settings` class body, after existing fields — do NOT alter existing fields):
  ```python
  # [Task]: T-3.2.2 — Phase 3.2 AI Agent settings
  groq_api_key: str = ""
  openai_base_url: str = "https://api.groq.com/openai/v1"
  groq_model: str = "llama-3.3-70b-versatile"
  max_history_messages: int = 10
  ```

  Add a startup validator (after the existing `_require_auth_secret` validator):
  ```python
  @model_validator(mode="after")
  def _require_groq_key(self) -> "Settings":
      if not self.groq_api_key:
          raise ValueError(
              "GROQ_API_KEY must be set. Add it to your .env file."
          )
      return self
  ```

  Add to `todo-web-app/backend/.env.example`:
  ```dotenv
  # [Task]: T-3.2.2 — Groq AI provider
  GROQ_API_KEY=your-groq-api-key-here
  ```

  **Verification**: `uv run python -c "from app.db import settings; print(settings.openai_base_url)"` prints `https://api.groq.com/openai/v1` (requires `GROQ_API_KEY` in `.env`).

**Checkpoint**: `openai-agents` installed; `settings.groq_api_key`, `settings.groq_model`, `settings.max_history_messages` accessible.

---

## Phase 2: Foundational — Package Scaffolding

**Purpose**: Create the `app/agent/` package before any module-level imports
can resolve. Single blocking prerequisite for all Phase 3–4 tasks.

- [X] T-3.2.0 [P] Create `todo-web-app/backend/app/agent/__init__.py` (empty file; marks `app/agent/` as a Python package)

  ```python
  # [Task]: T-3.2.0
  ```

  **Verification**: `python -c "import app.agent; print('package OK')"` exits 0.

**Checkpoint**: `app/agent/` is an importable Python package.

---

## Phase 3: US2 — Persistent Conversation Context (Priority: P1)

**Goal**: Implement stateless DB helpers so every chat request can load/create
a conversation and fetch its full message history — without holding in-memory state.

**Independent Test** (US2 Scenario 3):
After restarting the FastAPI server, a second POST to `/api/{user_id}/chat` with
the original `conversation_id` must return a response that references the first
turn's content. The only source of that context is the `messages` table.

**User Story**: US2 — Persistent Conversation Context

- [X] T-3.2.3 [US2] Implement `_get_or_create_conversation()` and `_fetch_history()` DB helpers in `todo-web-app/backend/app/agent/runner.py`

  Create `todo-web-app/backend/app/agent/runner.py` with the module docstring,
  all imports, `AgentContext` dataclass, and the two DB helper functions:

  ```python
  # [Task]: T-3.2.3
  """
  Stateless AI agent runner for Phase 3.2.

  Implements the 7-step request cycle defined in cycle-logic.md.
  Each call creates a fresh agent instance — no module-level state.

  Constitution compliance:
    - Principle IX: no in-memory conversation state between calls
    - Principle X: agent uses ONLY MCP tools from app/mcp/server.py
    - Principle V: user_id injected into system prompt; all tools user-scoped
  """
  import logging
  import uuid
  from dataclasses import dataclass
  from typing import Optional

  import openai
  from agents import Agent, OpenAIChatCompletionsModel, Runner
  from fastapi import HTTPException, status
  from openai import AsyncOpenAI
  from sqlmodel import Session, select

  from app.db import engine, settings
  from app.models import Conversation, Message, MessageRole

  logger = logging.getLogger("agent.runner")
  tool_logger = logging.getLogger("agent.tools")


  @dataclass
  class AgentContext:
      """Type-safe context object passed to Runner for user isolation."""
      user_id: str
      conversation_id: uuid.UUID


  def _get_or_create_conversation(
      session: Session,
      user_id: str,
      conversation_id: Optional[uuid.UUID],
  ) -> uuid.UUID:
      """Return existing conversation UUID (ownership-checked) or create a new one."""
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
  ```

  **Verification** (US2 Scenario 1): call `_get_or_create_conversation(session, user_id, None)` → new UUID returned and row inserted in `conversations` table.

- [X] T-3.2.4 [US2] Implement `_save_message()` DB helper in `todo-web-app/backend/app/agent/runner.py`

  Append to `runner.py` (after `_fetch_history`):

  ```python
  # [Task]: T-3.2.4
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
  ```

  **Verification** (T-3.2.4 criterion): After any chat API call, query the `messages` table (via `postgres` MCP or `psql`) and confirm the user's message appears with `role = 'user'`.

**Checkpoint (US2 complete)**: `app/agent/runner.py` has `AgentContext`, `_get_or_create_conversation`, `_fetch_history`, and `_save_message`. A new conversation can be created and its messages fetched from the DB in a fresh Python session with no in-memory state.

---

## Phase 4: US1 — Conversational Task Management (Priority: P1)

**Goal**: Wire the Groq-backed AI agent to the MCP tools and expose it through
a JWT-protected HTTP endpoint. The user's natural language message goes in;
a task-aware response comes out.

**Independent Test** (US1 Scenario 1):
```bash
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add buy groceries to my tasks"}' \
  | jq '.response, .tool_calls'
```
Expected: `response` contains a friendly confirmation; `tool_calls` includes `"add_task"`;
the task is visible via `GET /api/{user_id}/tasks`.

**User Story**: US1 — Conversational Task Management via Chat

- [X] T-3.2.5 [P] [US1] Create `todo-web-app/backend/app/agent/prompts.py` with `SYSTEM_PROMPT_TEMPLATE`

  Create new file `todo-web-app/backend/app/agent/prompts.py`:

  ```python
  # [Task]: T-3.2.5
  """
  Agent system prompt — "Todo Architect" persona.

  Contains a single template string with {user_id} placeholder injected at
  runtime in runner.py. NEVER commit actual user IDs here.

  Constitution Principle XI: friendly confirmations, delete confirmations,
  Roman Urdu support, graceful error translation.
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

  **Verification**: `python -c "from app.agent.prompts import SYSTEM_PROMPT_TEMPLATE; print('prompts OK')"` exits 0.
  US3 coverage: Rule 4 (LANGUAGE ADAPTATION) satisfies User Story 3 — Roman Urdu support.

- [X] T-3.2.6 [US1] Implement `_build_mcp_server()` and `run_chat()` in `todo-web-app/backend/app/agent/runner.py`

  Append to `runner.py` (after `_save_message`):

  ```python
  # [Task]: T-3.2.6
  def _build_mcp_server():
      """Return an MCP server instance connected to Phase 3.1 FastMCP tools."""
      try:
          # Preferred: in-process (zero subprocess overhead per request)
          from agents.mcp import MCPServerFastMCP
          from app.mcp.server import mcp as fastmcp_instance
          return MCPServerFastMCP(fastmcp_instance)
      except (ImportError, AttributeError):
          # Fallback: subprocess (compatible with all SDK versions)
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


  async def run_chat(
      user_id: str,
      message: str,
      conversation_id: Optional[uuid.UUID],
  ) -> tuple[uuid.UUID, str, list[str]]:
      """
      Execute the 7-step stateless chat cycle (constitution Principle IX).

      Returns:
          (conversation_id, assistant_reply, tool_call_names)
      """
      from app.agent.prompts import SYSTEM_PROMPT_TEMPLATE

      with Session(engine) as session:
          # Step 1 — resolve/create conversation (Principle V: ownership check)
          conv_id = _get_or_create_conversation(session, user_id, conversation_id)
          # Step 2 — fetch history from DB (stateless — Principle IX)
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

      # Build input: history messages + current user message
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

      # Collect tool call names for response + INFO logging (FR-008)
      tool_call_names: list[str] = []
      for new_msg in result.new_messages:
          if hasattr(new_msg, "type") and new_msg.type == "tool_call":
              tool_name = getattr(new_msg, "name", None) or "unknown"
              tool_call_names.append(tool_name)
              tool_logger.info(
                  "MCP tool called: tool=%s user_id=%s",
                  tool_name,
                  user_id,
              )
          elif hasattr(new_msg, "role") and new_msg.role == "tool":
              tool_call_names.append("tool")

      assistant_reply = result.final_output or ""

      # Step 6 — persist assistant reply ONLY if non-empty and no exception raised
      if assistant_reply:
          with Session(engine) as session:
              _save_message(
                  session, conv_id, user_id, MessageRole.ASSISTANT, assistant_reply
              )

      # Step 7 — return to route handler
      return conv_id, assistant_reply, tool_call_names
  ```

  **Error handling**: Groq `APITimeoutError` / `APIConnectionError` → HTTP 503. Generic exceptions → HTTP 503. User message is always persisted (Step 3); assistant reply is skipped on failure.

- [X] T-3.2.7 [US1] Create `todo-web-app/backend/app/routes/chat.py` with `POST /api/{user_id}/chat` route

  Create new file `todo-web-app/backend/app/routes/chat.py`:

  ```python
  # [Task]: T-3.2.7
  """
  Chat route — POST /api/{user_id}/chat.

  Thin HTTP adapter: validates JWT, delegates to runner.run_chat(),
  returns ChatResponse. Stateless by design (constitution Principle IX).
  """
  import uuid
  from typing import Optional

  from fastapi import APIRouter, Depends, HTTPException, status

  from app.agent.runner import run_chat
  from app.auth import get_current_user_id
  from app.schemas import ChatRequest, ChatResponse

  router = APIRouter(tags=["chat"])


  @router.post("/{user_id}/chat", response_model=ChatResponse)
  async def chat(
      user_id: str,
      body: ChatRequest,
      current_user_id: str = Depends(get_current_user_id),
  ) -> ChatResponse:
      """
      Stateless AI chat endpoint.

      Authenticates user, delegates to the agent runner, and returns the
      assistant's reply with conversation context.
      """
      # Ownership guard (constitution Principle V + VI)
      if user_id != current_user_id:
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

  **Verification** (US1 Scenario 5): sending a request without a valid JWT returns HTTP 401 before `run_chat` is ever called.

- [X] T-3.2.8 [US1] Add `ChatRequest` / `ChatResponse` schemas to `todo-web-app/backend/app/schemas.py` and mount `chat_router` in `todo-web-app/backend/app/main.py`

  **Step A** — append to `app/schemas.py` (after existing schemas — do NOT alter them):
  ```python
  # [Task]: T-3.2.8 — Chat endpoint schemas
  import uuid as _uuid
  from typing import Optional as _Optional

  class ChatRequest(BaseModel):
      """Input schema for POST /api/{user_id}/chat."""
      message: str = Field(min_length=1, max_length=2000)
      conversation_id: _Optional[_uuid.UUID] = Field(default=None)


  class ChatResponse(BaseModel):
      """Response schema for POST /api/{user_id}/chat."""
      conversation_id: _uuid.UUID
      response: str
      tool_calls: list[str] = Field(default_factory=list)
  ```

  > **Note**: `uuid` and `Optional` may already be imported in `schemas.py`. Read the file first
  > and reuse existing imports instead of adding duplicate `import uuid as _uuid` aliases.
  > The `as _uuid` pattern is only needed if `uuid` is not already a top-level import.

  **Step B** — update `app/main.py`:
  - Read `main.py` before editing.
  - Add import: `from app.routes.chat import router as chat_router`
  - Add router: `app.include_router(chat_router, prefix="/api")`
  - Update version string: `version="3.2.0"`
  - Do NOT alter any existing route or middleware.

  ```python
  # [Task]: T-3.2.8 — mount chat router (add after tasks router line)
  from app.routes.chat import router as chat_router
  app.include_router(chat_router, prefix="/api")
  ```

  **Verification** (T-3.2.8 criterion — full end-to-end):
  1. Start the server: `uv run uvicorn app.main:app --reload`
  2. POST to `/api/{user_id}/chat` with a valid JWT and `{"message": "list my tasks"}`
  3. Response JSON contains `conversation_id` (UUID), `response` (non-empty string), `tool_calls` (list)
  4. `tool_calls` includes `"list_tasks"` — confirming MCP tools were called

**Checkpoint (US1 complete)**: All 4 tasks done. The `/api/{user_id}/chat` endpoint is live, JWT-protected, and returns AI-generated responses that reference real task data via MCP tools.

---

## Phase 5: Verification & Polish

**Purpose**: End-to-end smoke test confirming all 3 user stories work together.

- [X] T-3.2.9 [P] Run end-to-end smoke tests for all 3 user stories

  **US1 — Task chat (Scenario 1)**:
  ```bash
  # From todo-web-app/backend/
  JWT=$(uv run python -c "from app.auth import create_token; print(create_token('test-user-e2e'))" 2>/dev/null || echo "obtain-from-login")

  curl -s -X POST http://localhost:8000/api/test-user-e2e/chat \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{"message": "Add buy groceries to my tasks"}' | jq .
  ```
  Expected: `response` contains "buy groceries"; `tool_calls` includes `"add_task"`.

  **US2 — Conversation continuity (Scenario 2)**:
  ```bash
  # Capture conversation_id from first request, send follow-up
  CONV_ID=$(curl -s -X POST http://localhost:8000/api/test-user-e2e/chat \
    -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
    -d '{"message": "What tasks do I have?"}' | jq -r '.conversation_id')

  curl -s -X POST http://localhost:8000/api/test-user-e2e/chat \
    -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
    -d "{\"message\": \"Mark the first one as done\", \"conversation_id\": \"$CONV_ID\"}" | jq .
  ```
  Expected: AI uses conversation history to understand "the first one"; `tool_calls` includes `"complete_task"`.

  **US3 — Roman Urdu (Scenario 1)**:
  ```bash
  curl -s -X POST http://localhost:8000/api/test-user-e2e/chat \
    -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
    -d '{"message": "Meri tasks dekho"}' | jq '.response'
  ```
  Expected: response is in Roman Urdu (e.g., "Aap ki tasks yeh hain...").

  **Isolation check (US2 Scenario 4)**:
  ```bash
  # Cross-user conversation_id must fail with 404
  curl -s -X POST http://localhost:8000/api/other-user/chat \
    -H "Authorization: Bearer $JWT_OTHER_USER" -H "Content-Type: application/json" \
    -d "{\"message\": \"hello\", \"conversation_id\": \"$CONV_ID\"}" | jq '.detail'
  ```
  Expected: `"Conversation not found."` (HTTP 404).

- [X] T-3.2.10 [P] Update `todo-web-app/backend/CLAUDE.md` to reflect Phase 3.2 completion

  Update the phase status table, add agent runner notes, and document the chat endpoint:
  - Mark Phase 3.2 as complete with date.
  - Add: `app/agent/runner.py` — stateless 7-step chat cycle; `app/agent/prompts.py` — system prompt; `app/routes/chat.py` — chat endpoint.
  - Add env var note: `GROQ_API_KEY` required (see `.env.example`).

**Checkpoint**: Phase 3.2 fully operational. All 3 user stories verified. Phase 3.3 (ChatKit frontend) may now begin.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T-3.2.1 → T-3.2.2)
    └── Phase 2: Scaffold (T-3.2.0)
            └── Phase 3: US2 — DB Helpers (T-3.2.3 → T-3.2.4)
                    └── Phase 4: US1 — Agent + Endpoint
                            T-3.2.5 [P] — prompts.py (no DB dependency)
                            T-3.2.6     — runner.py core (depends T-3.2.3, T-3.2.4, T-3.2.5)
                            T-3.2.7     — routes/chat.py (depends T-3.2.6)
                            T-3.2.8     — schemas.py + main.py (depends T-3.2.7)
                    └── Phase 5: Verification (T-3.2.9 [P], T-3.2.10 [P])
```

### Critical Sequential Dependencies

| Task | Depends On | Reason |
|------|-----------|--------|
| T-3.2.0 | T-3.2.1 | Package must exist before agent modules import |
| T-3.2.2 | T-3.2.1 | Settings must be importable before runner uses them |
| T-3.2.3 | T-3.2.0, T-3.2.2 | runner.py imports from `app.db` and `app.models` |
| T-3.2.4 | T-3.2.3 | Appends to existing runner.py started in T-3.2.3 |
| T-3.2.6 | T-3.2.3, T-3.2.4, T-3.2.5 | `run_chat()` calls all DB helpers + reads prompts |
| T-3.2.7 | T-3.2.6, T-3.2.8 (schemas) | Route imports `run_chat` and `ChatRequest`/`ChatResponse` |
| T-3.2.8 | T-3.2.7 | `main.py` imports the router; schemas needed by route |
| T-3.2.9 | T-3.2.8 | Server must be running with all routes mounted |

### Parallel Opportunities

**T-3.2.0 + T-3.2.2**: `__init__.py` creation and `db.py` settings are completely
independent — different files, no imports between them.

**T-3.2.5 + T-3.2.3/T-3.2.4**: `prompts.py` has no imports from `runner.py` and
can be written while the DB helper tasks are in progress.

**T-3.2.9 + T-3.2.10**: Both are verification/docs tasks with no code dependencies
between them — run in parallel after T-3.2.8.

```bash
# Parallel example — Phase 3 and T-3.2.5 can run simultaneously:
# Stream A:
Task: T-3.2.3 — Write _get_or_create_conversation + _fetch_history in runner.py
Task: T-3.2.4 — Append _save_message to runner.py

# Stream B (independent file):
Task: T-3.2.5 — Create app/agent/prompts.py with SYSTEM_PROMPT_TEMPLATE
```

---

## Stylistic Rules (applied throughout)

1. **Task ID comments**: Every code block includes `# [Task]: T-3.2.x` at the top.
2. **Stateless runner**: `runner.py` holds zero module-level state — every `run_chat()` call
   creates a fresh agent, Groq client, and DB sessions from scratch.
3. **`user_id` required**: All tool calls must include `user_id` — the system prompt
   instructs the model to always pass it; no tool call should omit it.
4. **No HTTP exceptions in DB helpers**: `_get_or_create_conversation` raises `HTTPException`
   only for 404 (not found); `_fetch_history` and `_save_message` never raise.
5. **Groq error handling**: `run_chat()` catches `openai.APITimeoutError`, `APIConnectionError`,
   and `Exception` → HTTP 503. User message is always persisted (Step 3); assistant reply
   is skipped entirely on failure (do NOT write a partial/error message to the DB).
6. **PEP8 + Black (88 chars)**: All new files must pass `black --check` and `flake8`.
7. **Read before write**: Read `app/db.py`, `app/schemas.py`, and `app/main.py` before
   editing them in T-3.2.2 and T-3.2.8 — never assume existing content.

---

## Implementation Strategy

### MVP Scope (Phase 3.2 only)

1. **Phase 1** — Setup: T-3.2.1 → T-3.2.2 (add `openai-agents`, configure Groq settings)
2. **Phase 2** — Scaffold: T-3.2.0 (create `app/agent/` package)
3. **Phase 3** — DB helpers: T-3.2.3 → T-3.2.4 (history retrieval + message persistence)
4. **Phase 4 parallel start** — T-3.2.5 (system prompt) alongside Phase 3
5. **Phase 4 continue** — T-3.2.6 (full agent runner), T-3.2.7 (route), T-3.2.8 (schemas + mount)
6. **VALIDATE** with smoke test (T-3.2.9)

### What Phase 3.2 Delivers

- `app/agent/prompts.py` — "Todo Architect" system prompt with Roman Urdu support (US3)
- `app/agent/runner.py` — 7-step stateless `run_chat()` with Groq + MCP + DB persistence
- `app/routes/chat.py` — `POST /api/{user_id}/chat` — JWT-protected, thin adapter
- `app/schemas.py` additions — `ChatRequest`, `ChatResponse` Pydantic schemas
- `app/main.py` update — chat router mounted at `/api`
- `app/db.py` update — Groq settings fields + startup validator

### What Phase 3.2 Does NOT Deliver (Phase 3.3 scope)

- Frontend chat UI (ChatKit / Next.js component)
- WebSocket / streaming responses
- Conversation list/delete endpoints
- Message history pagination
- Rate limiting on the chat endpoint

---

## Notes

- All file paths are relative to the repository root (`hackathon-II/`).
- Backend working directory for `uv` commands: `todo-web-app/backend/`
- Phase 3.1 service layer uses `app/logic/task_ops.py` (not `app/services/tasks.py`) — `runner.py` does NOT import from it directly. The agent calls MCP tools, which internally call `app/logic/task_ops.py` (constitution Principle X).
- `MessageRole.USER` and `MessageRole.ASSISTANT` are already defined in `app/models.py` (Phase 3.1 — T-3.1.1). Reuse them in `runner.py`.
- `MCPServerFastMCP` is the preferred MCP integration (in-process, zero subprocess overhead). If it is not exported by the installed SDK version, `_build_mcp_server()` automatically falls back to `MCPServerStdio`.
- The `GROQ_API_KEY` validator in `Settings` will cause startup failure if the key is absent. Ensure the key is set in `.env` before running the server.
- Phase 3.1 tables `conversations` and `messages` are already live in Neon PostgreSQL — no migration needed for Phase 3.2.
