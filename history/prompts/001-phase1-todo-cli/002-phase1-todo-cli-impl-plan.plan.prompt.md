---
id: 002
title: Phase 1 Todo CLI Implementation Plan
stage: plan
date: 2026-03-02
surface: agent
model: claude-sonnet-4-6
feature: 001-phase1-todo-cli
branch: 001-phase1-todo-cli
user: brownie
command: /sp.plan
labels: ["plan","phase-1","todo-cli","python","dataclass","cli","sdd"]
links:
  spec: specs/001-phase1-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase1-todo-cli/plan.md
  - specs/001-phase1-todo-cli/research.md
  - specs/001-phase1-todo-cli/data-model.md
  - specs/001-phase1-todo-cli/quickstart.md
  - specs/001-phase1-todo-cli/contracts/add-task.md
  - specs/001-phase1-todo-cli/contracts/list-tasks.md
  - specs/001-phase1-todo-cli/contracts/toggle-task.md
  - specs/001-phase1-todo-cli/contracts/update-task.md
  - specs/001-phase1-todo-cli/contracts/delete-task.md
tests:
  - null
---

## Prompt

Generate the technical plan for Phase 1: In-Memory Python Console App in `/todo-cli/specs/phase1-plan.md` based strictly on the approved spec `@/todo-cli/specs/phase1-cli.md` and the Phase 1 Constitution.

The plan must include:
1. DATA STRUCTURES:
   - Define a `Task` data model (class or TypedDict) with fields: `id` (int), `title` (str), `description` (str), and `completed` (bool).
   - Use an in-memory list or dictionary managed by a central logic class.
2. COMPONENT BREAKDOWN:
   - `TodoLogic`: A class to handle all business logic (add, delete, update, toggle, filter). This component must have NO print/input statements.
   - `CLIHandler`: A class or module to handle user I/O, parsing commands, and displaying formatted output.
   - `Main`: The entry point script that initializes the app.
3. LOGIC FLOW:
   - Task ID incrementing logic.
   - Error handling for invalid IDs or empty titles.
4. TECH STACK UTILIZATION:
   - Use Python 3.13 Type Hints.
   - Use `uv` for dependency management (if any are needed, though standard library is preferred for this phase).
5. DIRECTORY MAPPING:
   - Logic in `/todo-cli/src/logic.py`.
   - UI in `/todo-cli/src/cli.py`.
   - Entry point in `/todo-cli/src/main.py`.

## Response snapshot

Generated 9 plan artifacts:
- plan.md: technical context, constitution check (all 6 gates PASS), project structure
- research.md: 6 decisions resolved (dataclass, dict storage, monotonic ID, typed exceptions, menu loop, pytest)
- data-model.md: Task dataclass, TodoLogic public API, CLIHandler responsibilities, output formats
- quickstart.md: setup steps (uv), run command, core flow walkthroughs, validation checklist
- contracts/: 5 operation contracts (add, list, toggle, update, delete) with I/O, error tables
- CLAUDE.md updated via update-agent-context.sh with Python 3.13 + in-memory dict tech stack

Key decisions:
- @dataclass (not TypedDict) for evolution path to SQLModel in Phase 2
- dict[int, Task] for O(1) ID lookup
- TodoLogic raises ValueError/TaskNotFoundError; CLIHandler catches + prints
- Interactive numbered-menu loop (no argparse needed)

## Outcome

- ✅ Impact: Complete technical plan ready for /sp.tasks; all constitution gates pass
- 🧪 Tests: N/A — plan artifact; test files will be created in tasks phase
- 📁 Files: 9 artifacts created across specs/001-phase1-todo-cli/
- 🔁 Next prompts: /sp.tasks to generate dependency-ordered task list
- 🧠 Reflection: dataclass chosen over TypedDict for Non-Destructive Architecture principle; clean I/O separation enforced by component contracts

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution check — all 6 gates PASS
- Prompt variant (if applicable): initial
- Next experiment: run /sp.tasks for 001-phase1-todo-cli
