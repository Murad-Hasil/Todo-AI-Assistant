# [Task]: T-3.1.4
"""
Task business logic — pure functions shared by REST routes and MCP tools.

Design contract (constitution Principles III, V, X):
  - Each function accepts a SQLModel Session injected by the caller.
  - Each function enforces user_id scoping on every DB query.
  - Functions return domain objects or None; they NEVER raise HTTPException.
  - HTTP error translation is the responsibility of the route layer.
  - MCP tools call these functions directly and map None → {"success": false}.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.models import Task
from app.schemas import StatusFilter


def get_task_for_user(
    session: Session,
    user_id: str,
    task_id: uuid.UUID,
) -> Task | None:
    """Return the task if it belongs to user_id, else None."""
    return session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()


def op_list_tasks(
    session: Session,
    user_id: str,
    status: StatusFilter = StatusFilter.ALL,
) -> list[Task]:
    """Return all tasks for user_id, optionally filtered by completion status."""
    query = select(Task).where(Task.user_id == user_id)
    if status == StatusFilter.PENDING:
        query = query.where(Task.completed == False)  # noqa: E712
    elif status == StatusFilter.COMPLETED:
        query = query.where(Task.completed == True)  # noqa: E712
    query = query.order_by(Task.created_at.desc())
    return list(session.exec(query).all())


def op_create_task(
    session: Session,
    user_id: str,
    title: str,
    description: Optional[str] = None,
) -> Task:
    """Create and persist a new task; return the refreshed instance."""
    task = Task(user_id=user_id, title=title, description=description)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def op_complete_task(
    session: Session,
    user_id: str,
    task_id: uuid.UUID,
) -> Task | None:
    """Set task.completed = True (idempotent). Returns None if not found."""
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    task.completed = True
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def op_delete_task(
    session: Session,
    user_id: str,
    task_id: uuid.UUID,
) -> uuid.UUID | None:
    """Permanently delete a task. Returns deleted task_id or None if not found."""
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    deleted_id = task.id
    session.delete(task)
    session.commit()
    return deleted_id


def op_update_task(
    session: Session,
    user_id: str,
    task_id: uuid.UUID,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> Task | None:
    """Update title and/or description of a task. Returns None if not found."""
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        return None
    if title is not None:
        task.title = title
    if description is not None:
        task.description = description or None
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
