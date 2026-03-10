---
id: "0020"
title: E2E Testing K8s Chatbot Fixes
stage: general
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: "Ab testing our apna kaam start karo"
labels: ["e2e-testing","k8s","chatbot","bug-fix","groq","rate-limit"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/app/agent/prompts.py
  - todo-web-app/backend/app/agent/runner.py
  - todo-web-app/frontend/src/lib/api.ts
  - todo-web-app/frontend/src/components/chat/ChatWindow.tsx
tests:
  - curl E2E: GET / → 200, GET /api/health → 200
  - curl E2E: CRUD (create, list, complete, update, delete) — all PASS
  - curl E2E: Chat add task → tool_calls ["add_task"] PASS
  - curl E2E: Chat list tasks → tool_calls ["list_tasks"] PASS
  - curl E2E: Chat complete task → tool_calls ["list_tasks","complete_task"] PASS (after fix)
  - curl E2E: Chat delete task → confirmed DB empty after PASS
  - Chatbot via browser: PENDING (Groq TPD 100k limit hit)
---

## Prompt

Ab testing our apna kaam start karo. Local K8s E2E test karo — Minikube frontend/backend full flow (login, todos, chatbot).

## Response snapshot

Full E2E test suite run kiya curl se JWT auth ke sath:

**Bugs found and fixed:**

1. **Agent complete/delete flow** — Agent `complete_task` call karta tha bina `list_tasks` ke, `"task_id_from_list_tasks"` literal placeholder pass karta tha → Groq `tool_use_failed`. Fix: `prompts.py` mein `MANDATORY SEQUENCE RULE` add kiya.

2. **Frontend 429 crash** — `handleErrorStatus` mein 429 handle nahi tha → `sendChat` `{"detail":"..."}` return karta tha as `ChatSendResponse` → `data.tool_calls` undefined → `TypeError: Cannot read properties of undefined (reading 'length')`. Fix: `RateLimitError` class add ki + `handleErrorStatus` mein 429 handle kiya.

3. **Frontend NetworkError** — `NEXT_PUBLIC_API_URL=http://192.168.58.2:30800` baked tha — browser WSL2 se NodePort nahi reach kar sakta. Fix: Frontend rebuild with `http://localhost:8000`.

4. **Groq tool_use_failed** — llama-3.3-70b-versatile intermittently malformed tool calls generate karta hai. Fix: `runner.py` mein retry logic — 3 attempts, 1s delay between retries.

**Groq TPD limit:** 100k tokens/day hit — chatbot browser E2E PENDING.

## Outcome

- ✅ Impact: 4 bugs fixed — complete/delete flow, 429 crash, NetworkError, retry logic
- 🧪 Tests: REST CRUD all pass, Chat add/list/complete/delete via curl pass (pre-TPD limit)
- 📁 Files: prompts.py, runner.py, api.ts, ChatWindow.tsx, frontend rebuilt
- 🔁 Next prompts: "chatbot E2E browser test resume karo" — Groq limit clear hone ke baad
- 🧠 Reflection: Groq free tier 100k TPD debugging sessions mein jaldi khatam hoti hai; Dev Tier consider karo

## Evaluation notes (flywheel)

- Failure modes observed: Groq TPD exhaustion during debug; llama tool_use_failed intermittent; WSL2 NodePort unreachable from browser
- Graders run and results (PASS/FAIL): REST CRUD PASS, Chat curl PASS, Browser PENDING
- Prompt variant (if applicable): null
- Next experiment: Test chatbot browser E2E after Groq TPD reset; consider llama-3.1-8b-instant as fallback model
