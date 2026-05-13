---
id: 004
title: Phase 1 Todo CLI Full Implementation
stage: green
date: 2026-03-02
surface: agent
model: claude-sonnet-4-6
feature: 001-phase1-todo-cli
branch: 001-phase1-todo-cli
user: brownie
command: /sp.implement
labels: ["green","phase-1","todo-cli","python","pytest","sdd","implementation"]
links:
  spec: specs/001-phase1-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-cli/pyproject.toml
  - todo-cli/.gitignore
  - todo-cli/src/__init__.py
  - todo-cli/src/logic.py
  - todo-cli/src/cli.py
  - todo-cli/src/main.py
  - todo-cli/tests/__init__.py
  - todo-cli/tests/unit/__init__.py
  - todo-cli/tests/integration/__init__.py
  - todo-cli/tests/unit/test_logic.py
  - todo-cli/tests/unit/test_validation.py
  - todo-cli/CLAUDE.md
  - todo-cli/README.md
  - specs/001-phase1-todo-cli/tasks.md
  - specs/001-phase1-todo-cli/quickstart.md
tests:
  - todo-cli/tests/unit/test_logic.py
  - todo-cli/tests/unit/test_validation.py
---

## Prompt

Execute all tasks defined in `@/todo-cli/specs/phase1-tasks.md` for the Phase 1 In-Memory Python Console App.

STRICT IMPLEMENTATION RULES:
1. READ-BEFORE-WRITE: Before creating or modifying any files, read the current directory structure and the provided specifications (`/todo-cli/specs/`).
2. TASK MAPPING: Implement tasks sequentially (T-1.1 through T-1.8). You must include a comment at the top of every new file or significant logic block referencing the Task ID, e.g., `# [Task]: T-1.x`.
3. PHASE ISOLATION: All code must be placed strictly within `/todo-cli/src/`.
4. PYTHON STANDARDS: Use Python 3.13 features. Ensure all functions have type hints. Follow PEP8.
5. DECOUPLING: Keep the business logic in `logic.py` completely free of `input()` and `print()` calls. UI logic must reside in `cli.py`.
6. VERIFICATION: After implementing each logic task (T-1.3 to T-1.5), verify the internal state management before proceeding to the CLI integration tasks.

FILES TO CREATE:
- `/todo-cli/src/logic.py`: Contains the `Task` model and `TodoLogic` class.
- `/todo-cli/src/cli.py`: Contains formatting and user input handling.
- `/todo-cli/src/main.py`: The entry point script.
- `/todo-cli/CLAUDE.md`: Specific instructions for maintaining this phase.
- `/todo-cli/README.md`: Basic setup and usage instructions using `uv`.

## Response snapshot

All 36 tasks executed and verified. Complete implementation at todo-cli/:

src/logic.py: Task @dataclass, TaskNotFoundError, _validate_title(), TodoLogic with add_task/list_tasks/get_task/update_task/delete_task/toggle_task — zero I/O
src/cli.py: CLIHandler with run() loop, _show_menu(), _print_task_row(), _handle_add/list/toggle/update/delete — zero business logic
src/main.py: main() wiring TodoLogic + CLIHandler, if __name__ guard
tests/unit/test_logic.py: 29 tests covering all TodoLogic methods
tests/unit/test_validation.py: 7 boundary/invariant tests
CLAUDE.md + README.md: agent guidance and user docs

Test results: 36 passed in 0.13s ✅
All tasks.md tasks marked [x]. Quickstart.md validation checklist checked.

## Outcome

- ✅ Impact: Phase 1 fully implemented; interactive Todo CLI runnable via `uv run python -m src.main`
- 🧪 Tests: 36 passed — TestValidateTitle(6), TestTaskNotFoundError(2), TestTodoLogicAddTask(6), TestTodoLogicListTasks(2), TestTodoLogicToggleTask(3), TestTodoLogicUpdateTask(6), TestTodoLogicDeleteTask(4), TestTitleBoundaries(6), TestIDNeverReused(1)
- 📁 Files: 13 files created across todo-cli/
- 🔁 Next prompts: /sp.git.commit_pr to commit and create PR; or begin Phase 2 planning
- 🧠 Reflection: pyproject.toml required explicit `[tool.hatch.build.targets.wheel] packages = ["src"]` because hatchling cannot auto-detect when project name (todo-cli) doesn't match any src directory name

## Evaluation notes (flywheel)

- Failure modes observed: hatchling package auto-detection fails when project name ≠ package directory
- Graders run and results (PASS/FAIL): uv run pytest tests/ -v — 36 PASSED
- Prompt variant (if applicable): initial
- Next experiment: run app interactively with `uv run python -m src.main`
