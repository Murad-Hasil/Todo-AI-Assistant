# Feature Specification: Phase 1 — In-Memory Python Console Todo App

**Feature Branch**: `001-phase1-todo-cli`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Phase 1 In-Memory Python Console Todo App (PDF pages 5–6)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add a Task (Priority: P1)

A user wants to capture a new task by providing a title and an optional
description. The system assigns the task a unique ID and confirms creation.
This is the foundational operation; without it no other story is testable.

**Why this priority**: Every other operation depends on tasks existing. This
story alone constitutes a minimal viable demonstration of the application.

**Independent Test**: Run the app, choose "Add Task", enter a valid title,
observe a success message containing the new task ID. No other stories need
to be implemented.

**Acceptance Scenarios**:

1. **Given** the app is running and the task list is empty, **When** the user
   provides a title of 1–200 characters and presses Enter, **Then** the system
   creates the task, assigns a unique integer ID starting at 1, and prints a
   confirmation message including the ID.
2. **Given** the task list already has 3 tasks, **When** the user adds a new
   task, **Then** the new task receives the next sequential integer ID (4) and
   appears in subsequent list views.
3. **Given** the user provides a title of 0 characters (empty), **When** they
   submit the form, **Then** the system rejects the input with a clear error
   message and does not create a task.
4. **Given** the user provides a title exceeding 200 characters, **When** they
   submit the form, **Then** the system rejects the input and states the
   maximum allowed length.
5. **Given** the user leaves the description blank, **When** they submit,
   **Then** the task is created successfully with an empty description.

---

### User Story 2 — List All Tasks (Priority: P2)

A user wants to view all current tasks in a formatted list that clearly shows
each task's ID, title, and completion status, allowing them to decide on next
actions.

**Why this priority**: Task visibility is required to use any other operation
(update, delete, toggle). A list with status indicators also serves as the
primary feedback loop for the user.

**Independent Test**: Add 2–3 tasks, then run List Tasks. Verify each row
shows `ID | Status | Title` and that pending tasks show `[ ]` while complete
tasks show `[x]`.

**Acceptance Scenarios**:

1. **Given** the task list has 3 tasks in various states, **When** the user
   selects "List Tasks", **Then** the output shows one row per task with the
   format: `ID | [ ] or [x] | Title`.
2. **Given** the task list is empty, **When** the user selects "List Tasks",
   **Then** the system prints a clear "No tasks found." message instead of an
   empty table.
3. **Given** a task has a description, **When** listed, **Then** the
   description is visible below the title (or inline) without truncation.

---

### User Story 3 — Toggle Task Completion (Priority: P3)

A user wants to mark a task as complete or revert it to pending by providing
its ID. The status change is reflected immediately in subsequent list views.

**Why this priority**: Completing tasks is the core value proposition of a
Todo app. Comes after list because users need to see IDs to know what to
toggle.

**Independent Test**: Add a task, list it (ID visible, status `[ ]`), toggle
it, list again (status `[x]`), toggle again, list (status `[ ]` again).

**Acceptance Scenarios**:

1. **Given** task ID 1 is pending (`[ ]`), **When** the user toggles ID 1,
   **Then** the system changes status to complete (`[x]`) and confirms the
   change.
2. **Given** task ID 1 is complete (`[x]`), **When** the user toggles ID 1,
   **Then** the system reverts it to pending (`[ ]`) and confirms.
3. **Given** the user enters ID 99 which does not exist, **When** they
   attempt a toggle, **Then** the system prints "Task ID 99 not found." and
   takes no action.

---

### User Story 4 — Update a Task (Priority: P4)

A user wants to correct or refine the title or description of an existing
task by specifying its ID and the new values.

**Why this priority**: Data quality feature; valuable but non-blocking for
basic usage. Depends on tasks existing (P1) and IDs being known (P2).

**Independent Test**: Add a task, note its ID, update the title, list all
tasks, verify the title changed and the ID is unchanged.

**Acceptance Scenarios**:

1. **Given** task ID 2 exists with title "Buy milk", **When** the user updates
   title to "Buy oat milk", **Then** the task's title changes and ID is
   preserved.
2. **Given** task ID 2 exists, **When** the user updates only the description
   (leaving title unchanged), **Then** only the description changes.
