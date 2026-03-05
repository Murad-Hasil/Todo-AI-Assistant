# [Task]: T-3.1.5, T-3.1.6, T-3.1.7, T-3.1.8, T-3.1.9
"""
MCP server exposing Todo CRUD as typed agent tools.

Run standalone:   uv run mcp dev app/mcp/server.py
Import by agent:  from app.mcp.server import mcp  (FastMCP instance)

Constitution compliance:
  - Principle V:   Every tool accepts user_id and enforces user-scoped queries.
  - Principle IX:  Each tool opens its own DB session (stateless — no shared state).
  - Principle X:   These tools are the ONLY interface between the AI agent and tasks DB.
  - Principle XI:  All tools return {"success": bool, ...} for agent-friendly error handling.
"""
import uuid
from typing import Optional

from mcp.server.fastmcp import FastMCP
from sqlmodel import Session

from app.db import engine
from app.logic.task_ops import (
    op_complete_task,
    op_create_task,
    op_delete_task,
    op_list_tasks,
    op_update_task,
)
from app.schemas import StatusFilter

# [Task]: T-3.1.5 — FastMCP instance
mcp = FastMCP("todo-mcp-server")


def _get_session() -> Session:
    """Open a new DB session per tool call (constitution Principle IX — stateless)."""
    return Session(engine)


# ---------------------------------------------------------------------------
# [Task]: T-3.1.6 — add_task
# ---------------------------------------------------------------------------


@mcp.tool()
def add_task(
    user_id: str,
    title: str,
    description: Optional[str] = None,
) -> dict:
    """Creates a new task for the authenticated user.

    Args:
        user_id: The authenticated user's ID (required for data isolation).
        title: Task title (1–200 characters).
        description: Optional longer description.

    Returns:
        {"success": true, "task": {...}} on success.
        {"success": false, "error": "..."} on validation failure.
    """
    if not title or not title.strip():
        return {"success": False, "error": "Task title cannot be empty."}
    if len(title) > 200:
        return {"success": False, "error": "Task title too long (max 200 chars)."}
    with _get_session() as session:
        task = op_create_task(session, user_id, title.strip(), description)
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "user_id": task.user_id,
            "created_at": task.created_at.isoformat(),
        },
    }


# ---------------------------------------------------------------------------
# [Task]: T-3.1.7 — list_tasks
# ---------------------------------------------------------------------------


@mcp.tool()
def list_tasks(
    user_id: str,
    status: str = "all",
) -> dict:
    """Lists tasks for the authenticated user, optionally filtered by status.

    Args:
        user_id: The authenticated user's ID (required for data isolation).
        status: Filter — "all" | "pending" | "completed" (default: "all").

    Returns:
        {"success": true, "tasks": [...], "count": N} on success.
        {"success": false, "error": "..."} on invalid status value.
    """
    status_map = {
        "all": StatusFilter.ALL,
        "pending": StatusFilter.PENDING,
        "completed": StatusFilter.COMPLETED,
    }
    if status not in status_map:
        return {
            "success": False,
            "error": "Invalid status filter. Use: all, pending, completed.",
        }
    with _get_session() as session:
        tasks = op_list_tasks(session, user_id, status_map[status])
    return {
        "success": True,
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in tasks
        ],
        "count": len(tasks),
    }


# ---------------------------------------------------------------------------
# [Task]: T-3.1.8 — complete_task + delete_task
# ---------------------------------------------------------------------------


@mcp.tool()
def complete_task(
    user_id: str,
    task_id: str,
) -> dict:
    """Marks a task as completed (idempotent — always sets completed=true).

    Note: Unlike the REST PATCH /complete endpoint (which toggles), this tool
    only ever sets completed=True, making it safe for the AI to call repeatedly.

    Args:
        user_id: The authenticated user's ID (required for data isolation).
        task_id: UUID string of the task to complete.

    Returns:
        {"success": true, "task": {...}} on success.
        {"success": false, "error": "..."} if not found or invalid UUID.
    """
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        task = op_complete_task(session, user_id, tid)
    if not task:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat(),
        },
    }


@mcp.tool()
def delete_task(
    user_id: str,
    task_id: str,
) -> dict:
    """Permanently removes a task. This action is irreversible.

    The AI agent MUST request explicit user confirmation before calling this tool
    (constitution Principle XI / FR-009).

    Args:
        user_id: The authenticated user's ID (required for data isolation).
        task_id: UUID string of the task to delete.

    Returns:
        {"success": true, "deleted_task_id": "...", "message": "..."} on success.
        {"success": false, "error": "..."} if not found or invalid UUID.
    """
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        deleted_id = op_delete_task(session, user_id, tid)
    if not deleted_id:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "deleted_task_id": str(deleted_id),
        "message": "Task deleted successfully.",
    }


# ---------------------------------------------------------------------------
# [Task]: T-3.1.9 — update_task
# ---------------------------------------------------------------------------


@mcp.tool()
def update_task(
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """Updates the title and/or description of a task.

    At least one of title or description must be provided.

    Args:
        user_id: The authenticated user's ID (required for data isolation).
        task_id: UUID string of the task to update.
        title: New title (1–200 characters), or omit to leave unchanged.
        description: New description, or omit to leave unchanged.

    Returns:
        {"success": true, "task": {...}} on success.
        {"success": false, "error": "..."} on validation failure or not found.
    """
    if title is None and description is None:
        return {
            "success": False,
            "error": "Provide at least title or description to update.",
        }
    if title is not None and not title.strip():
        return {"success": False, "error": "Task title cannot be empty."}
    if title is not None and len(title) > 200:
        return {"success": False, "error": "Task title too long (max 200 chars)."}
    try:
        tid = uuid.UUID(task_id)
    except ValueError:
        return {"success": False, "error": "Invalid task_id format."}
    with _get_session() as session:
        task = op_update_task(session, user_id, tid, title, description)
    if not task:
        return {"success": False, "error": "Task not found."}
    return {
        "success": True,
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat(),
        },
    }
