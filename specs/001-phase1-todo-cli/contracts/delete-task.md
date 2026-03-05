# Contract: Delete Task

**Operation**: Permanently remove a task by ID
**FR Reference**: FR-008, FR-009
**Logic method**: `TodoLogic.delete_task(task_id)`

## Input

| Parameter | Source | Type | Rules |
|---|---|---|---|
| `task_id` | `input("Task ID: ")` | `int` | Must parse to positive integer |

## Processing

1. Parse `task_id` from user input; raise `ValueError` on non-integer.
2. Look up `_tasks[task_id]`; raise `TaskNotFoundError` if absent.
3. `del _tasks[task_id]`.
4. `_next_id` is NOT decremented (no ID reuse per spec FR-003 + edge case).
5. Return `None`.

## Output (success)

```
Task [3] deleted.
```

## Error conditions

| Condition | Exception | CLI message |
|---|---|---|
| Non-integer input | `ValueError` | `Error: Please enter a valid task ID (number).` |
| ID does not exist | `TaskNotFoundError` | `Error: Task ID 3 not found.` |

## Post-delete state

- Deleted ID never reappears in list views.
- Subsequent `list_tasks()` call shows remaining tasks only.
- If all tasks are deleted, `list_tasks()` returns empty list → "No tasks found."
