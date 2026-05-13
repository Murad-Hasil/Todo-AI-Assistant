---
id: "0035"
title: Add CI/CD GitHub Actions Workflow
stage: general
date: 2026-05-14
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: mbmuradhasil@gmail.com
command: CI/CD workflow add karo
labels: ["ci-cd","github-actions","testing","linting"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .github/workflows/ci.yml
tests:
  - todo-cli/tests/unit/test_logic.py
  - todo-cli/tests/unit/test_validation.py
---

## Prompt

CI/CD workflow add kar do jo tumne recomend kia ha.

## Response snapshot

Created `.github/workflows/ci.yml` with three parallel jobs:
1. `cli-tests` — uv + pytest on `todo-cli/tests/`
2. `frontend-lint` — Node 20, `next lint` + `tsc --noEmit`
3. `backend-syntax` — Python 3.13, `compileall` on `app/` (submodule checkout, no secrets needed)

Triggers on push/PR to main and master branches.

## Outcome

- ✅ Impact: Automated quality gate on every PR and push to main
- 🧪 Tests: CLI pytest suite, frontend ESLint + TypeScript type check, backend syntax validation
- 📁 Files: .github/workflows/ci.yml (created)
- 🔁 Next prompts: Add backend integration tests with mocked secrets; add Dockerfile build check
- 🧠 Reflection: Backend has no test files — only syntax check possible without secrets. CLI tests are the main quality gate currently.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment: Add pytest-cov coverage threshold to cli-tests job
