---
id: "0011"
title: Fix Complete Delete Flow BadRequest Error
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: debugging
labels: ["bug", "groq", "system-prompt", "complete-task", "tool-calling", "BadRequestError"]
links:
  spec: specs/005-chatbot-db-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/prompts.py
  - todo-web-app/backend/app/agent/runner.py
tests:
  - "null"
---

## Prompt

task ko complete mark karne ka kaha chatbot ko mai ne ye error mila, iske sath baki ke check karna maybe unme same syntax error ho.

[HF logs pasted — complete_task called with task_id="the id of the task buying seeds" (literal string, not UUID) → Invalid task_id format → model tried list_tasks but generated <function=list_tasks={"user_id": ...}> malformed syntax → Groq 400 → app 503]

## Response snapshot

Two bugs in the same request:

1. Model called complete_task with task_id="the id of the task buying seeds" — a literal English phrase, not a UUID. System prompt said "never guess task_id" but didn't have an explicit COMPLETE FLOW telling the model to call list_tasks FIRST.

2. After the Invalid task_id error, model tried to call list_tasks but generated malformed syntax: <function=list_tasks={"user_id": ...}> (missing parens, wrong format). Groq rejected with 400 tool_use_failed.

Root cause: System prompt only had explicit UPDATE FLOW. COMPLETE FLOW and DELETE FLOW were missing. Groq llama-3.3-70b-versatile needs step-by-step explicit flows for every operation — prose rules like "never guess task_id" are not followed reliably.

Fixes:
1. prompts.py — Restructured into OPERATION FLOWS section with explicit steps for all 5 operations (ADD/UPDATE/COMPLETE/DELETE/LIST). Added absolute TASK_ID RULE at the top.
2. runner.py — Added specific openai.BadRequestError catch with user_id logging for easier debugging of Groq tool_use_failed errors.

Deployed: HF Space d817911 → 3ace0e6, GitHub 191052c → 0ac8255

## Outcome

- Impact: All 5 operation flows are now explicit step-by-step sequences; model cannot skip list_tasks for complete/delete operations
- Tests: n/a
- Files: app/agent/prompts.py, app/agent/runner.py
- Next prompts: Monitor HF logs for recurrence of tool_use_failed; if still failing, consider adding few-shot examples or switching to a more reliable model
- Reflection: Groq llama-3.3-70b-versatile requires extremely explicit, structured system prompts. Prose rules are ignored under complex conversation context. Operation-specific flows are the minimum viable pattern for reliable tool calling.

## Evaluation notes (flywheel)

- Failure modes observed: (1) Invented task_id from task title, (2) Malformed <function=...> syntax on retry after tool error
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): Explicit OPERATION FLOWS with numbered steps for each trigger keyword
- Next experiment (smallest change to try): Add one-shot example in system prompt showing exact complete_task UUID flow
