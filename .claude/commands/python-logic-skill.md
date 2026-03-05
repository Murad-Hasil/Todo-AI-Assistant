---
name: python-logic-skill
description: Implements core Todo CRUD logic using Python 3.13 and SQLModel.
---

# Python Logic & ORM

## Instructions
1. For Phase 1: Implement an in-memory `TodoManager` class with methods for add, delete, update, list, and toggle.
2. For Phase 2+: Implement `SQLModel` definitions for Tasks, Users, and (later) Conversations.
3. Ensure all date/time fields use timezone-aware UTC objects.
4. Validate input strings using Pydantic lengths (1-200 for titles).

## Examples
- Defining a Task model with `SQLModel, Field`.
- Implementing a logic-gate to filter tasks by `user_id`.
