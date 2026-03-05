# Claude Code Rules — Todo CLI Phase 1

This file contains agent-specific instructions for maintaining Phase 1.

## Phase Isolation (Constitution III)

ALL code for Phase 1 MUST reside under `/todo-cli/`. No cross-boundary
imports or artifacts. This directory is the Phase 1 sandbox.

## Source Layout

- `src/logic.py` — Business logic ONLY. No print(), no input(). Ever.
- `src/cli.py` — I/O ONLY. No direct task manipulation.
- `src/main.py` — Entry point only. Wires logic + CLI.

## Task ID Comments (Constitution I)

Every function and class MUST include a comment referencing its Task ID:
```python
# Task: T-1.X — <brief description>
```

## Running the App

```bash
cd /todo-cli
uv run python -m src.main
```

## Running Tests

```bash
cd /todo-cli
uv run pytest tests/ -v
```

## PEP8 Rules (Constitution VI)

- snake_case for functions/variables
- PascalCase for classes
- Type hints on ALL public signatures
- Line length <= 88 characters
- No hardcoded secrets

## Phase Gate

Phase 1 is NOT closed until:
1. All 36 tasks in tasks.md are checked off [x]
2. `uv run pytest tests/ -v` exits with code 0
3. Quickstart.md validation checklist is fully checked
