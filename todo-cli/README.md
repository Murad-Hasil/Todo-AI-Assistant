# Todo CLI — Phase 1: In-Memory Console App

A command-line Todo application built with Python 3.13 and zero third-party
runtime dependencies.

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) package manager

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup

```bash
# Clone / navigate to the project
cd todo-cli

# Create virtual environment and install dev dependencies
uv sync
```

## Run the App

```bash
uv run python -m src.main
```

You will see:

```
=== Todo CLI ===
1. Add task
2. List tasks
3. Toggle complete
4. Update task
5. Delete task
0. Quit
>
```

## Usage

| Option | Operation | What it does |
|--------|-----------|--------------|
| 1 | Add task | Enter a title (required) and description (optional) |
| 2 | List tasks | Show all tasks with `[ ]` pending / `[x]` complete |
| 3 | Toggle complete | Enter an ID to flip its status |
| 4 | Update task | Enter an ID to change title or description |
| 5 | Delete task | Enter an ID to permanently remove a task |
| 0 | Quit | Exit the application |

## Run Tests

```bash
uv run pytest tests/ -v
```

## Project Structure

```
todo-cli/
├── src/
│   ├── logic.py    # Business logic (zero I/O)
│   ├── cli.py      # CLI handler (zero business logic)
│   └── main.py     # Entry point
├── tests/
│   └── unit/
│       ├── test_logic.py       # TodoLogic unit tests
│       └── test_validation.py  # Title validation tests
├── pyproject.toml
├── README.md
└── CLAUDE.md
```

## Architecture

This app follows strict separation of concerns:
- **`TodoLogic`** — all business rules, raises typed exceptions, zero I/O
- **`CLIHandler`** — all user interaction, catches exceptions and prints messages
- **`main.py`** — wires them together and starts the loop
