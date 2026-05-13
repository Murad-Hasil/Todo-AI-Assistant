# Todo Dashboard — Phase 2.3

**Feature**: `004-nextjs-frontend`
**Created**: 2026-03-03

## Page: `/dashboard`

The main task management screen. Visible only to authenticated users.

## Layout (Desktop)

```
┌─────────────────────────────────────────────┐
│  ☑ My Tasks                    [Sign Out]   │  ← Nav bar
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Task title...         [Description] │    │  ← Add Task Form
│  │                        [Add Task ▶] │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [All]  [Pending]  [Completed]              │  ← Filter Bar
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ☐  Buy groceries        Jan 15 [✎][✕]│    │  ← Task Item
│  │ ☐  Book dentist         Jan 12 [✎][✕]│    │
│  │ ☑  Call mom             Jan 10 [✎][✕]│    │  ← Completed task
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Add Task Form

| Element | Behaviour |
|---------|-----------|
| Title input | Required; max 200 chars; shows char counter near limit; prevents submission if empty |
| Description input | Optional; multi-line textarea |
| Submit button | Shows loading spinner while request is in flight; disabled on empty title |
| On success | Form clears; new task appears at top of list |
| On error | Error banner appears; form inputs retain their values |

## Task List

Each task row displays:

| Field | Display |
|-------|---------|
| Completion checkbox | Checked = completed; click toggles status |
| Title | Strike-through style when completed |
| Creation date | Formatted as "MMM DD" (e.g., "Jan 15") |
| Edit button | Opens inline edit mode or a modal |
| Delete button | Removes task immediately; shows brief confirmation or undo option |

**Empty state**: When the list is empty (or filter yields no results), show:
> "No tasks here. Add one above!"

**Loading state**: While fetching initial task list, show skeleton loading rows (not a spinner that blocks the whole page).

## Edit Task

- Clicking edit replaces the task row with an editable form (inline edit preferred over modal).
- Fields: Title (required), Description (optional).
- Confirm button saves changes; Cancel button discards changes.
- On save success: updated task reflected immediately in the list.

## Filter Bar

| Tab | Shows |
|-----|-------|
| All (default) | All tasks regardless of status |
| Pending | Only tasks where `completed = false` |
| Completed | Only tasks where `completed = true` |

- Active tab is visually highlighted.
- Filter can be applied via API query parameter (`?status=pending`) or client-side (filter already-fetched data).
- When switching filters, the task list updates without a full page reload.

## Navigation Bar

- App title / logo on the left.
- User email or avatar on the right.
- Sign Out button on the right.

## Mobile Layout

On screens < 640px:

- Add Task Form stacks vertically (full-width inputs, full-width button).
- Filter tabs displayed as pill tabs scrollable horizontally.
- Task item actions (edit/delete) always visible (no hover-only behaviour).
- Nav bar collapses to title + hamburger or title + sign-out icon only.
