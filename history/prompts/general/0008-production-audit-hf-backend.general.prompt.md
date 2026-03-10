---
id: "0008"
title: Production Audit HF Backend
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: /sp.checklist
labels: ["audit", "production", "security", "infrastructure", "mcp", "groq"]
links:
  spec: specs/005-chatbot-db-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chatbot-db-mcp/checklists/production-audit.md
tests:
  - Live endpoint: GET https://mb-murad-todo-ai-assistant.hf.space/ → HTTP 200
  - Live endpoint: GET https://mb-murad-todo-ai-assistant.hf.space/api/health → HTTP 200
  - CORS: GET /api/health with Origin header → Access-Control-Allow-Origin: reflected, credentials: true
---

## Prompt

Perform a Comprehensive Production Audit of the Live Backend on Hugging Face.

MISSION: Audit the current state of the production environment. Provide a detailed report of what is functional and what needs improvement.

STRICT RULE: DO NOT implement any changes. Only analyze and report.

AUDIT CATEGORIES:
1. **INFRASTRUCTURE & CONNECTIVITY:**
   - Verify if the Hugging Face Space is responding on `https://mb-murad-todo-ai-assistant.hf.space/`.
   - Check the status of `/api/health` and the root `/` endpoint.
   - Verify if CORS is correctly configured to allow the live Vercel URL.

2. **AI & MCP LOGIC:**
   - Audit the `app/agent/runner.py` and `app/mcp/server.py` logic in the production context.
   - Verify if the `GROQ_API_KEY` and Groq Client initialization are properly handled.
   - Check if all 5 MCP tools (add, list, update, delete, complete) are correctly exposed in the code.

3. **SECURITY & AUTHENTICATION:**
   - Verify the JWT verification middleware (`app/dependencies.py`).
   - Check if the `BETTER_AUTH_SECRET` sync between Vercel and Hugging Face is logically sound.
   - Audit the user-isolation logic (ensuring `user_id` from JWT matches the task operations).

4. **DATABASE HEALTH (Neon DB):**
   - Check the `SQLModel` definitions for `Task`, `Conversation`, and `Message`.
   - Verify if the production database has all the necessary tables for Phase 3 (Conversations/Messages).

5. **LOG ANALYSIS (If available):**
   - Provide a summary of any recurring warnings or errors in the Hugging Face logs.

REPORT FORMAT:
- STATUS: [OK / WARNING / CRITICAL]
- COMPONENT: [Name]
- FINDING: [Description]
- RECOMMENDATION: [What to do next]

STOP AND WAIT for user review after generating the report.

## Response snapshot

Performed full production audit via:
- Live endpoint checks (curl): GET /, GET /api/health, CORS preflight with Vercel origin
- Static code analysis: main.py, runner.py, mcp/server.py, auth.py, models.py, db.py, routes/chat.py, logic/task_ops.py, migrations/002

No CRITICAL findings. 4 WARNINGs identified:

1. WARNING — CORS env var wiring: `settings.cors_origins_list` exists in db.py but is never used in main.py; `allow_origins=["*"]` is hardcoded. HF proxy compensates by reflecting origin. Medium priority.
2. WARNING — Empty reply fallback: when Groq returns empty output, API returns `{"response": ""}` to client with no user-facing message. Medium priority.
3. WARNING — No rate limiting: chat endpoint has no per-user rate limit; unbounded Groq API cost exposure. High priority.
4. WARNING — Messages endpoint pagination: GET messages returns all records with no limit/offset. Low priority.

All 5 MCP tools confirmed present. JWT auth is correctly implemented with HS256. User isolation is enforced at route, logic, and MCP layers. Phase 3 migrations (conversations/messages) confirmed with CASCADE delete. NullPool confirmed for Neon serverless.

Checklist created: specs/005-chatbot-db-mcp/checklists/production-audit.md (30 items, CHK001-CHK030)

## Outcome

- Impact: Full production audit completed — no CRITICAL issues found; 4 actionable WARNINGs identified for hardening
- Tests: Live endpoint verification (/, /api/health, CORS with Vercel origin)
- Files: specs/005-chatbot-db-mcp/checklists/production-audit.md (created)
- Next prompts: Address rate limiting (highest priority WARNING); wire CORS env var; add empty reply fallback
- Reflection: Production system is functional and secure. The CORS situation is interesting — the HF proxy is compensating for the unwired `CORS_ORIGINS` env var, making the system work despite incomplete wiring. This is a hidden dependency that could break if the proxy behavior changes.

## Evaluation notes (flywheel)

- Failure modes observed: None — audit completed cleanly
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add `slowapi` rate limiting to chat endpoint (1 decorator, 1 middleware line)
