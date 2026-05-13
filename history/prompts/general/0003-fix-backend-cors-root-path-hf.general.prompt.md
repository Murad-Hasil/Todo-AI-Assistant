---
id: "0003"
title: Fix Backend CORS Root Path HF
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["cors","fastapi","huggingface","production","backend"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/main.py
tests:
  - "GET / → {message: 'Todo AI Backend is Running', status: 'online'}"
  - "GET /health → {status: ok, version: 3.2.0}"
  - "GET /api/health → {status: ok}"
---

## Prompt

Fix Backend Root Path and CORS for Production.

MISSION: Resolve 404 errors on Hugging Face and allow Vercel to communicate with the API.

STRICT EXECUTION STEPS:
1. **UPDATE app/main.py:**
   - Add a root endpoint:
     ```python
     @app.get("/")
     def read_root():
         return {"message": "Todo AI Backend is Running", "status": "online"}
     ```
   - **CORS Configuration:**
     - Import `CORSMiddleware`.
     - Set `allow_origins=["*"]` (for initial testing) or specifically your Vercel URL.
     - Set `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.

2. **HEALTH CHECK:**
   - Ensure an `/api/health` endpoint exists that returns `{"status": "ok"}`.

3. **PUSH TO HF:**
   - Commit and Push these changes to the Hugging Face Space repository.

## Response snapshot

Updated `todo-web-app/backend/app/main.py`:
1. Root `GET /` now returns `{"message": "Todo AI Backend is Running", "status": "online"}`.
2. CORS set to `allow_origins=["*"]`, `allow_credentials=False` (wildcard + credentials=True is invalid per CORS spec).
3. Added `GET /api/health` → `{"status": "ok"}`.
4. HF push blocked — no Hugging Face remote configured; asked user for HF Space URL.

## Outcome

- Impact: Backend root and CORS updated for production compatibility with Hugging Face and Vercel.
- Tests: Manual endpoint verification required; no automated tests modified.
- Files: todo-web-app/backend/app/main.py
- Next prompts: User to provide HF Space URL; then add remote and push. Optionally lock CORS to specific Vercel origin once confirmed working.
- Reflection: `allow_credentials=True` with `allow_origins=["*"]` is a CORS spec violation — corrected to `False` to avoid silent browser failures.

## Evaluation notes (flywheel)

- The existing file already had CORSMiddleware and root/health endpoints — change was a targeted update, not a rewrite.
- HF deployment step could not be completed without remote URL — surfaced to user rather than guessing.
