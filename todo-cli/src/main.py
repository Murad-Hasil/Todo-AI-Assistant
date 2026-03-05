"""Entry point for the Todo CLI application.

# Task: T-1.8 — Main entry point wiring TodoLogic + CLIHandler
"""
from __future__ import annotations

from src.cli import CLIHandler
from src.logic import TodoLogic


def main() -> None:
    """Initialize and run the Todo CLI application."""
    # Task: T-1.8 — Wire logic and handler together
    logic = TodoLogic()
    handler = CLIHandler(logic)
    handler.run()


if __name__ == "__main__":
    main()
