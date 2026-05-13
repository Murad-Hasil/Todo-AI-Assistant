"""Business logic layer — zero I/O.

# Task: T-1.2 — Task Data Model and TodoLogic class
"""
from __future__ import annotations

from dataclasses import dataclass, field


# Task: T-1.2 — Task dataclass
@dataclass
class Task:
    """Represents a single unit of work."""

    id: int
    title: str
    description: str = field(default="")
    completed: bool = field(default=False)


# Task: T-1.2 — Custom exception for missing task IDs
class TaskNotFoundError(ValueError):
    """Raised when an operation targets a task ID that does not exist."""

    def __init__(self, task_id: int) -> None:
        super().__init__(f"Task ID {task_id} not found.")
        self.task_id = task_id


# Task: T-1.2 — Title validation (module-level, keeps Task pure)
def _validate_title(title: str) -> str:
    """Strip and validate a task title.

    Returns the stripped title on success.
    Raises ValueError if empty or exceeds 200 characters.
    """
    stripped = title.strip()
    if not stripped:
        raise ValueError("Title is required (1-200 characters).")
    if len(stripped) > 200:
        raise ValueError("Title must be 200 characters or fewer.")
    return stripped


# Task: T-1.2 — TodoLogic container with in-memory storage
class TodoLogic:
    """Pure business logic for the Todo CLI.

    Contains zero I/O (no print/input calls).
    All state lives in _tasks: dict[int, Task].
    """

    def __init__(self) -> None:
        # Task: T-1.2 — In-memory store and monotonic ID counter
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    # Task: T-1.3 — Create
    def add_task(self, title: str, description: str = "") -> Task:
        """Validate, create, store, and return a new Task.

        Args:
            title: The task title (1-200 characters).
            description: Optional task description.

        Returns:
            The newly created Task.

        Raises:
            ValueError: If title is empty or exceeds 200 chars.
        """
        clean_title = _validate_title(title)
        task = Task(
            id=self._next_id,
            title=clean_title,
            description=description,
        )
        self._tasks[task.id] = task
        self._next_id += 1
        return task

    # Task: T-1.3 — Read (list)
    def list_tasks(self) -> list[Task]:
        """Return all tasks in insertion order. Empty list if none.

        Returns:
            List of all Task objects.
        """
        return list(self._tasks.values())

    # Task: T-1.4 — Read (single)
    def get_task(self, task_id: int) -> Task:
        """Return the Task for task_id.

        Args:
            task_id: The ID of the task to retrieve.

        Returns:
            The matching Task.

        Raises:
            TaskNotFoundError: If no task with task_id exists.
        """
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)
        return self._tasks[task_id]

    # Task: T-1.4 — Update
    def update_task(
        self,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """Update title and/or description of an existing task.

        Args:
            task_id: The ID of the task to update.
            title: New title value, or None to leave unchanged.
            description: New description value, or None to leave unchanged.

        Returns:
            The updated Task.

        Raises:
            TaskNotFoundError: If no task with task_id exists.
            ValueError: If the new title is empty or exceeds 200 chars.
        """
        task = self.get_task(task_id)
        if title is not None:
            task.title = _validate_title(title)
        if description is not None:
            task.description = description
        return task

    # Task: T-1.4 — Delete
    def delete_task(self, task_id: int) -> None:
        """Remove a task by ID.

        Args:
            task_id: The ID of the task to delete.

        Raises:
            TaskNotFoundError: If no task with task_id exists.

        Note:
            _next_id is NOT decremented (no ID reuse per spec).
        """
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)
        del self._tasks[task_id]

    # Task: T-1.5 — Toggle
    def toggle_task(self, task_id: int) -> Task:
        """Flip completed status of a task.

        Args:
            task_id: The ID of the task to toggle.

        Returns:
            The updated Task.

        Raises:
            TaskNotFoundError: If no task with task_id exists.
        """
        task = self.get_task(task_id)
        task.completed = not task.completed
        return task
