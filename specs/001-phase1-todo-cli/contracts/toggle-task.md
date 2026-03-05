# Contract: Toggle Task Completion

**Operation**: Flip a task's completion status (pending ↔ complete)
**FR Reference**: FR-006, FR-009
**Logic method**: `TodoLogic.toggle_task(task_id)`

## Input

| Parameter | Source | Type | Rules |
|---|---|---|---|
| `task_id` | `input("Task ID: ")` | `int` | Must parse to a positive integer |

## Processing

1. Parse `task_id` from user input; raise `ValueError` on non-integer.
2. Look up `_tasks[task_id]`; raise `TaskNotFoundError` if absent.
3. Flip `task.completed = not task.completed`.
4. Return updated `Task`.

## Output (success — marked complete)

```
Task [1] marked as complete. [x]
```

## Output (success — reverted to pending)

```
Task [1] marked as pending. [ ]
```

## Error conditions

| Condition | Exception | CLI message |
|---|---|---|
| Non-integer input | `ValueError` | `Error: Please enter a valid task ID (number).` |
| ID does not exist | `TaskNotFoundError` | `Error: Task ID 99 not found.` |
