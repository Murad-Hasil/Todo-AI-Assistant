# Implementation Plan: Phase 1 — In-Memory Python Console Todo App

**Branch**: `001-phase1-todo-cli` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-phase1-todo-cli/spec.md`

## Summary

Build a command-line Todo application in Python 3.13 using the standard library
only. Business logic (add / delete / update / toggle / list) lives exclusively in
`TodoLogic` with zero I/O. A separate `CLIHandler` owns all terminal interaction.
`main.py` wires the two together and drives the interactive loop. All data lives
in an in-memory `dict[int, Task]` keyed by task ID, scoped to a single runtime
session. No third-party packages are required or permitted in Phase 1.

## Technical Context

**Language/Version**: Python 3.13
**Primary Dependencies**: Standard library only — `dataclasses`, `sys`, `textwrap`
**Storage**: `dict[int, Task]` — in-memory, single runtime session, no persistence
**Testing**: `pytest` (development dependency via `uv`; not imported by app code)
**Target Platform**: WSL 2 (Ubuntu 22.04) terminal — standard ANSI terminal assumed
**Project Type**: Single project (CLI application)
**Performance Goals**: All operations complete in under 1 second for stores up to
100 tasks on a standard developer machine
**Constraints**: ≤88 char line length (Black-compatible); PEP8; type hints on all
public function/method signatures; no hardcoded secrets
**Scale/Scope**: Single user, single terminal session, up to 100 tasks per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Question | Status |
|---|---|---|
| I. Strict SDD | Every task references a Task ID from tasks.md? | ✅ Enforced by tasks.md workflow |
| II. Read-Before-Write | Agents read current file state before proposing edits? | ✅ Enforced by agent workflow |
| III. Phase Isolation | All source files reside strictly under `todo-cli/`? | ✅ Directory layout enforces this |
| IV. Non-Destructive Arch | `TodoLogic` has zero I/O; `CLIHandler` has zero business logic? | ✅ Component contracts enforce this |
| V. No-Skip Ordering | No Phase 2 artifacts (DB, HTTP) in this plan? | ✅ Standard library only, no DB/HTTP |
| VI. PEP8 Code Quality | Type hints on all public methods; snake_case; ≤88 chars? | ✅ Enforced in implementation tasks |

**Post-design re-check**: All gates pass. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-phase1-todo-cli/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── add-task.md
│   ├── list-tasks.md
│   ├── toggle-task.md
│   ├── update-task.md
│   └── delete-task.md
└── tasks.md             # Phase 2 output (/sp.tasks command — NOT created here)
```

### Source Code

```text
todo-cli/
├── src/
│   ├── logic.py         # TodoLogic class — pure business logic, zero I/O
│   ├── cli.py           # CLIHandler class — all terminal I/O, zero business logic
│   └── main.py          # Entry point — wires TodoLogic + CLIHandler, runs loop
├── tests/
│   ├── unit/
│   │   ├── test_logic.py       # Unit tests for TodoLogic methods
│   │   └── test_validation.py  # Unit tests for title validation rules
│   └── integration/
│       └── test_cli_flows.py   # End-to-end flow tests (stdin/stdout capture)
├── README.md
├── CLAUDE.md
└── pyproject.toml       # uv-managed project config
```

**Structure Decision**: Single-project layout per constitution directory mandate.
No web framework, no package splitting. All source in `todo-cli/src/`. Tests in
`todo-cli/tests/`. `pyproject.toml` at `todo-cli/` root for `uv` management.
