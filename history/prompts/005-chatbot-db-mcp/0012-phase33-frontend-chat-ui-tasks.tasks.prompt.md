---
id: "0012"
title: Phase 3.3 Frontend Chat UI Tasks
stage: tasks
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.tasks
labels: ["tasks","chat-ui","frontend","phase3.3","next.js","tailwind","rtl","state-management"]
links:
  spec: todo-web-app/specs/chatbot/ui-design.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3-ui-tasks.md
tests:
  - null
---

## Prompt

Generate a task list for Phase 3.3: Frontend Chat UI in `/todo-web-app/specs/chatbot/phase3-ui-tasks.md` based strictly on the plan `@/todo-web-app/specs/chatbot/phase3-ui-plan.md`.

The task list must include:
1. UI SCAFFOLDING:
   - T-3.3.1: Chat Component Structure
   - T-3.3.2: Styling & Layout

2. STATE & DATA FLOW:
   - T-3.3.3: Message State Management
   - T-3.3.4: Message History Loader

3. INTERACTION & INTEGRATION:
   - T-3.3.5: Chat API Integration
   - T-3.3.6: Auto-Scroll & UX
   - T-3.3.7: Multi-language Rendering

4. AI-UI SYNCHRONIZATION:
   - T-3.3.8: Task List Revalidation

5. VERIFICATION CRITERIA:
   - T-3.3.5: user message sent → assistant bubble appears
   - T-3.3.8: "Add milk" → milk in Todo list without page refresh

6. STYLISTIC RULES: Use Task IDs in comments. Phase 2 Tailwind theme.

## Response snapshot

Generated `todo-web-app/specs/chatbot/phase3-ui-tasks.md` with 24 tasks across 7 phases.

Phase 1 (T001–T004): API types + sendChat + getChatHistory in api.ts; backend history route.
Phase 2 (T005–T006): max-w-5xl + grid layout.
Phase 3/US1 (T007–T013, P1 MVP): ChatMessageBubble, TypingIndicator, ChatPanel with state/send/input/styling. T-3.3.5 checkpoint.
Phase 4/US2 (T014–T016, P1): History fetch effect, router.refresh() revalidation, URL sync. T-3.3.8 checkpoint.
Phase 5/US3 (T017–T018, P2): Three auto-scroll effects, TypingIndicator wired.
Phase 6/US4 (T019–T021, P2): detectRTL utility, isRTL applied, dir attribute on bubbles.
Phase 7 (T022–T024): Error banner, accessibility, Phase 2 regression check.

Cross-reference table maps T-3.3.x → T001+ IDs. Total: 24 tasks. MVP: Phases 1–3 (T001–T013).

## Outcome

- ✅ Impact: 24 executable tasks covering all 8 user-requested areas (T-3.3.1–T-3.3.8). Each task has exact file path and implementation detail for direct coding.
- 🧪 Tests: Not included (not requested). Verification criteria provided as manual test steps per task.
- 📁 Files: todo-web-app/specs/chatbot/phase3-ui-tasks.md
- 🔁 Next prompts: /sp.implement to execute tasks | or direct interface-engineer agent invocation
- 🧠 Reflection: Organized by user story with clear checkpoints. router.refresh() vs revalidatePath distinction documented in notes. Backend T004 parallelized with frontend work.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Format validation PASS — all 24 tasks follow checklist format with IDs and file paths
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): implement Phase 3 MVP (T001–T013) via interface-engineer agent
