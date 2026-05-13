---
id: "0011"
title: Phase 3.3 Frontend Chat UI Plan
stage: plan
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: /sp.plan
labels: ["plan","chat-ui","frontend","phase3.3","next.js","tailwind","rtl","state-management"]
links:
  spec: todo-web-app/specs/chatbot/ui-design.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/chatbot/phase3-ui-plan.md
  - specs/005-chatbot-db-mcp/research.md
  - specs/005-chatbot-db-mcp/data-model.md
tests:
  - null
---

## Prompt

Generate the technical plan for Phase 3.3: Frontend Chat UI in `/todo-web-app/specs/chatbot/phase3-ui-plan.md` based strictly on the approved specs in `@/todo-web-app/specs/chatbot/`.

The plan must include:
1. COMPONENT ARCHITECTURE:
   - `ChatWindow`: A main container (Client Component) to manage the chat state and message list.
   - `MessageBubble`: A presentation component to render individual messages with role-based styling (User vs. Assistant).
   - `ChatInput`: A form component for user input with a loading state during AI processing.
   - Integration: Decide whether to place the chat in a sidebar or a floating toggle on the `/dashboard` page.

2. STATE MANAGEMENT:
   - `messages`: An array of objects `[{role, content}]`.
   - `conversationId`: To track the current session; fetched from the first response if not present.
   - `isProcessing`: Boolean to handle UI disabling and loading indicators.

3. DATA FETCHING & API INTERACTION:
   - Fetching History: Use an effect or a server action to load existing messages from the backend when a `conversation_id` is present.
   - Sending Messages: Use the centralized `@/lib/api.ts` to POST to `/api/{user_id}/chat`.
   - Revalidation: Logic to trigger a refresh of the Task List (from Phase 2) whenever the AI response includes successful `tool_calls`.

4. UI/UX ENHANCEMENTS:
   - Implementation of auto-scroll logic using `useRef` and `useEffect`.
   - Tailwind styling for a "Modern AI" aesthetic (e.g., glassmorphism or clean cards).
   - Support for Urdu font rendering and RTL alignment logic.

5. TOOL CALL VISUALIZATION:
   - Define a way to show "Agent is updating your tasks..." if the backend returns `tool_calls`.

## Response snapshot

Generated a comprehensive Phase 3.3 technical implementation plan across four artifacts:

**`todo-web-app/specs/chatbot/phase3-ui-plan.md`** — Main plan covering:

1. **Component Architecture**: Dedicated two-column side panel (rejected floating — `max-w-3xl` has no room). Layout: `lg:grid-cols-[1fr_380px]`. Three new components: `ChatPanel.tsx` (Client, state owner), `ChatMessageBubble.tsx` (presentational, RTL-aware), `TypingIndicator.tsx` (animated dots + tool label). Two modified files: `dashboard/page.tsx` (grid + Suspense), `dashboard/layout.tsx` (`max-w-3xl` → `max-w-5xl` in `<main>` only).

2. **State Management**: `ChatMessage` interface (`id`, `role`, `content`, `isRTL`, `createdAt`) + `ConversationState` (`conversationId`, `messages`, `isLoading`, `lastToolCalls`, `error`). `conversationId` authoritative in URL query param; React state is in-memory mirror. `router.replace` (not `push`) to avoid history pollution.

3. **Data Fetching**: `sendChat()` + `getChatHistory()` added to `api.ts` (both via `fetchWithAuth`). Four new TypeScript interfaces. Mount `useEffect` with `cancelled` flag for history fetch; graceful 404 handling (clear `conversationId`, render empty window). `router.refresh()` after write `tool_calls` (not `revalidatePath` — wrong context). Backend history endpoint `GET /conversations/{id}/messages` identified as required addition (25 lines, existing models).

4. **UI/UX**: Three `useEffect` hooks for auto-scroll (messages change → smooth, history load → instant, `isLoading` → smooth). RTL: `/[\u0600-\u06FF]/g` regex with 10% threshold; `dir` HTML attribute + `text-right` CSS. Tailwind tokens: `bg-blue-600`/`bg-gray-100` for bubbles, `lg:sticky lg:top-8` for panel positioning.

5. **Tool Visualization**: `TypingIndicator` with `getStatusLabel(toolCalls)` — maps write tools → "Updating Tasks…", `list_tasks` → "Fetching Tasks…", empty → "Thinking…". Tailwind `animate-bounce` with `animation-delay` for cascading dots.

Constitution Check: All 11 principles pass. No violations.
Implementation sequencing: 7 steps (api.ts → bubble → indicator → panel → page → layout → backend route, Steps 1-6 parallel to Step 7).

**`specs/005-chatbot-db-mcp/research.md`** — 7 Phase 3.3 findings appended.
**`specs/005-chatbot-db-mcp/data-model.md`** — Phase 3.3 client-side TypeScript types appended.

## Outcome

- ✅ Impact: Phase 3.3 implementation plan is complete and unambiguous. All 5 user-requested sections covered. Three component files, two modified files, one API addition, one backend route addition — all with exact code patterns. Ready for `/sp.tasks`.
- 🧪 Tests: No code tests (plan stage). Acceptance criteria mapped in plan section 9.
- 📁 Files: todo-web-app/specs/chatbot/phase3-ui-plan.md, specs/005-chatbot-db-mcp/research.md, specs/005-chatbot-db-mcp/data-model.md
- 🔁 Next prompts: `/sp.tasks` for Phase 3.3 implementation task list | Implementation via `/sp.implement`
- 🧠 Reflection: Key architectural insight: `router.refresh()` vs `revalidatePath` distinction is critical for Next.js 14 App Router. The `useSearchParams()` Suspense boundary requirement was caught proactively. The backend history endpoint gap was identified and a graceful degradation strategy was built in from the start.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check PASS — all 11 principles verified
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): `/sp.tasks` to generate atomic implementation tasks referencing plan section numbers
