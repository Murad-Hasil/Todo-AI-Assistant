---
id: 002
title: Phase 2 Web App Constitution
stage: constitution
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-phase1-todo-cli
user: brownie
command: /sp.constitution
labels: ["constitution","phase-2","todo-web-app","next-js","fastapi","jwt","better-auth","sqlmodel","neon","monorepo"]
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

Generate a revised constitution for Phase 2: Full-Stack Web Application based on the Project PDF (Pages 7-16) with the following strict constraints:

# MISSION
Transform the Todo application into a modern multi-user web application with persistent storage and JWT-based authentication.

# TECHNICAL STACK
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- Backend: Python FastAPI (v0.115+), Python 3.13.
- Database: Neon Serverless PostgreSQL.
- ORM: SQLModel.
- Authentication: Better Auth (Frontend) + JWT Token Verification (Backend).
- Deployment Environment: Vercel (Frontend), FastAPI (Service).

# DIRECTORY STRUCTURE (MONOREPO)
- Root: `/todo-web-app`
- Frontend: `/todo-web-app/frontend/`
- Backend: `/todo-web-app/backend/`
- Shared Specifications: `/todo-web-app/specs/` (organized by features/api/database/ui).

# CORE REQUIREMENTS
1. API First: All backend functionality must be exposed via RESTful endpoints under `/api/`.
2. Multi-User: Tasks must be strictly isolated by `user_id`.
3. Persistent Storage: Use SQLModel to interact with Neon PostgreSQL.
4. JWT Security: Backend must extract and verify JWTs from Better Auth via the `Authorization: Bearer <token>` header.

# DEVELOPMENT RULES
1. NON-DESTRUCTIVE INTEGRATION: Design Phase 2 so that Phase 3 (AI Chatbot) can be integrated without rewriting the core CRUD or Auth logic.
2. READ-BEFORE-WRITE: Agents must check both frontend and backend state before modifying code.
3. SPEC-DRIVEN: No code without `@specs/features/`, `@specs/api/`, or `@specs/database/` references.
4. MONOREPO PATTERN: Maintain a single CLAUDE.md at the root of `/todo-web-app` for context, plus sub-CLAUDE.md files in frontend/backend.

# AGENT BEHAVIOR
- Use Pydantic models for all request/response validation.
- Use Server Components by default in Next.js; use Client Components only for interactivity.
- Follow the API endpoint definitions exactly as provided in PDF Page 7.

## Response snapshot

Ratified constitution v2.0.0 (MAJOR bump from 1.0.0) at `.specify/memory/constitution.md` with 8 principles:
I. Strict Spec-Driven Development — no code without @specs/features/, @specs/api/, @specs/database/ artifact
II. Read-Before-Write — agents check both frontend AND backend state before modifying
III. Non-Destructive Integration — Phase 2 designed for Phase 3 AI Chatbot integration without CRUD/Auth rewrite
IV. API-First Architecture — all backend via /api/ RESTful; Pydantic validation required
V. Multi-User Data Isolation — every query scoped to verified user_id; cross-user leakage is critical violation
VI. JWT Security Contract — Bearer token only; dedicated FastAPI dependency; backend never issues tokens
VII. Monorepo Pattern — root CLAUDE.md + sub-CLAUDE.md in frontend/backend; specs/ by domain
VIII. Code Quality Standards — PEP8 + Black (Python), strict TypeScript, Server Components by default
Tech stack updated: Next.js 14+, FastAPI 0.115+, Neon PostgreSQL, SQLModel, Better Auth, Vercel.
All 4 templates verified — no structural changes required.

## Outcome

- ✅ Impact: Constitution amended to v2.0.0 for Phase 2 Full-Stack Web App; all 8 principles ratified
- 🧪 Tests: N/A — constitution artifact, no code tests
- 📁 Files: .specify/memory/constitution.md (overwritten)
- 🔁 Next prompts: /sp.specify to create feature spec for 002-phase2-todo-web-app
- 🧠 Reflection: MAJOR bump justified — 4 of 6 Phase 1 principles redefined; 2 new principles added; tech stack completely replaced

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): phase-2-amendment
- Next experiment: run /sp.specify with phase2 feature description referencing PDF pages 7-16
