# [Task]: T-2.1.3, T-3.1.1, T-3.1.2
"""SQLModel ORM table definitions for the Todo backend."""
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime, Text, func
from sqlmodel import Field, Relationship, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(SQLModel, table=True):
    """
    Task table — owned by the backend service.
    user_id is a string FK reference to the Better Auth users table.
    No SQLModel FK constraint is defined because Better Auth owns users DDL.
    Isolation is enforced at the application layer (constitution Principle V).
    """

    __tablename__ = "tasks"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(nullable=False, index=True)
    title: str = Field(nullable=False, max_length=200)
    description: Optional[str] = Field(default=None, nullable=True)
    completed: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )


# ---------------------------------------------------------------------------
# [Task]: T-3.1.1 — Conversation + MessageRole
# ---------------------------------------------------------------------------


class MessageRole(str, Enum):
    """Valid values for Message.role (constitution Principle IX)."""

    USER = "user"
    ASSISTANT = "assistant"


class Conversation(SQLModel, table=True):
    """
    Conversation table — one record per chat session per user.
    Enables stateless AI request cycle (constitution Principle IX).
    user_id is a string FK reference to Better Auth users (no DDL constraint).
    """

    __tablename__ = "conversations"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(nullable=False, index=True)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    messages: list["Message"] = Relationship(back_populates="conversation")


# ---------------------------------------------------------------------------
# [Task]: T-3.1.2 — Message
# ---------------------------------------------------------------------------


class Message(SQLModel, table=True):
    """
    Message table — one record per turn (user or assistant).
    Stores role to enable full history retrieval without reprocessing.
    conversation_id FK references conversations.id with CASCADE delete.
    """

    __tablename__ = "messages"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    conversation_id: uuid.UUID = Field(
        foreign_key="conversations.id",
        nullable=False,
        index=True,
    )
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(max_length=20, nullable=False)  # MessageRole.value
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    conversation: Conversation = Relationship(back_populates="messages")
