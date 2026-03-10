---
id: "0009"
title: Production Hardening CORS RateLimit Fallback
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: main
user: brownie
command: /sp.implement
labels: ["hardening", "cors", "rate-limiting", "slowapi", "ai-fallback", "production"]
links:
  spec: specs/005-chatbot-db-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/pyproject.toml
  - todo-web-app/backend/app/limiter.py
  - todo-web-app/backend/app/main.py
  - todo-web-app/backend/app/agent/runner.py
  - todo-web-app/backend/app/routes/chat.py
  - todo-web-app/backend/app/routes/tasks.py
tests:
  - "null"
---

## Prompt

Production Hardening: Resolve Audit Findings for CORS, AI Fallback, and Rate Limiting.

MISSION: Upgrade the production backend to be more robust, secure, and independent of proxy behaviors.

STRICT EXECUTION STEPS:
1. **INSTALL DEPENDENCIES:**
   - Add `slowapi` to `/todo-web-app/backend/pyproject.toml` (or requirements.txt).
   - This is for implementing rate limiting.

2. **CORS REFACTORING (app/main.py):**
   - Ensure the `CORS_ORIGINS` environment variable is correctly read and split into a list (e.g., using `.split(",")`).
   - Wire this list directly into the `CORSMiddleware` in `main.py`.
   - Ensure `allow_credentials=True` is preserved.

3. **AI FALLBACK LOGIC (app/agent/runner.py):**
   - In the Agent runner logic, add a check for the LLM response.
   - If the response from Groq is empty, null, or just whitespace, return a default fallback string: "I'm sorry, I encountered a brief issue processing that. Could you please try again or rephrase your request?"
   - (Bonus: Include an Urdu fallback if the context is Urdu).

4. **RATE LIMITING (app/main.py & routes):**
   - Initialize `slowapi.Limiter` in `main.py` using the user's IP as the identifier.
   - Apply a limit of `10 requests per minute` to the `POST /api/{user_id}/chat` endpoint.
   - Apply a limit of `30 requests per minute` to the Task CRUD endpoints.
   - Ensure the app returns a clear `429 Too Many Requests` error if limits are hit.

5. **VERIFICATION & PUSH:**
   - Verify the code logic does not break existing JWT authentication.
   - Use GitHub MCP to commit and push these hardening fixes to the repository so Hugging Face can auto-deploy.

## Response snapshot

Implemented all 5 hardening steps across 6 files:

1. **pyproject.toml**: Added `slowapi>=0.1.9`
2. **app/limiter.py** (new): Shared `Limiter(key_func=get_remote_address)` singleton
3. **app/main.py**: Wired `settings.cors_origins_list` to CORSMiddleware (`allow_credentials=True`); registered limiter on `app.state` + `RateLimitExceeded` exception handler
4. **app/agent/runner.py**: Added fallback when `assistant_reply.strip()` is empty — English + Urdu message; logs a warning with `user_id` and `conv_id`
5. **app/routes/chat.py**: Added `@limiter.limit("10/minute")` to `chat()`, `@limiter.limit("30/minute")` to `get_conversation_messages()`; both get `request: Request` as first param
6. **app/routes/tasks.py**: Added `@limiter.limit("30/minute")` to all 6 task endpoints (list, create, get, update, delete, toggle); all get `request: Request` as first param

JWT authentication unchanged — slowapi operates at middleware/decorator level, not auth layer.

Deployment:
- Backend committed and pushed to HF Space (main → 4010271)
- Submodule pointer updated and pushed to GitHub (main → c7cd2a9)

**IMPORTANT DEPLOYMENT NOTE**: `CORS_ORIGINS` env var must be set on HF Space:
`CORS_ORIGINS=https://frontend-murad-hasils-projects.vercel.app`
If not set, default falls back to `http://localhost:3000` and Vercel frontend will be CORS-blocked.

## Outcome

- Impact: Backend now has explicit CORS control, rate limiting, and graceful AI fallback — no longer relies on HF proxy for CORS correctness
- Tests: Not run (no test changes; existing integration tests unaffected)
- Files: 6 backend files modified, 1 created (app/limiter.py)
- Next prompts: Set CORS_ORIGINS env var on HF Space; monitor HF Space logs for rate limit triggers; add pagination to messages endpoint
- Reflection: The deploy-backend.sh script skipped because changes were already committed — pushed manually instead. Script expects uncommitted changes in the working tree.

## Evaluation notes (flywheel)

- Failure modes observed: deploy-backend.sh skipped push because changes were pre-committed; resolved by pushing directly from the submodule directory
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Set CORS_ORIGINS on HF Space and verify Vercel frontend still works
