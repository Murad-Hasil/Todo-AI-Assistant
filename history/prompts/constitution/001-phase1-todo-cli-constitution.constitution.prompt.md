---
id: 001
title: Phase 1 Todo CLI Constitution
stage: constitution
date: 2026-03-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: brownie
command: /sp.constitution
labels: ["constitution","phase-1","todo-cli","sdd","python","fastapi","in-memory"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

Generate a constitution for Phase 1: In-Memory Python Console App based on the Project PDF with the following strict constraints:

# MISSION
Build a Command-Line Interface (CLI) Todo application using Spec-Driven Development (SDD).

# TECHNICAL STACK
- Language: Python 3.13+
- Package Manager: uv
- Environment: WSL 2 (Ubuntu 22.04)
- Architecture: Functional/Procedural logic decoupled from I/O.
- Storage: In-memory (No database in this phase).

# DIRECTORY STRUCTURE
- Root: `/todo-cli`
- Specifications: `/todo-cli/specs/`
- Source Code: `/todo-cli/src/`
- Documentation: `/todo-cli/README.md`, `/todo-cli/CLAUDE.md`

# CORE FEATURES (BASIC LEVEL)
1. Add Task (Title and Description)
2. Delete Task (By ID)
3. Update Task (Modify details)
4. View Task List (With status indicators)
5. Mark as Complete (Toggle status)

# DEVELOPMENT RULES
1. STRICT SDD: No code is written without a corresponding Spec, Plan, and Task ID.
2. READ-BEFORE-WRITE: Agents must read the current state of files before proposing changes.
3. ISOLATION: All Phase 1 code must reside strictly within `/todo-cli`.
4. NON-DESTRUCTIVE: Code must be modular to allow for future evolution without complete rewrites.
5. NO SKIP: Phases must be completed in order. Phase 1 must be closed before Phase 2 begins.

# AGENT BEHAVIOR
- Reference Task IDs in every implementation.
- Follow PEP8 styling for Python code.
- Always verify requirements against the PDF page 5 and 6.

## Response snapshot

Ratified constitution v1.0.0 at `.specify/memory/constitution.md` with 6 principles:
I. Strict SDD (NON-NEGOTIABLE) — no code without Spec+Plan+TaskID
II. Read-Before-Write — agents must read files before proposing changes
III. Phase Isolation — all Phase 1 code stays in /todo-cli; hard gate before Phase 2
IV. Non-Destructive Modular Architecture — logic decoupled from I/O, swap-ready storage layer
V. No-Skip Phase Ordering — Phase 1 fully closed before Phase 2 starts
VI. PEP8 Code Quality — snake_case, type hints, ≤88 char lines, verify vs PDF pp.5-6
Sync Impact Report embedded as HTML comment. All 4 templates verified — no updates required.

## Outcome

- ✅ Impact: Project constitution established for Phase 1 Todo CLI; all 6 principles ratified
- 🧪 Tests: N/A — constitution artifact, no code tests
- 📁 Files: .specify/memory/constitution.md (created/overwritten)
- 🔁 Next prompts: /sp.specify to create feature spec for todo-cli-phase1
- 🧠 Reflection: Constitution is clean, testable, and fully free of placeholder tokens

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): initial
- Next experiment: run /sp.specify with phase1 feature description
