"""Additional validation edge-case tests.

# Task: T033 — Validation edge cases
"""
from __future__ import annotations

import pytest

from src.logic import TodoLogic, _validate_title


class TestTitleBoundaries:
    """Boundary tests for title length validation."""

    def test_exactly_1_char_accepted(self) -> None:
        assert _validate_title("X") == "X"

    def test_exactly_200_chars_accepted(self) -> None:
        title = "b" * 200
        assert _validate_title(title) == title

    def test_201_chars_rejected(self) -> None:
        with pytest.raises(ValueError):
            _validate_title("c" * 201)

    def test_zero_chars_rejected(self) -> None:
        with pytest.raises(ValueError):
            _validate_title("")

    def test_only_newline_rejected(self) -> None:
        with pytest.raises(ValueError):
            _validate_title("\n")

    def test_only_tab_rejected(self) -> None:
        with pytest.raises(ValueError):
            _validate_title("\t")


class TestIDNeverReused:
    """Verify the no-ID-reuse invariant."""

    def test_ids_never_reused_after_deletion(self) -> None:
        logic = TodoLogic()
        t1 = logic.add_task("First")
        logic.delete_task(t1.id)
        t2 = logic.add_task("Second")
        assert t2.id != t1.id
        assert t2.id == 2
