# Phase 0 Research: Phase 3.1 — Database Evolution & MCP Server

**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-03
**Input**: Code audit of `/todo-web-app/backend/app/` + spec review

---

## Finding 1: No `logic.py` Exists — Service Extraction Required

**Decision**: Create `app/services/tasks.py` as a new service layer.

**Rationale**: The plan references "refactor `logic.py`" but no such file exists.
All task CRUD logic lives directly in `routes/tasks.py` as route handler functions
(`create_task`, `list_tasks`, `update_task`, `delete_task`, `toggle_task_completion`).
Both the REST API and the MCP server must call the same business logic — extracting
it to `app/services/tasks.py` is the minimum viable diff (Principle III — non-destructive).

**Alternatives considered**:
- Duplicate logic in MCP tools — rejected (maintenance burden, violates DRY).
- Import route functions from MCP — rejected (route functions raise HTTP exceptions,
  which MCP tools must not do).
- Create `logic.py` at root — rejected (constitution Principle VII requires the
  `backend/app/` namespace).

---

## Finding 2: `user_id` is `str`, Not `uuid.UUID`

**Decision**: `Conversation.user_id` and `Message.user_id` MUST be typed as `str`,
not `uuid.UUID`.

**Rationale**: Better Auth owns the `users` table DDL. The existing `Task.user_id`
is declared as `str` to avoid a SQLAlchemy FK constraint on a table managed by a
different framework. The `Conversation` and `Message` models MUST follow this same
pattern. The spec's `uuid.UUID` references are logical (UUIDs are stored as strings
in the Better Auth schema).

**Alternatives considered**:
- Use `uuid.UUID` with sa_type=String — overly complex, inconsistent with existing models.
- Add a FK constraint to Better Auth's users table — rejected (violates Phase 2 contract).

---

## Finding 3: Existing Alembic Migration Pattern

**Decision**: New migration file `002_add_conversations_messages.py` with
`down_revision = "001"`.

**Rationale**: The existing migration `001_create_tasks_table.py` uses plain numeric
revision IDs (`revision = "001"`, `down_revision = None`). Phase 3 migration follows
this convention for consistency. The migration MUST create `conversations` first (FK
dependency: `messages.conversation_id` → `conversations.id`).

**Alternatives considered**:
- Using Alembic autogenerate — rejected (requires running against a live DB;
  manual migration gives precise control over index names and FK handling).
- UUID revision IDs (Alembic default) — rejected (project uses sequential numeric IDs
  per existing pattern).

---

## Finding 4: MCP SDK — `FastMCP` Pattern

**Decision**: Use `mcp.server.fastmcp.FastMCP` (Official MCP SDK for Python).
Tools defined via `@mcp.tool()` decorator. Server accessible in-process by the
OpenAI Agents SDK via `MCPServerStdio` or direct `StreamableHTTPServerParams`.

**Rationale**: `FastMCP` is the lightweight, decorator-based API in the official
`mcp` package. It mirrors FastAPI's developer experience, aligns with the team's
Python background, and supports both STDIO (for standalone testing with
`mcp dev server.py`) and in-process use by the agent.

**Alternatives considered**:
- Low-level `mcp.server.Server` — rejected (verbose; FastMCP is the idiomatic choice
  for Python per official MCP docs).
- Custom HTTP JSON-RPC server — rejected (unnecessary; official SDK handles protocol
  compliance).
- Separate microservice process — rejected (adds operational complexity; in-process
  or STDIO mode sufficient for single-server deployment).

**Package**: `mcp[cli]>=1.0.0` — adds the `mcp dev` inspector CLI for standalone testing.

---

## Finding 5: MCP Tool Error Handling Contract

**Decision**: MCP tool functions return `dict` (structured results) and raise
`ValueError` / return `{"success": False, "error": "..."}` for expected errors.
They MUST NOT raise `HTTPException` or any FastAPI-specific exception.

**Rationale**: Route handlers in `routes/tasks.py` raise `HTTPException` for error
conditions (404, 403). The extracted service functions in `app/services/tasks.py`
MUST instead return `None` (for not-found) and let callers (HTTP routes or MCP tools)
decide how to surface errors. MCP tool wrappers convert `None` → `{"success": False,
"error": "Task not found."}`.

---

## Finding 6: `complete_task` — Toggle vs. Set-to-True

