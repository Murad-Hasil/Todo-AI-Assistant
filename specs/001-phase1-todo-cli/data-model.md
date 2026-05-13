# Data Model: Phase 1 — In-Memory Python Console Todo App

**Branch**: `001-phase1-todo-cli` | **Date**: 2026-03-02

## Entities

### Task

The sole entity in Phase 1. Represents a single unit of work.

```python
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Task:
    id: int
    title: str
    description: str = field(default="")
    completed: bool = field(default=False)
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | `int` | Yes | Unique; monotonically increasing from 1; never reused |
| `title` | `str` | Yes | 1–200 characters; stripped of leading/trailing whitespace; non-empty after strip |
| `description` | `str` | No | No enforced length in Phase 1; defaults to `""` |
| `completed` | `bool` | No | `False` = pending; `True` = complete; defaults to `False` |

**Validation rules** (enforced in `TodoLogic`, not in `Task` itself):
- `title.strip()` MUST have length ≥ 1
- `title.strip()` MUST have length ≤ 200
- Whitespace-only `title` MUST raise `ValueError`

**State transitions**:
```
pending (completed=False)  ←──toggle──→  complete (completed=True)
```

---

## Storage

### `TodoLogic` internal store

```python
_tasks: dict[int, Task]   # keyed by task.id
_next_id: int             # starts at 1; increments on every successful add
```

- Lookup by ID: O(1)
- List all tasks: O(n), ordered by insertion (dict preserves insertion order,
  Python 3.7+)
- Delete: removes key from dict; `_next_id` does NOT decrement (no ID reuse)

---

## Component Interfaces

### `TaskNotFoundError`

```python
class TaskNotFoundError(ValueError):
    """Raised when an operation targets a task ID that does not exist."""
    def __init__(self, task_id: int) -> None:
        super().__init__(f"Task ID {task_id} not found.")
        self.task_id = task_id
```

### `TodoLogic` — Public API

```python
class TodoLogic:
    def add_task(self, title: str, description: str = "") -> Task:
        """Validate, create, store, and return a new Task.
        Raises ValueError if title is empty or exceeds 200 chars.
        """

    def list_tasks(self) -> list[Task]:
        """Return all tasks in insertion order. Empty list if none."""

    def get_task(self, task_id: int) -> Task:
        """Return the Task for task_id.
        Raises TaskNotFoundError if task_id does not exist.
        """

    def update_task(
        self,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """Update title and/or description of an existing task.
        Raises TaskNotFoundError if task_id does not exist.
        Raises ValueError if the new title is empty or exceeds 200 chars.
        Returns the updated Task.
        """

    def delete_task(self, task_id: int) -> None:
        """Remove a task by ID.
        Raises TaskNotFoundError if task_id does not exist.
        """

    def toggle_task(self, task_id: int) -> Task:
        """Flip completed status of a task.
        Raises TaskNotFoundError if task_id does not exist.
        Returns the updated Task.
        """
```

**Invariants**:
- No `print()`, `input()`, or any I/O statement MUST appear in `TodoLogic`.
- All validation MUST happen inside `TodoLogic` before mutating state.
- `_next_id` MUST never decrement after a delete.

### `CLIHandler` — Responsibilities

```python
class CLIHandler:
    def __init__(self, logic: TodoLogic) -> None: ...

    def run(self) -> None:
        """Start the interactive menu loop. Exits on user choice 'quit'."""
```

**Internal helpers** (private, not part of public contract):
- `_show_menu() -> None` — print numbered menu
- `_handle_add() -> None` — prompt title + description, call `logic.add_task()`
- `_handle_list() -> None` — call `logic.list_tasks()`, format and print rows
- `_handle_toggle() -> None` — prompt ID, call `logic.toggle_task()`
- `_handle_update() -> None` — prompt ID + new values, call `logic.update_task()`
- `_handle_delete() -> None` — prompt ID, call `logic.delete_task()`
- `_print_task_row(task: Task) -> None` — format single task row

**Invariants**:
- No business logic MUST appear in `CLIHandler`.
- All exceptions from `TodoLogic` MUST be caught in `CLIHandler` and converted
  to user-readable terminal messages.
- `CLIHandler` MUST NOT mutate `Task` objects directly.

### `main.py` — Entry Point

```python
from todo_cli.logic import TodoLogic
from todo_cli.cli import CLIHandler


def main() -> None:
    logic = TodoLogic()
    handler = CLIHandler(logic)
    handler.run()


if __name__ == "__main__":
    main()
```

---

## Output Format

### List Tasks row format

```
[ID]  [ ] Title
      Description (if non-empty, indented 6 spaces)

[ID]  [x] Title
```

Example:
```
  1  [ ] Buy groceries
       Milk, eggs, bread

  2  [x] Submit report
```

### Status indicators

| Value | Indicator |
|---|---|
| `completed=False` | `[ ]` |
| `completed=True` | `[x]` |

### Menu format

```
=== Todo CLI ===
1. Add task
2. List tasks
3. Toggle complete
4. Update task
5. Delete task
0. Quit
> 
```
