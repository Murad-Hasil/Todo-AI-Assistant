# [Task]: T-2.1.5, T-3.1.4
"""
Task CRUD endpoints — thin HTTP adapters.

All route handlers delegate business logic to app.logic.task_ops.
HTTP behaviour (status codes, response envelopes) is unchanged from Phase 2.

All routes are scoped to the authenticated user_id.
Every query includes a user_id filter (constitution Principle V).
Database sessions are injected via FastAPI Depends (constitution Principle IV).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.auth import get_current_user_id
from app.db import get_session
from app.logic.task_ops import (
    get_task_for_user,
    op_complete_task,
    op_create_task,
    op_delete_task,
    op_list_tasks,
    op_update_task,
)
from app.schemas import (
    SortOrder,
    StatusFilter,
    TaskCreate,
    TaskListResponse,
    TaskRead,
    TaskSingleResponse,
    TaskUpdate,
)

router = APIRouter(tags=["tasks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _assert_owner(path_user_id: str, jwt_user_id: str) -> None:
    """Raise 403 if the path user_id does not match the authenticated user."""
    if path_user_id != jwt_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )


def _get_task_or_404(
    task_id: uuid.UUID,
    user_id: str,
    session: Session,
):
    """Return the task if it belongs to user_id, else raise 404."""
    task = get_task_for_user(session, user_id, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
    return task


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — GET list
# ---------------------------------------------------------------------------


@router.get("/{user_id}/tasks", response_model=TaskListResponse)
def list_tasks(
    user_id: str,
    status: StatusFilter = StatusFilter.ALL,
    sort: SortOrder = SortOrder.CREATED,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> TaskListResponse:
    """List all tasks for the authenticated user with optional filter and sort."""
    _assert_owner(user_id, current_user_id)
    tasks = op_list_tasks(session, user_id, status)

    # sort override for TITLE (op_list_tasks defaults to created_at desc)
    if sort == SortOrder.TITLE:
        tasks = sorted(tasks, key=lambda t: t.title)

    return TaskListResponse(
        data=[TaskRead.model_validate(t) for t in tasks],
        meta={"total": len(tasks)},
    )


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — POST create
# ---------------------------------------------------------------------------


@router.post(
    "/{user_id}/tasks",
    response_model=TaskSingleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    user_id: str,
    body: TaskCreate,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> TaskSingleResponse:
    """Create a new task for the authenticated user."""
    _assert_owner(user_id, current_user_id)
    task = op_create_task(session, user_id, body.title, body.description)
    return TaskSingleResponse(data=TaskRead.model_validate(task))


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — GET single
# ---------------------------------------------------------------------------


@router.get("/{user_id}/tasks/{task_id}", response_model=TaskSingleResponse)
def get_task(
    user_id: str,
    task_id: uuid.UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> TaskSingleResponse:
    """Get a single task by ID, scoped to the authenticated user."""
    _assert_owner(user_id, current_user_id)
    task = _get_task_or_404(task_id, user_id, session)
    return TaskSingleResponse(data=TaskRead.model_validate(task))


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — PUT update
# ---------------------------------------------------------------------------


@router.put("/{user_id}/tasks/{task_id}", response_model=TaskSingleResponse)
def update_task(
    user_id: str,
    task_id: uuid.UUID,
    body: TaskUpdate,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> TaskSingleResponse:
    """Update title and/or description of an existing task (completion unchanged)."""
    _assert_owner(user_id, current_user_id)
    _get_task_or_404(task_id, user_id, session)  # 404 guard
    task = op_update_task(session, user_id, task_id, body.title, body.description)
    return TaskSingleResponse(data=TaskRead.model_validate(task))


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — DELETE
# ---------------------------------------------------------------------------


@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    user_id: str,
    task_id: uuid.UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> None:
    """Permanently delete a task owned by the authenticated user."""
    _assert_owner(user_id, current_user_id)
    deleted = op_delete_task(session, user_id, task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )


# ---------------------------------------------------------------------------
# [Task]: T-2.1.5 — PATCH toggle completion (US2)
# ---------------------------------------------------------------------------


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskSingleResponse)
def toggle_task_completion(
    user_id: str,
    task_id: uuid.UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> TaskSingleResponse:
    """Toggle the completed status of a task (true → false, false → true)."""
    _assert_owner(user_id, current_user_id)
    task = _get_task_or_404(task_id, user_id, session)

    # Toggle: REST route uses toggle; MCP complete_task uses set-to-true (idempotent)
    from datetime import datetime, timezone

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return TaskSingleResponse(data=TaskRead.model_validate(task))
