---
id: "0012"
title: Fix Rate Limit 429 Message Deduplication
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: debugging
labels: ["bug", "groq", "rate-limit", "429", "deduplication", "token-usage"]
links:
  spec: specs/005-chatbot-db-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/runner.py
tests:
  - "null"
---

## Prompt

HF logs: openai.RateLimitError 429 — Groq daily token limit hit (97,968 / 100,000 TPD). Also noticed duplicate user messages in conversation history (each message saved twice), inflating token usage.

## Response snapshot

Two bugs fixed in runner.py:

1. RateLimitError not explicitly caught — fell through to generic `except Exception` → 503 to client with no indication it was a rate limit. Fixed: explicit `except openai.RateLimitError` → HTTP 429 with clear user-facing message "AI service is at capacity. Please wait a moment and try again."

2. Duplicate user messages in DB history causing inflated token usage. Conversation history showed each user message twice (e.g., "update description..." × 2, "complete the task..." × 2). Root cause: likely frontend double-submit. Backend fix: before saving user message, check if `history_dicts[-1]` is identical user message — if so, skip saving.

Deployed: HF Space 3ace0e6 → a782285, GitHub 0ac8255 → 24417f4

Note: The immediate 429 will resolve itself in ~12 minutes (Groq token reset). Upgrade to Groq Dev Tier for higher limits.

## Outcome

- Impact: Rate limit errors now surface as 429 (not 503); duplicate messages prevented at backend level
- Tests: n/a
- Files: app/agent/runner.py
- Next prompts: Investigate frontend double-submit root cause; consider Groq Dev Tier upgrade
- Reflection: The duplicate messages were consuming tokens at 2x the expected rate and also confusing the model with repeated context. Backend deduplication is a defensive fix — the proper fix is preventing double-submit in the frontend.

## Evaluation notes (flywheel)

- Failure modes observed: RateLimitError masked as 503; frontend double-submit inflating token count and conversation context
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add debounce on frontend send button to prevent double-submit
