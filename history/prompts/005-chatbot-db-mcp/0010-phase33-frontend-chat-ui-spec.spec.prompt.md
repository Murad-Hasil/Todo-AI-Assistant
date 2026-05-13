---
id: "0010"
title: Phase 3.3 Frontend Chat UI Spec
stage: spec
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.specify
labels: ["spec","chat-ui","frontend","phase3.3","rtl","conversation-management","api-integration"]
links:
  spec: todo-web-app/specs/chatbot/ui-design.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/ui-design.md
  - todo-web-app/specs/chatbot/ui-logic.md
  - todo-web-app/specs/chatbot/checklists/phase3.3-requirements.md
tests:
  - null
---

## Prompt

Generate the specification for Phase 3.3: Frontend Chat UI in the `/todo-web-app/specs/chatbot/` directory, derived strictly from the Project PDF (Pages 17, 20, and 21).

The specification must cover:
1. CHAT INTERFACE DESIGN (@specs/chatbot/ui-design.md):
   - Component: A floating or dedicated Chat Window in the Dashboard.
   - Message Bubbles: Distinct styles for 'User' and 'Assistant'.
   - Loading States: Visual indicator (typing bubble) while the AI is processing/calling tools.
   - Urdu Support: The UI must correctly render RTL (Right-to-Left) text if the AI responds in Urdu.

2. CONVERSATION MANAGEMENT (@specs/chatbot/ui-logic.md):
   - State: Store the `conversation_id` in the component state or URL to maintain the thread.
   - Message History: On page load, fetch previous messages for the active `conversation_id` from the backend.
   - Auto-scroll: The chat window should automatically scroll to the latest message.

3. API INTEGRATION:
   - Client: Use the existing `@/lib/api.ts` to call `POST /api/{user_id}/chat`.
   - Security: Ensure the JWT token is attached to every chat request.

4. TOOL FEEDBACK (Bonus):
   - Visual feedback when the AI is "Thinking" or "Updating Tasks" (based on `tool_calls` in the response).

5. ACCEPTANCE CRITERIA:
   - Users can type a natural language command (e.g., "Add a task to buy milk") and see the task appear in the list after the AI confirms.
   - The chat history persists after a page refresh.
   - The UI follows the Tailwind CSS patterns established in Phase 2.

## Response snapshot

Created two specification files in `todo-web-app/specs/chatbot/`:

1. **`ui-design.md`** — Chat Interface Design specification covering:
   - 4 User Stories (P1–P3): send/receive, visual distinction, Urdu RTL rendering, tool feedback indicator
   - 10 Functional Requirements (FR-001–FR-010): Chat Window placement, bubble styles, typing indicator, RTL detection heuristic (U+0600–U+06FF), Send button guard, tool status labels, Tailwind CSS alignment, accessibility
   - 6 Success Criteria (SC-001–SC-006): visual readability, RTL browser compatibility, 100ms typing indicator, 375px–1440px responsive, Lighthouse ≥90, empty-input prevention
   - Design notes: colour tokens derived from Phase 2 (`blue-600`, `gray-100`), RTL heuristic, floating vs. dedicated panel recommendation

2. **`ui-logic.md`** — Conversation Management & API Integration specification covering:
   - 4 User Stories (P1): history persistence, conversation threading, auto-scroll, JWT security
   - 11 Functional Requirements (FR-001–FR-011): URL-based `conversation_id`, history fetch on mount, `sendChat` API function contract, task list refresh via `router.refresh()`, error mapping, RTL flag computation, tool_calls passthrough to typing indicator
   - 6 Success Criteria (SC-001–SC-006): 100% history restore, task list refresh, zero unauth requests, URL/state consistency, auto-scroll timing, error class mapping
   - API contract reference from `api-endpoint.md`, error→behaviour mapping table, implementation notes

3. **`checklists/phase3.3-requirements.md`** — Quality checklist: all items pass.

## Outcome

- ✅ Impact: Phase 3.3 frontend spec is complete and ready for `/sp.plan`. Both spec files cover all five user-specified areas (design, conversation management, API integration, tool feedback, acceptance criteria) with zero NEEDS CLARIFICATION markers.
- 🧪 Tests: No code tests (spec stage). Acceptance scenarios serve as test definitions.
- 📁 Files: todo-web-app/specs/chatbot/ui-design.md, todo-web-app/specs/chatbot/ui-logic.md, todo-web-app/specs/chatbot/checklists/phase3.3-requirements.md
- 🔁 Next prompts: `/sp.plan` for Phase 3.3 implementation architecture | `/sp.clarify` if any requirements need refinement
- 🧠 Reflection: Derived spec cleanly from existing Phase 3.1/3.2 artifacts (api-endpoint.md, behavior.md, api.ts) without introducing implementation details. RTL detection heuristic and floating/dedicated panel choice are documented as assumptions in the design notes section.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): checklist validation PASS — all items checked
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): add `/sp.clarify` pass to validate RTL heuristic threshold (10%) with user before planning
