# [Task]: T-3.2.3
"""
Stateless AI agent runner for Phase 3.2.

Implements the 7-step request cycle defined in cycle-logic.md.
Each call creates a fresh agent instance — no module-level state.

Constitution compliance:
  - Principle IX: no in-memory conversation state between calls
  - Principle X: agent uses ONLY MCP tools from app/mcp/server.py
  - Principle V: user_id injected into system prompt; all tools user-scoped

SDK adaptation notes (openai-agents v0.10.3 vs spec v0.0.12):
  - MCPServerFastMCP absent → MCPServerStdio used (subprocess, async context manager)
  - result.new_messages absent → result.new_items used (ToolCallItem.type == "tool_call_item")
  - parallel_tool_calls=False required for Groq llama-3.3-70b-versatile tool call stability
  - History objects converted to dicts inside Session to avoid DetachedInstanceError
"""
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import openai
from agents import Agent, ModelSettings, OpenAIChatCompletionsModel, Runner
from agents.mcp import MCPServerStdio
from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlmodel import Session, select

from app.db import engine, settings
from app.models import Conversation, Message, MessageRole

logger = logging.getLogger("agent.runner")
tool_logger = logging.getLogger("agent.tools")

# Resolve backend root once at import time (stable — not request-level state)
_BACKEND_ROOT = Path(__file__).parent.parent.parent


@dataclass
class AgentContext:
    """Type-safe context object passed to Runner for user isolation."""

    user_id: str
    conversation_id: uuid.UUID


# ---------------------------------------------------------------------------
# [Task]: T-3.2.3 — DB helpers: get/create conversation + fetch history
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# [Task]: T-3.2.4 — DB helper: save message
# ---------------------------------------------------------------------------


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
# [Task]: T-3.2.6 — MCP server builder + run_chat()
# ---------------------------------------------------------------------------


def _build_mcp_server() -> MCPServerStdio:
    """Return a MCPServerStdio instance connected to Phase 3.1 FastMCP tools."""
    return MCPServerStdio(
        params={
            "command": "uv",
            "args": ["run", "mcp", "run", "app/mcp/server.py"],
            "cwd": str(_BACKEND_ROOT),
        },
        cache_tools_list=True,
        client_session_timeout_seconds=30,  # subprocess startup can be slow
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
        # Convert to plain dicts inside session to avoid DetachedInstanceError
        history_dicts: list[dict] = [
            {"role": msg.role, "content": msg.content}
            for msg in _fetch_history(session, conv_id)
        ]
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

    # Build input: history messages + current user message
    input_messages: list[dict] = history_dicts
    input_messages.append({"role": "user", "content": message})

    ctx = AgentContext(user_id=user_id, conversation_id=conv_id)

    # MCPServerStdio must be used as async context manager (calls connect/cleanup)
    try:
        async with _build_mcp_server() as mcp_server:
            agent = Agent(
                name="TodoArchitect",
                model=model,
                instructions=system_prompt,
                mcp_servers=[mcp_server],
                model_settings=ModelSettings(parallel_tool_calls=False),
            )
            result = await Runner.run(agent, input=input_messages, context=ctx)
    except (openai.APITimeoutError, openai.APIConnectionError) as exc:
        logger.error("Groq API connection error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Agent runner unexpected error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again.",
        )

    # Collect tool call names from new_items (FR-008)
    tool_call_names: list[str] = []
    for item in result.new_items:
        if item.type == "tool_call_item":
            raw = item.raw_item
            tool_name = getattr(raw, "name", None) or "unknown"
            tool_call_names.append(tool_name)
            tool_logger.info(
                "MCP tool called: tool=%s user_id=%s",
                tool_name,
                user_id,
            )

    assistant_reply: str = result.final_output or ""

    # Step 6 — persist assistant reply ONLY if non-empty and no exception raised
    if assistant_reply:
        with Session(engine) as session:
            _save_message(
                session, conv_id, user_id, MessageRole.ASSISTANT, assistant_reply
            )

    # Step 7 — return to route handler
    return conv_id, assistant_reply, tool_call_names
