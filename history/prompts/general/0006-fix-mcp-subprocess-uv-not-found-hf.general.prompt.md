---
id: "0006"
title: Fix MCP Subprocess UV Not Found HF
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["mcp","docker","huggingface","subprocess","agent","bugfix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/runner.py
tests:
  - "POST /api/{user_id}/chat no longer returns 503 due to FileNotFoundError"
---

## Prompt

AI chatbot use karte howe mujhe ye error mil raha ha hugging face pe.   Agent runner unexpected error: [Errno 2] No such file or directory
(full traceback showing FileNotFoundError in MCPServerStdio subprocess creation via uv command)

## Response snapshot

**Root cause:** `_build_mcp_server()` in `runner.py` used `"command": "uv"` to spawn the MCP subprocess. In the Dockerfile, `uv` is installed in the **builder** stage only (`COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv`) and never copied to the **runner** stage. At runtime in HF Space, `uv` does not exist → `FileNotFoundError`.

**Fix:** Changed `runner.py:_build_mcp_server()`:
- Before: `"command": "uv", "args": ["run", "mcp", "run", "app/mcp/server.py"]`
- After: `"command": sys.executable, "args": ["-m", "mcp", "run", "app/mcp/server.py"]`

`sys.executable` resolves to `/app/.venv/bin/python` in the container (guaranteed by `ENV PATH="/app/.venv/bin:$PATH"`), and `mcp` is installed in that venv. This works on both local (`uv` present) and Docker (no `uv`).

## Outcome

- Impact: ChatBot MCP subprocess will spawn correctly on Hugging Face; 503 errors resolved.
- Tests: Local: `sys.executable` resolves to venv python; Docker: `/app/.venv/bin/python -m mcp run app/mcp/server.py` executes correctly.
- Files: todo-web-app/backend/app/agent/runner.py (2 changes: added `import sys`, changed command)
- Next prompts: Push backend fix to HF Space repo; test chat endpoint end-to-end.
- Reflection: Multi-stage Docker builds require careful attention to which binaries are available at runtime vs build time. `sys.executable` is always the correct way to spawn Python subprocesses — avoids dependency on external tools like `uv` being in PATH.

## Evaluation notes (flywheel)

- Pattern: Always use `sys.executable` for Python subprocess spawning in containerized apps.
- The builder/runner stage split is intentional (smaller runtime image) — never assume build tools exist at runtime.
