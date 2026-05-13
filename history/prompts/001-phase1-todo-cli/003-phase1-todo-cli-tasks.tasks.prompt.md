---
id: 003
title: Phase 1 Todo CLI Task List
stage: tasks
date: 2026-03-02
surface: agent
model: claude-sonnet-4-6
feature: 001-phase1-todo-cli
branch: 001-phase1-todo-cli
user: brownie
command: /sp.tasks
labels: ["tasks","phase-1","todo-cli","python","cli","sdd","tdd"]
links:
  spec: specs/001-phase1-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase1-todo-cli/tasks.md
tests:
  - todo-cli/tests/unit/test_logic.py
  - todo-cli/tests/unit/test_validation.py
  - todo-cli/tests/integration/test_cli_flows.py
---

## Prompt

Generate a task list for Phase 1: In-Memory Python Console App in `/todo-cli/specs/phase1-tasks.md` based strictly on the approved plan `@/todo-cli/specs/phase1-plan.md`.

The task list must include:
1. TASK BREAKDOWN (Atomic Units):
   - T-1.1: Project Scaffolding (Create `/todo-cli/src/`, initialize `uv`, and create empty files).
   - T-1.2: Implement `Task` Data Model (Define the structure in `logic.py`).
   - T-1.3: Implement `TodoLogic` Class - Create/Read (Methods to add tasks and return the list).
   - T-1.4: Implement `TodoLogic` Class - Update/Delete (Methods to modify details and remove by ID).
   - T-1.5: Implement `TodoLogic` Class - Toggle Status (Method to mark complete/incomplete).
   - T-1.6: Implement `CLIHandler` - Display Logic (Formatting the task list for the terminal).
   - T-1.7: Implement `CLIHandler` - Input Logic (Parsing user commands and parameters).
   - T-1.8: Implement `Main` Entry Point (Wiring logic and CLI handler together).
2. VERIFICATION CRITERIA for each task.
3. DEPENDENCIES: Clearly state which tasks depend on previous ones.
4. LOGGING REQUIREMENT: Every task must include a placeholder for the Task ID in the implementation comments.

## Response snapshot

Generated tasks.md at `specs/001-phase1-todo-cli/tasks.md` with 36 tasks across 8 phases.

Phase breakdown:
- Phase 1 Setup (T001–T007): Directory tree, uv init, empty skeleton files — T-1.1
- Phase 2 Foundational (T008–T013): Task dataclass, TaskNotFoundError, _validate_title, TodoLogic.__init__, CLIHandler scaffold, _show_menu — T-1.2
- Phase 3 US1 Add (T014–T017): add_task, _handle_add, menu wire, main.py — T-1.3 Create + T-1.7 + T-1.8
- Phase 4 US2 List (T018–T021): list_tasks, _print_task_row, _handle_list, wire — T-1.3 Read + T-1.6
- Phase 5 US3 Toggle (T022–T024): toggle_task, _handle_toggle, wire — T-1.5 + T-1.7
- Phase 6 US4 Update (T025–T028): get_task, update_task, _handle_update, wire — T-1.4 Update + T-1.7
- Phase 7 US5 Delete (T029–T031): delete_task, _handle_delete, wire+quit — T-1.4 Delete + T-1.7
- Phase 8 Polish (T032–T036): unit tests, validation tests, README, quickstart validation, pytest run

T-1.x → Task ID cross-reference table included. Constitution logging requirement embedded.

## Outcome

- ✅ Impact: 36 executable tasks covering all 8 T-1.x user requirements; organized by user story
- 🧪 Tests: T032 (test_logic.py), T033 (test_validation.py) — unit tests defined as tasks
- 📁 Files: specs/001-phase1-todo-cli/tasks.md
- 🔁 Next prompts: /sp.implement to execute the task list
- 🧠 Reflection: Menu wiring tasks (T016, T021, T024, T028, T031) ensure each story is independently testable end-to-end after its phase completes

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A — tasks artifact
- Prompt variant (if applicable): initial
- Next experiment: run /sp.implement for 001-phase1-todo-cli
