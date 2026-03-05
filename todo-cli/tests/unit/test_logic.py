"""Unit tests for TodoLogic business logic.

# Task: T032 — Unit tests for TodoLogic methods
"""
from __future__ import annotations

import pytest

from src.logic import Task, TaskNotFoundError, TodoLogic, _validate_title


class TestValidateTitle:
    """Task: T033 — Validation rules for task titles."""

    def test_valid_title_returned_stripped(self) -> None:
        assert _validate_title("  hello  ") == "hello"

    def test_single_char_title_accepted(self) -> None:
        assert _validate_title("A") == "A"

    def test_200_char_title_accepted(self) -> None:
        assert _validate_title("a" * 200) == "a" * 200

    def test_empty_title_raises(self) -> None:
        with pytest.raises(ValueError, match="Title is required"):
            _validate_title("")

    def test_whitespace_only_title_raises(self) -> None:
        with pytest.raises(ValueError, match="Title is required"):
            _validate_title("   ")

    def test_201_char_title_raises(self) -> None:
        with pytest.raises(ValueError, match="200 characters or fewer"):
            _validate_title("a" * 201)


class TestTaskNotFoundError:
    """Task: T033 — TaskNotFoundError message format."""

    def test_message_format(self) -> None:
        err = TaskNotFoundError(42)
        assert str(err) == "Task ID 42 not found."
        assert err.task_id == 42

    def test_is_value_error(self) -> None:
        assert isinstance(TaskNotFoundError(1), ValueError)


class TestTodoLogicAddTask:
    """Task: T032 — add_task tests."""

    def setup_method(self) -> None:
        self.logic = TodoLogic()

    def test_add_task_returns_task(self) -> None:
        task = self.logic.add_task("Buy milk")
        assert isinstance(task, Task)
        assert task.id == 1
        assert task.title == "Buy milk"
        assert task.description == ""
        assert task.completed is False

    def test_add_task_increments_id(self) -> None:
        t1 = self.logic.add_task("First")
        t2 = self.logic.add_task("Second")
        assert t1.id == 1
        assert t2.id == 2

    def test_add_task_strips_title(self) -> None:
        task = self.logic.add_task("  hello  ")
        assert task.title == "hello"

    def test_add_task_with_description(self) -> None:
        task = self.logic.add_task("Buy milk", "Oat milk preferred")
        assert task.description == "Oat milk preferred"

    def test_add_task_empty_title_raises(self) -> None:
        with pytest.raises(ValueError):
            self.logic.add_task("")

    def test_add_task_whitespace_title_raises(self) -> None:
        with pytest.raises(ValueError):
            self.logic.add_task("   ")


class TestTodoLogicListTasks:
    """Task: T032 — list_tasks tests."""

    def setup_method(self) -> None:
        self.logic = TodoLogic()

    def test_list_empty(self) -> None:
        assert self.logic.list_tasks() == []

    def test_list_returns_all_tasks(self) -> None:
        self.logic.add_task("First")
        self.logic.add_task("Second")
        tasks = self.logic.list_tasks()
        assert len(tasks) == 2
        assert tasks[0].title == "First"
        assert tasks[1].title == "Second"


class TestTodoLogicToggleTask:
    """Task: T032 — toggle_task tests."""

    def setup_method(self) -> None:
        self.logic = TodoLogic()
        self.task = self.logic.add_task("Test task")

    def test_toggle_pending_to_complete(self) -> None:
        updated = self.logic.toggle_task(self.task.id)
        assert updated.completed is True

    def test_toggle_complete_to_pending(self) -> None:
        self.logic.toggle_task(self.task.id)
        updated = self.logic.toggle_task(self.task.id)
        assert updated.completed is False

    def test_toggle_nonexistent_raises(self) -> None:
        with pytest.raises(TaskNotFoundError):
            self.logic.toggle_task(99)


class TestTodoLogicUpdateTask:
    """Task: T032 — update_task tests."""

    def setup_method(self) -> None:
        self.logic = TodoLogic()
        self.task = self.logic.add_task("Buy milk", "Full fat")

    def test_update_title(self) -> None:
        updated = self.logic.update_task(self.task.id, title="Buy oat milk")
        assert updated.title == "Buy oat milk"
        assert updated.description == "Full fat"

    def test_update_description(self) -> None:
        updated = self.logic.update_task(
            self.task.id, description="Skimmed"
        )
        assert updated.title == "Buy milk"
        assert updated.description == "Skimmed"

    def test_update_both_fields(self) -> None:
        updated = self.logic.update_task(
            self.task.id, title="New title", description="New desc"
        )
        assert updated.title == "New title"
        assert updated.description == "New desc"

    def test_update_empty_title_raises(self) -> None:
        with pytest.raises(ValueError):
            self.logic.update_task(self.task.id, title="")

    def test_update_nonexistent_raises(self) -> None:
        with pytest.raises(TaskNotFoundError):
            self.logic.update_task(99, title="X")

    def test_id_preserved_after_update(self) -> None:
        updated = self.logic.update_task(self.task.id, title="New")
        assert updated.id == self.task.id


class TestTodoLogicDeleteTask:
    """Task: T032 — delete_task tests."""

    def setup_method(self) -> None:
        self.logic = TodoLogic()
        self.task = self.logic.add_task("To be deleted")

    def test_delete_removes_task(self) -> None:
        self.logic.delete_task(self.task.id)
        assert self.logic.list_tasks() == []

    def test_delete_nonexistent_raises(self) -> None:
        with pytest.raises(TaskNotFoundError):
            self.logic.delete_task(99)

    def test_id_not_reused_after_delete(self) -> None:
        self.logic.delete_task(self.task.id)
        new_task = self.logic.add_task("New task")
        assert new_task.id == 2  # next ID, not 1 reused

    def test_delete_leaves_other_tasks(self) -> None:
        t2 = self.logic.add_task("Keep me")
        self.logic.delete_task(self.task.id)
        remaining = self.logic.list_tasks()
        assert len(remaining) == 1
        assert remaining[0].id == t2.id