**Decision**: `complete_task` MCP tool MUST set `completed = True` always (idempotent
set), NOT toggle. The REST API uses toggle (`PATCH /complete`), but the MCP tool spec
requires idempotent behaviour ("calling on an already-completed task returns success
without error").

**Rationale**: The agent behavior spec defines `complete_task` as an idempotent
"mark done" action. A toggle would require the agent to first check status — adding
unnecessary complexity and extra tool calls. The REST toggle endpoint is untouched.

---

## Finding 7: Conversation Scope Per Request (Stateless Cycle)

**Decision**: The FastAPI `/api/chat` endpoint (Phase 3.2, out of scope for Phase 3.1)
will accept an optional `conversation_id` parameter. If absent, a new `Conversation`
is created. All messages for that conversation are fetched and passed to the agent
as history on every request.

**Rationale**: This satisfies Constitution Principle IX (no in-memory state). The
conversation and message storage designed in Phase 3.1 anticipates this API contract
without implementing it yet.

---

## All NEEDS CLARIFICATION Resolved

No open clarification items. All 7 findings above inform the Phase 1 design.

---

---

# Phase 0 Research: Phase 3.3 — Frontend Chat UI

**Date**: 2026-03-04
**Input**: Code audit of `frontend/src/app/dashboard/` + `frontend/src/lib/api.ts` + Phase 3.3 specs

---

## Finding 1: Layout — Side Panel Over Floating Toggle

**Decision**: Dedicated two-column side panel via CSS grid (`lg:grid-cols-[1fr_380px]`)

**Rationale**: The existing `max-w-3xl` dashboard has no space for a right-aligned floating overlay at narrow viewports. Spec explicitly prefers side panel. CSS grid is simpler than `position: fixed` floating panel with z-index, drag handles, and backdrop.

**Alternatives considered**:
- Floating bottom-right toggle — covers task items on mobile; rejected
- Dedicated `/chat` page — breaks simultaneous task + chat visibility requirement; rejected

---

## Finding 2: Task Refresh — `router.refresh()` Over Server Action

**Decision**: `router.refresh()` called from `ChatPanel` after write `tool_calls`

**Rationale**: `revalidatePath` requires `"use server"` context; cannot be called from Client Components. `router.refresh()` is the correct Next.js 14 App Router primitive for client-triggered Server Component re-fetches, with no extra round-trip.

**Alternatives considered**:
- Server Action wrapper around `revalidatePath` — adds unnecessary RPC overhead; rejected
- Manual task state mirror in `ChatPanel` — duplicates Server Component state, creates sync problems; rejected

---

## Finding 3: `conversation_id` Storage — URL as Authoritative Store

**Decision**: URL query param `?conversation_id=<UUID>` authoritative; React state as in-memory mirror

**Rationale**: Spec (ui-logic.md) mandates URL-first strategy. Survives refresh, accessible without localStorage, works in private browsing. `router.replace` (not `push`) avoids history pollution.

**Alternatives considered**:
- `localStorage` primary — unavailable in private browsing; spec rules it out; rejected
- `sessionStorage` — does not survive cross-tab; rejected

---

## Finding 4: History Endpoint — Absent from Backend, Required for Spec Compliance

**Decision**: Frontend degrades gracefully when endpoint is absent; backend addition is a Phase 3.3 task

**Rationale**: `GET /api/{user_id}/conversations/{id}/messages` does not exist in `chat.py`. The frontend handles `NotFoundError` (or any error) from `getChatHistory()` by rendering an empty chat window while preserving `conversationId` for continued threading. The backend route addition is ~25 lines using existing models.

**Alternatives considered**:
- Require endpoint before frontend work — blocks parallelization unnecessarily; rejected
- Always start fresh (no history fetch) — fails spec User Story 1 (history persistence); rejected

---

## Finding 5: `useSearchParams()` Requires Suspense Boundary

**Decision**: Wrap `<ChatPanel>` in `<Suspense fallback={null}>` in `dashboard/page.tsx`

**Rationale**: Next.js 14 App Router throws a build error if a component using `useSearchParams()` is not wrapped in a Suspense boundary. This is a framework requirement, not optional.

---

## Finding 6: RTL Detection — Regex with 10% Threshold

**Decision**: `/[\u0600-\u06FF]/g` with `matches.length / text.length > 0.1` threshold

**Rationale**: Spec defines exactly this heuristic. Regex is universally supported. The 10% threshold prevents false positives from incidental Arabic characters in otherwise LTR text. Roman Urdu (Latin script) correctly returns `false`.

---

## Finding 7: TypingIndicator Uses Previous Response's `tool_calls`

**Decision**: `lastToolCalls` from prior response determines the label for the current in-flight indicator

**Rationale**: The next response's tool_calls are unknown until the response arrives. Using the previous response's tools as a predictor is accurate for conversational flows (users tend to continue the same type of operation). No backend streaming required.

---

## All NEEDS CLARIFICATION Resolved (Phase 3.3)

No open clarification items. All 7 findings inform the Phase 3.3 design in `phase3-ui-plan.md`.
