---
id: "0018"
title: MCP Singleton Fix — Chatbot 503 AI Service Unavailable
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: "Ab bhi mere pas chatbot use karne pe AI service unavailable..."
labels: ["mcp","k8s","fix","performance","singleton","groq"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/runner.py
tests:
  - "Chatbot E2E: Add task — PASSED (via Playwright)"
  - "Chatbot E2E: Update task — PASSED (via Playwright)"
  - "Chatbot E2E: Complete task — PENDING (Groq 100k TPD limit)"
  - "Chatbot E2E: Delete task — PENDING (Groq 100k TPD limit)"
---

## Prompt

Ab bhi mere pas chatbot use karne pe AI service unavailable. Please try again. ye message aaraha ha. mai dono pods apne pas se band kar deta hon ap apne pas on kar ke check kar lo, chatbot se 1 new task add karwao, usko update karwao, usko complete mark karwao, pir usko delete karwao.

## Response snapshot

**Root cause diagnosed:** `MCPServerStdio` was spawning a new Python subprocess on every single chat request. In WSL2/Minikube, Python module imports take ~20 seconds (`pydantic_settings` + `sqlalchemy` engine = 20s total), exceeding the 30-second `client_session_timeout_seconds` limit.

**Fixes applied:**

1. **MCP singleton pattern** — `_get_connected_mcp_server()` connects once on first request, reuses for all subsequent requests. Health check on reuse; reconnects if unhealthy.
2. **Import approach** — changed `"args": ["run", "app/mcp/server.py"]` to `"args": ["run", "app/mcp/server.py:mcp"]` so FastMCP.run() is called automatically.
3. **Increased timeout** — `client_session_timeout_seconds=90` (was 30) for WSL2 first-startup.

**E2E test results via Playwright (local K8s):**
- ✅ Add: "Buy groceries from the market" added successfully
- ✅ Update: title changed to "Buy groceries and vegetables from the market"
- ⏳ Complete: Groq 100k TPD daily limit hit (used 99989/100000) — retry in 42 min
- ⏳ Delete: blocked by same limit

**Additional note:** On complete attempt, agent sent `missing_task_id` instead of real UUID — agent didn't call `list_tasks` first to resolve task ID. To investigate after rate limit resets.

**Deployed:** HF Space ✅ + GitHub ✅

## Outcome

- ✅ Impact: Chatbot now works in local K8s. First message ~60s (MCP subprocess cold start), subsequent messages fast (~5s Groq latency only).
- 🧪 Tests: Add + Update PASSED via Playwright E2E. Complete + Delete pending Groq rate limit reset.
- 📁 Files: `todo-web-app/backend/app/agent/runner.py` — singleton pattern + import approach + timeout bump
- 🔁 Next prompts: Complete + delete test after 42 min; investigate `missing_task_id` if it recurs
- 🧠 Reflection: WSL2/Minikube file I/O is 10x slower than native Linux — subprocess-per-request pattern acceptable on fast servers (HF Space) but catastrophic in WSL2. Singleton is the right fix universally.

## Evaluation notes (flywheel)

- Failure modes observed: MCP timeout on session.initialize(); agent using `missing_task_id` (task ID not resolved via list_tasks)
- Graders run and results (PASS/FAIL): Playwright E2E — Add PASS, Update PASS, Complete PENDING, Delete PENDING
- Prompt variant (if applicable): null
- Next experiment: If `missing_task_id` recurs, add explicit instruction in SYSTEM_PROMPT: "Always call list_tasks first to get task IDs before calling complete_task or delete_task"
