---
id: "0010"
title: Fix Agent Update Task Add Confusion
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: debugging
labels: ["bug", "groq", "system-prompt", "agent", "tool-calling"]
links:
  spec: specs/005-chatbot-db-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/prompts.py
tests:
  - "null"
---

## Prompt

HF logs mein error: user ne task update karne ki koshish ki ("update description of buying seeds 'For birds'") lekin Groq ne add_task call kar diya aur malformed <function=...> syntax generate ki. 400 Bad Request → 503 to client.

## Response snapshot

Root cause: Groq llama-3.3-70b-versatile confused "update description of X" with "add task". System prompt Rule 1 said "call list_tasks ONLY when you need a task_id" but didn't explicitly ban add_task for update requests. Model also generated <function=add_task(...)> old-style syntax instead of JSON tool calls — known Groq quirk when confused.

Fix: Rewrote system prompt (app/agent/prompts.py):
- Added AVAILABLE TOOLS section (explicit list of 5 tools with signatures)
- Rule 1: Hard ADD vs UPDATE distinction — "update/change/edit/modify/description of" keywords → always UPDATE flow, never add_task
- Rule 2: Mandatory 3-step UPDATE FLOW — list_tasks first → find id → update_task
- Renumbered existing rules for coherence

Deployed to HF Space: 33db4e6 → d817911
GitHub submodule: 4d612f8 → 191052c

## Outcome

- Impact: Agent now has explicit keyword-based routing to prevent add_task on update requests
- Tests: Not run (prompt-only change, no code logic changed)
- Files: app/agent/prompts.py
- Next prompts: Monitor logs for recurrence; if still failing, consider switching model or adding few-shot examples
- Reflection: Groq's tool-calling reliability is the weakest point of the system. The model occasionally falls back to <function=...> format when confused by conversation context. System prompt clarity is the primary mitigation.

## Evaluation notes (flywheel)

- Failure modes observed: Groq 400 tool_use_failed — model called wrong tool AND used old function syntax
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): Explicit AVAILABLE TOOLS header + mandatory UPDATE FLOW steps
- Next experiment (smallest change to try): Add a few-shot example in the system prompt showing the exact list_tasks → update_task sequence
