---
id: "0012"
title: GitHub and HF Clean Deploy Setup
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: master
user: Murad-Hasil
command: /sp.implement
labels: ["github", "hugging-face", "docker", "deployment", "clean-start"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - Dockerfile
  - README.md
  - .gitignore
  - todo-web-app/backend/requirements.txt
tests:
  - n/a
---

## Prompt

Perform a CLEAN GitHub Sync and Hugging Face Preparation.

MISSION: Setup a new repository and prepare the monorepo for Hugging Face Docker Space.

STRICT EXECUTION STEPS:
1. LOCAL CLEANUP: Remove any existing .git folder. Initialize a new git repository.
2. ROOT DOCKERFILE: Create a Dockerfile in the ROOT using python:3.13-slim, copy entire project,
   install requirements from todo-web-app/backend/requirements.txt, set ENV PORT=7860 and HOSTNAME,
   run CMD ["uvicorn", "todo-web-app.backend.app.main:app", ...]
3. ROOT README.md: Create with HF metadata: title: Todo AI Final, emoji: rocket, sdk: docker, app_port: 7860
4. GITHUB SYNC: Create repo "hackathon-todo-final", stage all files, commit, force push to master.

User also said: Repo name: Todo AI Assistant
User also said: Srif backend deploy karo, carefully check karo sab files.

## Response snapshot

- Discovered backend uses pyproject.toml + uv (no requirements.txt existed) — generated it via `uv export`.
- Fixed critical issue: root Dockerfile CMD used `todo-web-app.backend.app.main` (hyphen = invalid Python module) — switched to backend-only deploy: WORKDIR /app, copy backend only, `uvicorn app.main:app`.
- Fixed second critical issue: runner.py calls `uv run mcp run app/mcp/server.py` as subprocess — pip-only Dockerfile would break MCP. Updated Dockerfile to install uv from official image and use `uv sync --frozen --no-dev`.
- Removed `uv.lock` from .gitignore (needed for Docker build).
- Updated README.md: title "Todo AI Final", removed colorFrom/colorTo, clean HF metadata.
- Created GitHub repo "Todo-AI-Assistant" at https://github.com/Murad-Hasil/Todo-AI-Assistant
- Removed old .git, fresh git init on master, pushed 110 files successfully.

## Outcome

- ✅ Impact: New GitHub repo live at https://github.com/Murad-Hasil/Todo-AI-Assistant — ready to link to HF Docker Space
- 🧪 Tests: n/a (deployment task)
- 📁 Files: Dockerfile (root), README.md, .gitignore, todo-web-app/backend/requirements.txt
- 🔁 Next prompts: Link repo to Hugging Face Docker Space; set HF Secrets (DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY, CORS_ORIGINS)
- 🧠 Reflection: Two critical Dockerfile issues caught and fixed before push — module path with hyphen, and missing uv for MCP subprocess

## Evaluation notes (flywheel)

- Failure modes observed: Original CMD used hyphenated module path (invalid Python); pip-only Docker would break MCP subprocess that requires uv
- Graders run and results (PASS/FAIL): Manual review PASS — all sensitive files excluded, uv.lock included, correct CMD
- Prompt variant (if applicable): null
- Next experiment: Verify HF Space build succeeds with this Dockerfile
