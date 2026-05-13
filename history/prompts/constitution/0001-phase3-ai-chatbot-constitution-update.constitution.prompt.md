---
id: "0001"
title: Phase 3 AI Chatbot Constitution Update
stage: constitution
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 004-nextjs-frontend
user: brownie
command: /sp.constitution
labels: ["constitution","phase3","ai-chatbot","mcp","groq","stateless","roman-urdu"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

Generate a revised constitution for Phase 3: AI-Powered Todo Chatbot based on the Project PDF (Pages 17-21) with the following strict constraints:

# MISSION
Integrate an AI-powered conversational interface (Chatbot) into the existing Todo Web App, allowing users to manage tasks via natural language.

# TECHNICAL STACK
- AI SDK: OpenAI Agents SDK (configured for Groq compatibility).
- Model Provider: Groq (Llama 3.1 / 3.3) via OpenAI-compatible endpoint.
- MCP Server: Official MCP SDK (Python) to expose Todo CRUD operations as tools.
- Frontend: OpenAI ChatKit-based UI integrated into the Next.js frontend.
- Backend: FastAPI (Stateless Request Cycle).
- Database: Neon PostgreSQL (storing Conversations and Messages).

# ARCHITECTURAL RULES
1. STATELESSNESS: The server must NOT hold session state. Conversation history must be fetched from the database for every AI request.
2. NON-DESTRUCTIVE INTEGRATION: Phase 3 logic must be built INSIDE the `/todo-web-app` directory without breaking Phase 2 CRUD or Auth logic.
3. MCP TOOL ENFORCEMENT: The AI Agent must ONLY interact with the Todo list via the specialized MCP tools (`add_task`, `list_tasks`, `complete_task`, etc.).
4. AGENT BEHAVIOR:
   - Always confirm actions with a friendly response.
   - Gracefully handle "task not found" or other logic errors.
   - Support Roman Urdu language (Bonus Point Requirement).

# DIRECTORY STRUCTURE
- Backend: `/todo-web-app/backend/app/agent/` (AI logic) and `/todo-web-app/backend/app/mcp/` (MCP tools).
- Frontend: `/todo-web-app/frontend/app/chat/` (Chat interface).
- Specs: `/todo-web-app/specs/chatbot/` (Feature specs).

# SECURITY
- Every chat request MUST be authenticated via JWT (reusing Phase 2 logic).
- The AI Agent can ONLY access tasks belonging to the currently authenticated user.

# AGENT BRAIN CONFIG (GROQ)
- Base URL: `https://api.groq.com/openai/v1`
- Model: `llama-3.3-70b-versatile` (or current Groq equivalent).

## Response snapshot

Constitution bumped from v2.0.0 → v2.1.0 (MINOR — 3 new principles added, no
existing principles removed or redefined).

Key changes to `.specify/memory/constitution.md`:
- Added Principle IX: Stateless AI Request Cycle — no in-memory conversation state;
  full history fetched from Neon PostgreSQL on every request.
- Added Principle X: MCP Tool Enforcement — AI agent MUST interact with todos
  exclusively via MCP tools (add_task, list_tasks, complete_task, update_task,
  delete_task); direct DB/service access from agent code is forbidden.
- Added Principle XI: Agent Behavior Contract — friendly confirmations, graceful
  error handling, Roman Urdu language support, no internal tool-call leakage to user.
- Extended Principle V (Multi-User Data Isolation) to cover conversations and messages.
- Extended Principle VI (JWT Security Contract) to explicitly cover `/api/chat`.
- Extended Principle VII (Monorepo Pattern) to include `specs/chatbot/`.
- Expanded Technical Stack: ChatKit UI, OpenAI Agents SDK, Groq llama-3.3-70b,
  MCP SDK (Python), Phase 3 Neon tables (conversations, messages), GROQ_API_KEY env var.
- Added Phase 3 Core Features section (7 features).
- Expanded Directory Layout to include agent/, mcp/, app/chat/, specs/chatbot/.
- Updated Sync Impact Report HTML comment at top of constitution file.
- All 8 templates checked — no template edits required (generic templates remain valid).

## Outcome

- ✅ Impact: Constitution v2.1.0 ratified for Phase 3 AI Chatbot; 3 new principles govern AI agent architecture, MCP tool boundary, and agent UX contract.
- 🧪 Tests: null
- 📁 Files: .specify/memory/constitution.md (overwritten with v2.1.0)
- 🔁 Next prompts: /sp.specify for chatbot feature spec, then /sp.plan, /sp.tasks, then implementation
- 🧠 Reflection: Version bump correctly classified as MINOR (additions only). Phase 2 principles I–VIII retained verbatim, ensuring backward compatibility with existing CRUD and auth logic.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): manual validation — no unresolved bracket tokens, version matches report, dates ISO format, principles declarative and testable
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
