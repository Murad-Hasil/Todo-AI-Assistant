# Contract: List Tasks

**Operation**: Display all tasks with status indicators
**FR Reference**: FR-005
**Logic method**: `TodoLogic.list_tasks()`

## Input

None. Operation requires no user-supplied parameters.

## Processing

1. Return `list(_tasks.values())` in insertion order.
2. If list is empty, return `[]`.

## Output (non-empty list)

```
=== Your Tasks ===
  1  [ ] Buy groceries
       Milk, eggs, bread

  2  [x] Submit report

  3  [ ] Call dentist
```

Row format:
```
{id:>3}  {status}  {title}
         {description}   ← only printed if non-empty; indented 9 spaces
```

## Output (empty list)

```
No tasks found.
```

## Error conditions

None. `list_tasks()` never raises.
