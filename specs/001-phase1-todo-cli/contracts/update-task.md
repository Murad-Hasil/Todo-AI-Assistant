# Contract: Update Task

**Operation**: Modify the title and/or description of an existing task
**FR Reference**: FR-007, FR-009
**Logic method**: `TodoLogic.update_task(task_id, title=None, description=None)`

## Input

| Parameter | Source | Type | Rules |
|---|---|---|---|
| `task_id` | `input("Task ID: ")` | `int` | Must parse to positive integer |
| `title` | `input("New title (leave blank to keep current): ")` | `str \| None` | Optional; if provided, 1–200 chars after strip |
| `description` | `input("New description (leave blank to keep current): ")` | `str \| None` | Optional; empty blank retains current |

## Processing

1. Parse and validate `task_id`.
2. Look up task; raise `TaskNotFoundError` if absent.
3. If `title` provided (non-empty after strip): validate length 1–200; update field.
4. If `description` provided: update field (empty string is a valid new description).
5. Return updated `Task`.

## Blank-input semantics

- User presses Enter without typing → that field is **not updated** (current value retained).
- This is distinct from explicitly clearing a description (Phase 1 does not support
  explicit clearing; leaving blank = retain current).

## Output (success)

```
Task [2] updated.
  Title: Buy oat milk
  Description: Oat, not dairy
```

## Error conditions

| Condition | Exception | CLI message |
|---|---|---|
| Non-integer ID input | `ValueError` | `Error: Please enter a valid task ID (number).` |
| ID does not exist | `TaskNotFoundError` | `Error: Task ID 5 not found.` |
| New title is empty / whitespace-only | `ValueError` | `Error: Title is required (1-200 characters).` |
| New title > 200 chars | `ValueError` | `Error: Title must be 200 characters or fewer.` |
