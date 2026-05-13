---
id: "0005"
title: "Phase 3.2 AI Agent Chat Spec"
stage: spec
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.specify
labels: ["spec","ai-agent","chat-endpoint","groq","openai-agents-sdk","phase3.2"]
links:
  spec: todo-web-app/specs/chatbot/phase3.2-spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3.2-spec.md
  - todo-web-app/specs/chatbot/api-endpoint.md
  - todo-web-app/specs/chatbot/cycle-logic.md
  - specs/005-chatbot-db-mcp/checklists/phase3.2-requirements.md
tests:
  - none (spec stage — no implementation tests)
---

## Prompt

Generate the specification for Phase 3.2: AI Agent Logic & Stateless Backend Endpoint in the `/todo-web-app/specs/chatbot/` directory, derived strictly from the Project PDF (Pages 17, 18, and 20). The specification must cover: CHAT API ENDPOINT (POST /api/{user_id}/chat), STATELESS REQUEST CYCLE (7 steps), AGENT SYSTEM PROMPT (Helpful Todo Architect persona), and ACCEPTANCE CRITERIA (stateless backend, tool logging, JWT protection).

## Response snapshot

Created 3 spec files + 1 checklist for Phase 3.2:
1. `phase3.2-spec.md` — main spec: 3 user stories (task chat P1, conversation continuity P1, Roman Urdu P2), 13 FRs, 7 SCs, 7 edge cases.
2. `api-endpoint.md` — technical API contract: POST /api/{user_id}/chat, ChatRequest/ChatResponse Pydantic schemas, error table, cURL examples, env vars.
3. `cycle-logic.md` — 7-step stateless cycle with code patterns, SYSTEM_PROMPT, logging contract, new files list, constitution compliance table.
4. `phase3.2-requirements.md` — checklist: all items pass.

Key decision: conversation_id is UUID string (not int as stated in PDF) — matches Phase 3.1 schema. Documented explicitly.

## Outcome

- ✅ Impact: Phase 3.2 fully specified — ready for /sp.plan
- 🧪 Tests: Checklist: 12/12 items pass
- 📁 Files: 4 files created
- 🔁 Next prompts: /sp.plan for Phase 3.2 implementation plan
- 🧠 Reflection: PDF uses int for conversation_id; Phase 3.1 already uses UUID — spec aligns with implementation, not PDF wording. Noted explicitly to prevent implementation confusion.

## Evaluation notes (flywheel)

- Failure modes observed: PDF type mismatch (int vs UUID) — resolved by aligning with implemented schema
- Graders run and results (PASS/FAIL): Spec checklist 12/12 PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add sequence diagram to cycle-logic.md for visual clarity
