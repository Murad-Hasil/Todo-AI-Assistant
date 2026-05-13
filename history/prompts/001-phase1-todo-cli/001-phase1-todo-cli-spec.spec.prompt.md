---
id: 001
title: Phase 1 Todo CLI In-Memory Spec
stage: spec
date: 2026-03-02
surface: agent
model: claude-sonnet-4-6
feature: 001-phase1-todo-cli
branch: 001-phase1-todo-cli
user: brownie
command: /sp.specify
labels: ["spec","phase-1","todo-cli","in-memory","python","cli","sdd"]
links:
  spec: specs/001-phase1-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase1-todo-cli/spec.md
  - specs/001-phase1-todo-cli/checklists/requirements.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 1: In-Memory Python Console App in `/todo-cli/specs/phase1-cli.md` based strictly on the Project PDF (Pages 5-6).

The specification must include:
1. USER JOURNEYS:
   - Creating a task with a title and optional description.
   - Listing all tasks with status indicators (e.g., [ ] for pending, [x] for complete).
   - Updating an existing task's title or description by ID.
   - Deleting a task by ID.
   - Toggling the completion status of a task.
2. FUNCTIONAL REQUIREMENTS:
   - Command-line interface with clear prompts or subcommands.
   - Tasks must be stored in a Python list/dictionary in memory during runtime.
   - Task ID generation (unique integers).
3. ACCEPTANCE CRITERIA:
   - "Add Task" requires a title (1-200 chars).
   - "List Tasks" must show ID, Title, and Status.
   - "Delete/Update" must handle cases where the ID does not exist gracefully.
4. UI/UX:
   - Clean terminal output using standard Python print statements or basic formatting.
5. CONSTRAINTS:
   - Must use Python 3.13 features where applicable.
   - Must follow the `/todo-cli` folder structure defined in the constitution.

## Response snapshot

Created spec at `specs/001-phase1-todo-cli/spec.md` on branch `001-phase1-todo-cli`.
5 user stories (P1–P5): Add Task, List Tasks, Toggle Completion, Update Task, Delete Task.
10 functional requirements (FR-001 to FR-010). 6 success criteria (SC-001 to SC-006).
Key entity: Task (ID, title 1–200 chars, description optional, status pending/complete).
Edge cases: empty list, ID reuse, boundary title lengths, whitespace-only title.
Quality checklist: all 14 items PASS — spec ready for /sp.plan.

## Outcome

- ✅ Impact: Complete Phase 1 spec with 5 user stories and full acceptance scenarios
- 🧪 Tests: N/A — spec artifact, no code tests
- 📁 Files: specs/001-phase1-todo-cli/spec.md, specs/001-phase1-todo-cli/checklists/requirements.md
- 🔁 Next prompts: /sp.plan to generate architecture and implementation plan
- 🧠 Reflection: Spec is user-focused, technology-agnostic, and fully testable; no clarifications needed

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): requirements.md checklist — all PASS
- Prompt variant (if applicable): initial
- Next experiment: run /sp.plan for 001-phase1-todo-cli
