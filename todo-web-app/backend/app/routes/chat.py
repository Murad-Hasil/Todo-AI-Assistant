# [Task]: T-3.2.7
# [Task]: T-3.3.4
"""
Chat routes — POST /api/{user_id}/chat and GET /api/{user_id}/conversations/{id}/messages.

Thin HTTP adapters: validate JWT, delegate to business logic, return typed responses.
Stateless by design (constitution Principle IX).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.agent.runner import run_chat
from app.auth import get_current_user_id
from app.db import get_session
from app.models import Conversation, Message
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


@router.get("/{user_id}/conversations/{conversation_id}/messages")
def get_conversation_messages(
    user_id: str,
    conversation_id: uuid.UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> dict:
    """
    Fetch message history for a conversation (Phase 3.3 — T-3.3.4).

    Returns messages ordered by created_at ASC so the frontend can render
    chat history in chronological order. JWT-protected; enforces user ownership
    (constitution Principles V + VI).
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )

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

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())  # type: ignore[arg-type]
    ).all()

    return {
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }
