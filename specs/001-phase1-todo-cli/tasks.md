---
description: "Task list for Phase 1 — In-Memory Python Console Todo App"
---

# Tasks: Phase 1 — In-Memory Python Console Todo App

**Input**: Design documents from `specs/001-phase1-todo-cli/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Constitution reminder**: Every implementation file MUST include a comment on
the first line of each function/class in the format:
```python
# Task: T-1.X — <brief description>  (maps to tasks.md task ID)
```

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

## Path Conventions

All source code lives under `todo-cli/` (Phase Isolation — Constitution III).

```
todo-cli/src/logic.py    ← TodoLogic, Task, TaskNotFoundError, _validate_title
todo-cli/src/cli.py      ← CLIHandler and all private handlers
todo-cli/src/main.py     ← Entry point only
todo-cli/tests/unit/     ← Unit tests (pytest)
todo-cli/tests/integration/ ← CLI flow tests
```

---

## Phase 1: Setup — T-1.1 Project Scaffolding

**Purpose**: Create the full directory tree, initialize `uv`, and create empty
placeholder files. No business logic in this phase.

- [x] T001 Create todo-cli/ directory tree: `todo-cli/src/`, `todo-cli/tests/unit/`, `todo-cli/tests/integration/`
- [x] T002 Create `todo-cli/pyproject.toml` with `requires-python = ">=3.13"`, project name `todo-cli`, and `[dependency-groups] dev = ["pytest>=8"]`
- [x] T003 [P] Create `todo-cli/src/__init__.py` (empty — marks src as a package)
- [x] T004 [P] Create `todo-cli/src/logic.py` with module docstring: `"""Business logic layer — zero I/O. Task: T-1.2"""`
- [x] T005 [P] Create `todo-cli/src/cli.py` with module docstring: `"""CLI I/O layer — zero business logic. Task: T-1.6 / T-1.7"""`
- [x] T006 [P] Create `todo-cli/src/main.py` with module docstring: `"""Entry point. Task: T-1.8"""`
- [x] T007 [P] Create `todo-cli/tests/__init__.py`, `todo-cli/tests/unit/__init__.py`, `todo-cli/tests/integration/__init__.py` (all empty)

**Verification — Phase 1 done when**:
- `uv sync` runs without error from `todo-cli/`
- `uv run python -c "import src.logic; import src.cli; import src.main"` exits 0
- `uv run pytest tests/ --collect-only` exits 0 (no tests yet, but collection works)

---

## Phase 2: Foundational — T-1.2 Task Data Model

**Purpose**: Define the `Task` dataclass, `TaskNotFoundError`, validation helper,
and the `TodoLogic` container. This is the shared foundation for ALL user stories.

**⚠️ CRITICAL**: No user story work can begin until T008–T011 are complete.

- [x] T008 Implement `Task` `@dataclass` with fields `id: int`, `title: str`, `description: str = ""`, `completed: bool = False` in `todo-cli/src/logic.py`
- [x] T009 Implement `TaskNotFoundError(ValueError)` with `__init__(self, task_id: int)` that calls `super().__init__(f"Task ID {task_id} not found.")` and stores `self.task_id` in `todo-cli/src/logic.py`
- [x] T010 Implement `_validate_title(title: str) -> str` — strips whitespace, raises `ValueError("Title is required (1-200 characters).")` if empty, raises `ValueError("Title must be 200 characters or fewer.")` if > 200, else returns stripped title — in `todo-cli/src/logic.py`
- [x] T011 Implement `TodoLogic` class with `__init__` setting `self._tasks: dict[int, Task] = {}` and `self._next_id: int = 1` in `todo-cli/src/logic.py`
- [x] T012 Implement `CLIHandler` class with `__init__(self, logic: TodoLogic) -> None` storing `self._logic = logic`, and `run(self) -> None` scaffold (empty loop body printing "Not yet implemented") in `todo-cli/src/cli.py`
- [x] T013 Implement `_show_menu(self) -> None` private method in `CLIHandler` that prints the 6-line numbered menu (0. Quit through 5. Delete task) in `todo-cli/src/cli.py`

**Checkpoint — Foundational done when**:
- `TodoLogic()` instantiates with `_tasks == {}` and `_next_id == 1`
- `TaskNotFoundError(5)` produces message `"Task ID 5 not found."`
- `_validate_title("")` raises `ValueError`
- `_validate_title("a" * 201)` raises `ValueError`
- `_validate_title("  hello  ")` returns `"hello"`
- `CLIHandler(TodoLogic())` instantiates without error

---

## Phase 3: User Story 1 — Add a Task (Priority: P1) 🎯 MVP

**Goal**: User can create a task with a validated title and optional description.
The system assigns an auto-incremented integer ID and confirms creation.

**User story maps to**: T-1.3 (Create) + T-1.7 (Input — add handler)

**Independent Test**: Run `uv run python -m src.main`, choose option 1, enter
"Buy milk", press Enter for description, verify output contains "Task added: [1]".

- [x] T014 [US1] Implement `TodoLogic.add_task(self, title: str, description: str = "") -> Task` — call `_validate_title`, create `Task`, store in `_tasks`, increment `_next_id`, return task — in `todo-cli/src/logic.py`
- [x] T015 [US1] Implement `CLIHandler._handle_add(self) -> None` — prompt `"Title: "` and `"Description (optional): "`, call `self._logic.add_task()`, print `f"Task added: [{task.id}] {task.title}"`, catch `ValueError` and print `f"Error: {e}"` — in `todo-cli/src/cli.py`
- [x] T016 [US1] Wire `_handle_add` into `run()` loop: map menu choice `"1"` → `self._handle_add()` in `todo-cli/src/cli.py`
- [x] T017 [US1] Implement `main()` function in `todo-cli/src/main.py`: instantiate `TodoLogic`, pass to `CLIHandler`, call `handler.run()`; add `if __name__ == "__main__": main()`

**Checkpoint — US1 done when**:
- `logic.add_task("Buy milk")` returns `Task(id=1, title="Buy milk", completed=False)`
- `logic.add_task("")` raises `ValueError`
- `logic.add_task("a" * 201)` raises `ValueError`
- `logic.add_task("  test  ")` returns task with `title == "test"` (stripped)
- `logic.add_task("First"); logic.add_task("Second")` → IDs are 1 and 2
- App runs end-to-end: `uv run python -m src.main` → choose 1 → add task → see confirmation

---

## Phase 4: User Story 2 — List All Tasks (Priority: P2)

**Goal**: User sees a formatted list of all tasks with ID, status indicator, and
title. Empty state shows "No tasks found." Description shown if non-empty.

**User story maps to**: T-1.3 (Read) + T-1.6 (Display logic)

**Independent Test**: Add 2 tasks (one toggled complete), choose option 2,
verify `[ ]` and `[x]` indicators appear, IDs and titles are correct.

- [x] T018 [US2] Implement `TodoLogic.list_tasks(self) -> list[Task]` — return `list(self._tasks.values())` (empty list if none) — in `todo-cli/src/logic.py`
- [x] T019 [P] [US2] Implement `CLIHandler._print_task_row(self, task: Task) -> None` — print `f"{task.id:>3}  {'[x]' if task.completed else '[ ]'}  {task.title}"` and if `task.description` print it indented 9 spaces — in `todo-cli/src/cli.py`
- [x] T020 [US2] Implement `CLIHandler._handle_list(self) -> None` — call `self._logic.list_tasks()`, print `"=== Your Tasks ==="` header, call `_print_task_row` per task, or print `"No tasks found."` if empty — in `todo-cli/src/cli.py`
- [x] T021 [US2] Wire `_handle_list` into `run()` loop: map menu choice `"2"` → `self._handle_list()` in `todo-cli/src/cli.py`

**Checkpoint — US2 done when**:
- `logic.list_tasks()` returns `[]` for empty store
- After `add_task("Buy milk", "Eggs too")`, `list_tasks()` returns 1-item list
- `_print_task_row(Task(id=1, title="Buy milk", completed=False))` prints `  1  [ ] Buy milk`
- Choosing option 2 with no tasks prints `"No tasks found."`
- Choosing option 2 with 2 tasks prints both rows with correct indicators

---

## Phase 5: User Story 3 — Toggle Task Completion (Priority: P3)

**Goal**: User enters a task ID; the system flips `completed` status. Reverts on
second toggle. Non-existent ID prints an error without crashing.

**User story maps to**: T-1.5 + T-1.7 (Input — toggle handler)

**Independent Test**: Add task (ID=1), toggle it (`[x]`), toggle again (`[ ]`).
Try ID 99 → "Error: Task ID 99 not found."

- [x] T022 [US3] Implement `TodoLogic.toggle_task(self, task_id: int) -> Task` — raise `TaskNotFoundError` if absent, else flip `task.completed = not task.completed`, return updated task — in `todo-cli/src/logic.py`
- [x] T023 [US3] Implement `CLIHandler._handle_toggle(self) -> None` — prompt `"Task ID: "`, parse int (catch `ValueError` for non-integer input), call `self._logic.toggle_task()`, print `f"Task [{task.id}] marked as {'complete [x]' if task.completed else 'pending [ ]'}."`, catch `TaskNotFoundError` and print `f"Error: {e}"` — in `todo-cli/src/cli.py`
- [x] T024 [US3] Wire `_handle_toggle` into `run()` loop: map menu choice `"3"` → `self._handle_toggle()` in `todo-cli/src/cli.py`

**Checkpoint — US3 done when**:
- `logic.toggle_task(1)` on pending task → `completed == True`
- `logic.toggle_task(1)` again → `completed == False`
- `logic.toggle_task(99)` raises `TaskNotFoundError`
- Choosing option 3 with valid ID prints status confirmation
- Choosing option 3 with ID 99 prints `"Error: Task ID 99 not found."`

---

## Phase 6: User Story 4 — Update a Task (Priority: P4)

**Goal**: User selects a task by ID and can change its title and/or description.
Leaving a field blank retains the current value. Invalid title rejected.

**User story maps to**: T-1.4 (Update) + T-1.7 (Input — update handler)

**Independent Test**: Add task "Buy milk", update title to "Buy oat milk", list
tasks → new title shown; original ID unchanged.

- [x] T025 [US4] Implement `TodoLogic.get_task(self, task_id: int) -> Task` — return `_tasks[task_id]` or raise `TaskNotFoundError` — in `todo-cli/src/logic.py`
- [x] T026 [US4] Implement `TodoLogic.update_task(self, task_id: int, title: str | None = None, description: str | None = None) -> Task` — raise `TaskNotFoundError` if absent; if `title` provided, validate and update; if `description` provided, update; return task — in `todo-cli/src/logic.py`
- [x] T027 [US4] Implement `CLIHandler._handle_update(self) -> None` — prompt ID, then `"New title (blank = keep):"` and `"New description (blank = keep):"`, pass non-empty values to `self._logic.update_task()`, print updated fields, catch `ValueError` and `TaskNotFoundError` — in `todo-cli/src/cli.py`
- [x] T028 [US4] Wire `_handle_update` into `run()` loop: map menu choice `"4"` → `self._handle_update()` in `todo-cli/src/cli.py`

**Checkpoint — US4 done when**:
- `logic.update_task(1, title="New Title")` updates title, preserves description
- `logic.update_task(1, description="New desc")` updates description, preserves title
- `logic.update_task(1, title="")` raises `ValueError`
- `logic.update_task(99)` raises `TaskNotFoundError`
- Choosing option 4: blank title input retains original; valid new title updates

---

## Phase 7: User Story 5 — Delete a Task (Priority: P5)

**Goal**: User enters an ID; the task is permanently removed. Deleted IDs are
never reused. Non-existent ID prints an error.

**User story maps to**: T-1.4 (Delete) + T-1.7 (Input — delete handler)

**Independent Test**: Add 2 tasks, delete ID 1, list → only ID 2 remains,
ID 1 never reappears after adding a third task (next ID is 3).

- [x] T029 [US5] Implement `TodoLogic.delete_task(self, task_id: int) -> None` — raise `TaskNotFoundError` if absent, else `del self._tasks[task_id]` (do NOT touch `_next_id`) — in `todo-cli/src/logic.py`
- [x] T030 [US5] Implement `CLIHandler._handle_delete(self) -> None` — prompt `"Task ID: "`, parse int, call `self._logic.delete_task()`, print `f"Task [{task_id}] deleted."`, catch `ValueError` (non-integer) and `TaskNotFoundError` — in `todo-cli/src/cli.py`
- [x] T031 [US5] Wire `_handle_delete` into `run()` loop: map menu choice `"5"` → `self._handle_delete()` and `"0"` → print `"Goodbye!"` then `break` — in `todo-cli/src/cli.py`

**Checkpoint — US5 done when**:
- `logic.delete_task(1)` removes task; `list_tasks()` no longer contains it
- After deleting ID 1 and adding a new task → new task ID is 2 (not 1 reused)
- `logic.delete_task(99)` raises `TaskNotFoundError`
- All 5 stories fully functional end-to-end via interactive menu

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Tests, documentation, and final validation. All user stories must
be complete before starting this phase.

- [x] T032 [P] Write unit tests for `TodoLogic` in `todo-cli/tests/unit/test_logic.py`: test `add_task` success, `list_tasks` empty/populated, `toggle_task` both directions, `update_task` title/description/partial, `delete_task` success
- [x] T033 [P] Write validation unit tests in `todo-cli/tests/unit/test_validation.py`: test empty title, whitespace-only title, title of exactly 1 char, title of exactly 200 chars, title of 201 chars, `TaskNotFoundError` message format
- [x] T034 [P] Write `todo-cli/README.md` covering: prerequisites, `uv sync`, `uv run python -m src.main`, all 5 operations with sample output
- [x] T035 Complete quickstart.md validation checklist at `specs/001-phase1-todo-cli/quickstart.md` — check off all 10 items manually
- [x] T036 Run `uv run pytest tests/ -v` from `todo-cli/` and confirm all tests pass with exit code 0

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 — Add)**: Depends on Phase 2 — first unblocked user story
- **Phase 4 (US2 — List)**: Depends on Phase 2; integrates with Phase 3 results
- **Phase 5 (US3 — Toggle)**: Depends on Phase 2; requires US1 to test
- **Phase 6 (US4 — Update)**: Depends on Phase 2; requires US1 to test
- **Phase 7 (US5 — Delete)**: Depends on Phase 2; requires US1 to test
- **Phase 8 (Polish)**: Depends on ALL user stories complete

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|---|---|---|
| US1 — Add | Phase 2 complete | — |
| US2 — List | Phase 2 complete | US1 (different methods) |
| US3 — Toggle | Phase 2 complete | US2, US4, US5 (different methods) |
| US4 — Update | Phase 2 complete | US2, US3, US5 (different methods) |
| US5 — Delete | Phase 2 complete | US2, US3, US4 (different methods) |

### Within Each User Story

- Logic method MUST be implemented before CLI handler (handler calls logic)
- CLI handler MUST be implemented before menu wiring
- Menu wiring MUST complete before end-to-end test passes

### T-1.x → Task ID Cross-Reference

| User task | Task IDs |
|---|---|
| T-1.1 Project Scaffolding | T001–T007 |
| T-1.2 Task Data Model | T008–T013 |
| T-1.3 TodoLogic Create/Read | T014–T018 |
| T-1.4 TodoLogic Update/Delete | T025–T031 |
| T-1.5 TodoLogic Toggle | T022–T024 |
| T-1.6 CLIHandler Display | T019–T021 |
| T-1.7 CLIHandler Input | T015–T016, T020–T021, T023–T024, T027–T028, T030–T031 |
| T-1.8 Main Entry Point | T017, T035–T036 |

---

## Parallel Execution Examples

### Phase 2: Foundational (within phase)

```bash
# These can be implemented concurrently (all in logic.py but non-overlapping):
Task: "T008 — Task @dataclass"          # top of file
Task: "T009 — TaskNotFoundError class"  # after Task
Task: "T010 — _validate_title function" # standalone function
# T011 depends on T008 + T010; T012-T013 depend on T011
```

### After Phase 2: User Stories in parallel

```bash
# All US2–US5 logic methods can be written in parallel (same file, non-overlapping methods):
Task: "T018 — list_tasks()"     # US2
Task: "T022 — toggle_task()"    # US3
Task: "T025–T026 — update_task()" # US4
Task: "T029 — delete_task()"    # US5
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T013) — CRITICAL, blocks all stories
3. Complete Phase 3: US1 Add a Task (T014–T017)
4. **STOP and VALIDATE**: `uv run python -m src.main` → add task → see confirmation
5. Demo-able as a 1-operation app

### Incremental Delivery

1. Foundation → US1 (add) → demo ✅
2. Add US2 (list) → now tasks are visible → demo ✅
3. Add US3 (toggle) → now tasks can be completed → demo ✅
4. Add US4 (update) → now tasks can be corrected → demo ✅
5. Add US5 (delete) → full feature set → demo ✅
6. Phase 8 polish → tests pass, docs complete → Phase 1 closed ✅

---

## Notes

- `[P]` tasks = different files or non-overlapping functions — safe to parallelize
- Every function/class MUST include `# Task: T-1.X — <description>` comment
- `_validate_title` is a module-level function, not a method — keeps Task pure
- `CLIHandler` MUST import `TaskNotFoundError` from `src.logic` to catch it specifically
- Run `uv run pytest tests/ -v` after each phase checkpoint
- Phase 1 is NOT closed until T036 (all tests pass) is checked off