3. **Given** the user provides an empty string for the new title, **When**
   they submit, **Then** the system rejects the update with a validation
   error and the task remains unchanged.
4. **Given** the user enters a non-existent ID, **When** they attempt to
   update, **Then** the system prints "Task ID X not found." and takes no
   action.

---

### User Story 5 — Delete a Task (Priority: P5)

A user wants to permanently remove a task by its ID. The task disappears from
all future list views.

**Why this priority**: Housekeeping feature; important for completeness but
lowest priority among the five because missing tasks from a list is a less
urgent need than the core add/view/complete cycle.

**Independent Test**: Add 2 tasks, delete one by ID, list all tasks, verify
only 1 task remains and the deleted ID does not appear.

**Acceptance Scenarios**:

1. **Given** task ID 3 exists, **When** the user deletes ID 3, **Then** the
   system removes it and prints "Task ID 3 deleted."
2. **Given** task ID 3 is deleted, **When** the user lists all tasks,
   **Then** ID 3 no longer appears in the output.
3. **Given** the user enters a non-existent ID, **When** they attempt to
   delete, **Then** the system prints "Task ID X not found." and takes no
   action.
4. **Given** the last remaining task is deleted, **When** the user lists
   tasks, **Then** "No tasks found." is displayed.

---

### Edge Cases

- **Empty list operations**: List, toggle, update, and delete on an empty
  store MUST produce a meaningful message, not a crash or silent failure.
- **ID reuse after deletion**: Deleted IDs MUST NOT be reused in Phase 1.
  IDs always increment monotonically.
- **Title at boundary lengths**: Titles of exactly 1 and exactly 200
  characters MUST be accepted; 0 and 201 MUST be rejected.
- **Whitespace-only title**: A title consisting solely of spaces MUST be
  treated as empty and rejected.
- **Concurrent sessions**: Not applicable in Phase 1 (single-process,
  in-memory only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a task title between 1 and 200 characters
  (inclusive). Whitespace-only titles MUST be treated as empty.
- **FR-002**: System MUST accept an optional task description with no
  enforced length limit in Phase 1.
- **FR-003**: System MUST generate a unique, monotonically incrementing
  integer ID for each new task, starting at 1.
- **FR-004**: System MUST store all tasks in an in-memory data structure
  (list or dictionary) for the duration of the runtime session. No data
  persistence between sessions is required in Phase 1.
- **FR-005**: System MUST display a task list showing at minimum: ID, status
  indicator (`[ ]` pending / `[x]` complete), and title per row.
- **FR-006**: System MUST allow toggling a task's completion status by ID,
  supporting both pending→complete and complete→pending transitions.
- **FR-007**: System MUST allow updating a task's title and/or description
  by ID.
- **FR-008**: System MUST allow deleting a task by ID.
- **FR-009**: System MUST handle non-existent IDs for toggle, update, and
  delete by printing a clear error message and taking no other action.
- **FR-010**: System MUST provide a CLI interface with a discoverable main
  menu or subcommands listing the available operations.

### Key Entities

- **Task**: The core unit of work. Attributes: unique integer ID, title
  (1–200 chars, required), description (optional string), status
  (pending or complete). Has no relationships to other entities in Phase 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new task can be created in under 10 seconds by a first-time
  user without consulting documentation.
- **SC-002**: All tasks are visible in a single list view; no scrolling or
  pagination required for stores of up to 100 tasks.
- **SC-003**: Every delete and update operation returns either a success
  confirmation or an explicit "not found" message — no silent failures and
  no unhandled exceptions.
- **SC-004**: All 5 core operations (add, list, toggle, update, delete) are
  accessible from the main menu or help text without additional navigation.
- **SC-005**: The application handles a store of 100 tasks with no
  perceptible slowdown (operations complete in under 1 second on a standard
  developer machine).
- **SC-006**: Validation errors include enough context for the user to
  correct the input on the next attempt without external help.

## Assumptions

- Data does not need to survive application restarts; in-memory storage is
  sufficient for Phase 1.
- A single user interacts with the app in a single terminal session at a
  time; concurrency is out of scope.
- Standard Python `print()` and `input()` are sufficient for UI; no
  third-party TUI libraries required.
- The app ships with Python 3.13+ type hints enabled (`from __future__ import
  annotations` where needed); no runtime type checking libraries required.
