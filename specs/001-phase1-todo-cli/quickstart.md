# Quickstart: Phase 1 — In-Memory Python Console Todo App

**Branch**: `001-phase1-todo-cli` | **Date**: 2026-03-02

## Prerequisites

- WSL 2 (Ubuntu 22.04)
- Python 3.13+ (`python3 --version`)
- `uv` installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Setup

```bash
# 1. Navigate to the app directory
cd /todo-cli

# 2. Create a uv-managed virtual environment and install dev dependencies
uv sync

# 3. Verify Python version
uv run python --version   # should print Python 3.13.x
```

## Run the App

```bash
# From /todo-cli
uv run python -m src.main
```

You will see:

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

## Run Tests

```bash
# From /todo-cli
uv run pytest tests/ -v
```

## Try the Core Flows

### Add a task

```
> 1
Title: Buy groceries
Description (optional): Milk, eggs, bread
Task added: [1] Buy groceries
```

### List tasks

```
> 2
=== Your Tasks ===
  1  [ ] Buy groceries
       Milk, eggs, bread
```

### Toggle completion

```
> 3
Task ID: 1
Task [1] marked as complete. [x]
```

### Update a task

```
> 4
Task ID: 1
New title (leave blank to keep current): Buy oat milk
New description (leave blank to keep current):
Task [1] updated.
  Title: Buy oat milk
  Description: Milk, eggs, bread
```

### Delete a task

```
> 5
Task ID: 1
Task [1] deleted.
```

### Quit

```
> 0
Goodbye!
```

## Validation Quickstart Checklist

Run each step and confirm the stated outcome before closing Phase 1:

- [x] App launches and shows main menu
- [x] Add task with title "A" (1 char) → succeeds with ID 1
- [x] Add task with empty title → "Error: Title is required (1-200 characters)."
- [x] List tasks → shows both status indicators correctly
- [x] Toggle ID 1 → `[x]`; toggle again → `[ ]`
- [x] Update ID 1 title → new title visible in list
- [x] Delete ID 1 → "Task [1] deleted."; list shows "No tasks found." if only task
- [x] Toggle/update/delete non-existent ID 99 → "Error: Task ID 99 not found."
- [x] `uv run pytest tests/ -v` → all tests pass
