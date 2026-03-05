# Contract: Add Task

**Operation**: Create a new task
**FR Reference**: FR-001, FR-002, FR-003, FR-004
**Logic method**: `TodoLogic.add_task(title, description="")`

## Input

| Parameter | Source | Type | Rules |
|---|---|---|---|
| `title` | `input("Title: ")` | `str` | Required; 1–200 chars after strip; non-empty after strip |
| `description` | `input("Description (optional): ")` | `str` | Optional; empty string if skipped |

## Processing

1. Strip `title` of leading/trailing whitespace.
2. Validate stripped `title`: length 1–200; raise `ValueError` if not.
3. Assign `id = _next_id`; increment `_next_id`.
4. Create `Task(id=..., title=stripped_title, description=description, completed=False)`.
5. Store in `_tasks[id]`.
6. Return created `Task`.

## Output (success)

```
Task added: [1] Buy groceries
```

## Output (validation error)

```
Error: Title is required (1-200 characters).
```

## Error conditions

| Condition | Exception | CLI message |
|---|---|---|
| Empty / whitespace-only title | `ValueError` | `Error: Title is required (1-200 characters).` |
| Title > 200 chars | `ValueError` | `Error: Title must be 200 characters or fewer.` |
