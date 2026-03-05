# [Task]: T-2.1.4
"""
Pydantic request/response schemas.

Separates the wire format from SQLModel ORM internals.
TaskCreate / TaskUpdate → input validation
TaskRead → output serialisation
TaskSingleResponse / TaskListResponse → consistent envelope shape
StatusFilter / SortOrder → validated query parameters
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Query parameter enums
# ---------------------------------------------------------------------------


class StatusFilter(str, Enum):
    ALL = "all"
    PENDING = "pending"
    COMPLETED = "completed"


class SortOrder(str, Enum):
    CREATED = "created"
    TITLE = "title"
    DUE_DATE = "due_date"  # Phase 2.1 alias for created — extend in Phase 2.3


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class TaskCreate(BaseModel):
    """Input schema for POST /api/{user_id}/tasks."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class TaskUpdate(BaseModel):
    """Input schema for PUT /api/{user_id}/tasks/{id} — full replacement."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class TaskRead(BaseModel):
    """Serialised Task returned in all responses."""

    id: uuid.UUID
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskSingleResponse(BaseModel):
    """Envelope for single-task responses: { data: Task }"""

    data: TaskRead


class TaskListResponse(BaseModel):
    """Envelope for list responses: { data: [Task], meta: { total: N } }"""

    data: list[TaskRead]
    meta: dict[str, int]


# ---------------------------------------------------------------------------
# [Task]: T-3.2.8 — Chat endpoint schemas
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Input schema for POST /api/{user_id}/chat."""

    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[uuid.UUID] = Field(default=None)


class ChatResponse(BaseModel):
    """Response schema for POST /api/{user_id}/chat."""

    conversation_id: uuid.UUID
    response: str
    tool_calls: list[str] = Field(default_factory=list)
