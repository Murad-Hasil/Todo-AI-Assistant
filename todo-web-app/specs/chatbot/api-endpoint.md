# API Contract: POST /api/{user_id}/chat

**Feature**: Phase 3.2 — AI Agent Logic & Stateless Chat Endpoint
**Branch**: `005-chatbot-db-mcp`
**Date**: 2026-03-03
**Depends On**: Phase 3.1 MCP server (`app/mcp/server.py`), Conversation + Message models

---

## Endpoint

```
POST /api/{user_id}/chat
```

**Authentication**: `Authorization: Bearer <JWT>` (same dependency as Phase 2 CRUD endpoints)
**Content-Type**: `application/json`

---

## Path Parameters

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `user_id` | string | YES      | The authenticated user's ID (matched against JWT `sub` claim) |

---

## Request Body

```json
{
  "message": "Add buy milk to my tasks",
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Field             | Type   | Required | Constraints              | Description                                                  |
|-------------------|--------|----------|--------------------------|--------------------------------------------------------------|
| `message`         | string | YES      | 1–2000 characters        | The user's natural language input                            |
| `conversation_id` | string | NO       | Valid UUID v4 string     | ID of existing conversation to continue; omit to start new  |

> **Note**: `conversation_id` is a UUID string, not an integer. Phase 3.1 implemented
> `Conversation.id` as `uuid.UUID` — the API reflects this.

---

## Response Body — Success (HTTP 200)

```json
{
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "response": "Got it! I've added 'buy milk' to your tasks.",
  "tool_calls": ["add_task"]
}
```

| Field             | Type           | Description                                              |
|-------------------|----------------|----------------------------------------------------------|
| `conversation_id` | string (UUID)  | ID of the conversation (new or existing)                 |
| `response`        | string         | The AI assistant's natural language reply                |
| `tool_calls`      | list[string]   | Names of MCP tools invoked during this request cycle     |

---

## Error Responses

| HTTP Status | Condition                                                | Body                                              |
|-------------|----------------------------------------------------------|---------------------------------------------------|
| 401         | Missing or invalid JWT                                   | `{"detail": "Not authenticated."}`               |
| 403         | `user_id` in path does not match JWT `sub`               | `{"detail": "You do not have permission..."}`     |
| 404         | `conversation_id` provided but does not exist            | `{"detail": "Conversation not found."}`           |
| 404         | `conversation_id` belongs to a different user            | `{"detail": "Conversation not found."}`           |
| 422         | Message is empty or exceeds 2000 characters              | Pydantic validation error body                    |
| 503         | Groq API unavailable after timeout                       | `{"detail": "AI service temporarily unavailable. Please try again."}` |

---

## Pydantic Schemas

### Request Schema — `ChatRequest`

```python
# app/schemas.py addition

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[uuid.UUID] = Field(default=None)
```

### Response Schema — `ChatResponse`

```python
class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    response: str
    tool_calls: list[str] = Field(default_factory=list)
```

---

## New Files

| File                          | Action | Purpose                                           |
|-------------------------------|--------|---------------------------------------------------|
| `app/agent/runner.py`         | NEW    | Stateless agent runner (Step 2–6 of cycle logic)  |
| `app/routes/chat.py`          | NEW    | FastAPI route handler for `POST /api/{user_id}/chat` |
| `app/main.py`                 | UPDATE | Mount `chat_router` under `/api` prefix           |
| `app/schemas.py`              | UPDATE | Add `ChatRequest`, `ChatResponse`                 |

---

## cURL Example

```bash
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add buy milk to my tasks"}'
```

Expected response:
```json
{
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "response": "Got it! I've added 'buy milk' to your tasks.",
  "tool_calls": ["add_task"]
}
```

---

## Continue a Conversation

```bash
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What about the one I just added?", "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"}'
```

The agent retrieves all messages for `3fa85f64...` from the database and responds
with context from the first turn.

---

## Required Environment Variables (Phase 3.2 additions)

| Variable            | Required | Description                                              |
|---------------------|----------|----------------------------------------------------------|
| `GROQ_API_KEY`      | YES      | API key for Groq LLM access                             |
| `OPENAI_BASE_URL`   | NO       | Groq-compatible base URL (default: `https://api.groq.com/openai/v1`) |
| `GROQ_MODEL`        | NO       | Model name (default: `llama-3.3-70b-versatile`)         |
| `MAX_HISTORY_MESSAGES` | NO   | Max messages fetched per request (default: 20)          |
