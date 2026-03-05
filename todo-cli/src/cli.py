"""CLI I/O layer — zero business logic.

# Task: T-1.6 / T-1.7 — CLIHandler display and input logic
"""
from __future__ import annotations

from src.logic import Task, TaskNotFoundError, TodoLogic


# Task: T-1.6 — CLIHandler class
class CLIHandler:
    """Handles all terminal I/O for the Todo CLI.

    Contains zero business logic — delegates all operations to TodoLogic.
    """

    def __init__(self, logic: TodoLogic) -> None:
        """Initialize CLIHandler with a TodoLogic instance.

        Args:
            logic: The business logic layer instance.
        """
        # Task: T-1.7 — Store reference to logic layer
        self._logic = logic

    # Task: T-1.8 — Main interactive loop
    def run(self) -> None:
        """Start the interactive menu loop. Exits on user choice '0'."""
        while True:
            self._show_menu()
            choice = input("> ").strip()
            if choice == "1":
                self._handle_add()
            elif choice == "2":
                self._handle_list()
            elif choice == "3":
                self._handle_toggle()
            elif choice == "4":
                self._handle_update()
            elif choice == "5":
                self._handle_delete()
            elif choice == "0":
                print("Goodbye!")
                break
            else:
                print(
                    "Invalid choice. Please enter a number from 0 to 5."
                )
            print()  # blank line between operations

    # Task: T-1.6 — Menu display
    def _show_menu(self) -> None:
        """Print the numbered main menu."""
        print("=== Todo CLI ===")
        print("1. Add task")
        print("2. List tasks")
        print("3. Toggle complete")
        print("4. Update task")
        print("5. Delete task")
        print("0. Quit")

    # Task: T-1.6 — Single task row display
    def _print_task_row(self, task: Task) -> None:
        """Format and print a single task row.

        Args:
            task: The Task to display.
        """
        status = "[x]" if task.completed else "[ ]"
        print(f"{task.id:>3}  {status}  {task.title}")
        if task.description:
            print(f"         {task.description}")

    # Task: T-1.7 — Add task input handler
    def _handle_add(self) -> None:
        """Prompt for title and description, create task."""
        title = input("Title: ")
        description = input("Description (optional): ")
        try:
            task = self._logic.add_task(title, description)
            print(f"Task added: [{task.id}] {task.title}")
        except ValueError as e:
            print(f"Error: {e}")

    # Task: T-1.6 — List tasks display handler
    def _handle_list(self) -> None:
        """Display all tasks or empty-state message."""
        tasks = self._logic.list_tasks()
        if not tasks:
            print("No tasks found.")
            return
        print("=== Your Tasks ===")
        for task in tasks:
            self._print_task_row(task)
            print()  # blank line between tasks

    # Task: T-1.7 — Toggle input handler
    def _handle_toggle(self) -> None:
        """Prompt for task ID and toggle its completion status."""
        try:
            task_id = int(input("Task ID: "))
            task = self._logic.toggle_task(task_id)
            status = (
                "complete [x]" if task.completed else "pending [ ]"
            )
            print(f"Task [{task.id}] marked as {status}.")
        except TaskNotFoundError as e:
            print(f"Error: {e}")
        except ValueError:
            print("Error: Please enter a valid task ID (number).")

    # Task: T-1.7 — Update input handler
    def _handle_update(self) -> None:
        """Prompt for task ID, new title, and new description."""
        try:
            task_id = int(input("Task ID: "))
        except ValueError:
            print("Error: Please enter a valid task ID (number).")
            return
        try:
            task = self._logic.get_task(task_id)
        except TaskNotFoundError as e:
            print(f"Error: {e}")
            return
        new_title_raw = input(
            f"New title (blank = keep '{task.title}'): "
        )
        new_desc_raw = input(
            "New description (blank = keep current): "
        )
        new_title = (
            new_title_raw.strip() if new_title_raw.strip() else None
        )
        new_desc = (
            new_desc_raw if new_desc_raw.strip() != "" else None
        )
        try:
            updated = self._logic.update_task(
                task_id, title=new_title, description=new_desc
            )
            print(f"Task [{updated.id}] updated.")
            print(f"  Title: {updated.title}")
            if updated.description:
                print(f"  Description: {updated.description}")
        except ValueError as e:
            print(f"Error: {e}")

    # Task: T-1.7 — Delete input handler
    def _handle_delete(self) -> None:
        """Prompt for task ID and delete the task."""
        try:
            task_id = int(input("Task ID: "))
        except ValueError:
            print("Error: Please enter a valid task ID (number).")
            return
        try:
            self._logic.delete_task(task_id)
            print(f"Task [{task_id}] deleted.")
        except TaskNotFoundError as e:
            print(f"Error: {e}")
