# Research: Phase 1 — In-Memory Python Console Todo App

**Branch**: `001-phase1-todo-cli` | **Date**: 2026-03-02

## Resolved Decisions

### Decision 1: Data model representation

- **Decision**: Use `@dataclass` (not `TypedDict` or plain `dict`)
- **Rationale**: `dataclass` provides field defaults, type hints, `__repr__`,
  and is subclassable. This satisfies the Non-Destructive Architecture principle
  — a future `SQLModel` or Pydantic model can extend or replace it without
  rewriting `TodoLogic`. `TypedDict` is not subclassable and carries no methods;
  a plain dict provides no type safety.
- **Alternatives considered**:
  - `TypedDict` — rejected: no default values, not subclassable, no method support
  - Plain `dict` — rejected: no type safety, poor IDE support, no evolution path
  - `pydantic.BaseModel` — rejected: third-party; out of scope for Phase 1

### Decision 2: In-memory storage structure

- **Decision**: `dict[int, Task]` keyed by task ID inside `TodoLogic`
- **Rationale**: O(1) lookup by ID for toggle, update, and delete. ID gaps after
  deletion are irrelevant (IDs are never reused per spec). A list would require
  O(n) scans for every ID-based operation and makes "no ID reuse" harder to enforce.
- **Alternatives considered**:
  - `list[Task]` — rejected: O(n) lookup, awkward gap handling after delete
  - `OrderedDict` — rejected: unnecessary complexity; insertion order preserved
    by default in Python 3.7+ dicts

### Decision 3: ID generation strategy

- **Decision**: Monotonically incrementing integer counter `_next_id: int`
  starting at 1, incremented on every successful `add_task()` call
- **Rationale**: Simple, predictable, never reuses deleted IDs (spec requirement).
  Stored as instance state in `TodoLogic`; reset on app restart (acceptable for
  Phase 1 in-memory scope).
- **Alternatives considered**:
  - UUID — rejected: overly complex for a CLI app; harder for users to type
  - Max-of-existing-IDs + 1 — rejected: reuses deleted IDs, violates spec

### Decision 4: Error signaling strategy

- **Decision**: `TodoLogic` raises typed exceptions; `CLIHandler` catches and
  prints user-friendly messages
  - `ValueError` for validation failures (empty/too-long title)
  - `TaskNotFoundError(ValueError)` for non-existent IDs
- **Rationale**: Keeps `TodoLogic` free of I/O. `CLIHandler` translates
  exceptions to readable terminal output. Typed exceptions allow tests to assert
  exact failure modes.
- **Alternatives considered**:
  - Return `None` / sentinel values — rejected: silently swallowed by callers
  - Return `Result` type (ok/err) — rejected: non-idiomatic Python; overengineered

### Decision 5: CLI interaction model

- **Decision**: Interactive numbered-menu loop using `input()` prompts
- **Rationale**: Most discoverable for first-time users (SC-001, SC-004). No
  subcommand parsing library needed (standard library `input()` sufficient).
  Menu is reprinted after each operation to orient the user.
- **Alternatives considered**:
  - `argparse` subcommands — rejected: requires re-launching the app per operation;
    poor UX for interactive session
  - `cmd.Cmd` stdlib module — considered but adds boilerplate for 5 operations;
    plain loop is simpler and sufficient (YAGNI)

### Decision 6: Testing approach

- **Decision**: `pytest` as dev dependency; unit tests for `TodoLogic` and
  validation; integration tests capture `stdout` via `capsys`
- **Rationale**: `pytest` is the de facto Python testing standard; integrates
  with `uv` as a dev dependency group. Unit tests run fast and test business
  logic in isolation. Integration tests use `monkeypatch` to simulate `input()`
  sequences.
- **Alternatives considered**:
  - `unittest` only — rejected: more verbose; pytest is strictly better for this
    use case and is the constitution's stated testing tool
