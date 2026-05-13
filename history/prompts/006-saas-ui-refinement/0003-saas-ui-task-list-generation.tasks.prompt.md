---
id: 0003
title: SaaS UI Task List Generation
stage: tasks
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 006-saas-ui-refinement
branch: 006-saas-ui-refinement
user: brownie
command: /sp.tasks
labels: ["tasks","saas-ui","framer-motion","next.js","sidebar","bento-grid","chat-drawer","task-list","animations"]
links:
  spec: specs/006-saas-ui-refinement/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/ui/saas-tasks.md (created)
tests:
  - Manual verification per task checkpoint
  - Phase 3 non-regression: auth + CRUD + chat flows
---

## Prompt

Generate a task list for Phase 3.4: SaaS UI/UX Refinement in `/todo-web-app/specs/ui/saas-tasks.md` based strictly on the plan `@/todo-web-app/specs/ui/saas-plan.md`.

The task list must include:
1. **FOUNDATION & DEPENDENCIES:**
   - T-3.4.1: UI Scaffolding (Update `package.json` with `framer-motion`, `lucide-react`, and `clsx`. Setup global CSS variables for mesh gradients).
   - T-3.4.2: Asset & Theme Setup (Configure brand colors and a professional sans-serif font like Inter or Geist).

2. **MARKETING LAYER (Landing Page):**
   - T-3.4.3: GlassNavbar & Footer (Implement the responsive, backdrop-blur navbar and the clean 4-column footer).
   - T-3.4.4: Hero Section (Implement the high-end hero with Framer Motion entrance animations and CTA buttons).
   - T-3.4.5: Bento Feature Grid (Implement the 6-8 feature cards using a responsive Bento-box CSS Grid layout).

3. **AUTHENTICATION REFINEMENT:**
   - T-3.4.6: Modern Auth UI (Refactor Login and Register pages into minimalist centered cards with smooth transitions).

4. **PRODUCT LAYER (Dashboard):**
   - T-3.4.7: Dashboard Sidebar Layout (Implement the fixed sidebar navigation and main content area for the authenticated routes).
   - T-3.4.8: Refined Task List (Refactor the Task List into a professional, clean table or card-grid view with subtle shadows).
   - T-3.4.9: Modern Chat Widget (Transform the Phase 3 Chat logic into a slide-out drawer or floating panel using Framer Motion `AnimatePresence`).

5. **GLOBAL INTERACTION & POLISH:**
   - T-3.4.10: Motion Enhancements (Apply staggered list animations to tasks and hover transitions to all interactive elements).

6. **VERIFICATION CRITERIA:**
   - T-3.4.5 is verified when the Bento Grid scales correctly from mobile (1 col) to desktop (3-4 cols).
   - T-3.4.9 is verified when the chatbot opens and closes smoothly without refreshing the page or losing conversation state.

7. **STYLISTIC RULES:**
   - Use Task IDs in comments: `// [Task]: T-3.4.x`.
   - Maintain all Phase 3 functionality (Auth, DB, Chat API) perfectly intact.

## Response snapshot

Generated `todo-web-app/specs/ui/saas-tasks.md` — 28 tasks across 8 phases organized by the 5 user stories from spec.md:

- **Phase 1 (5 tasks)**: npm install framer-motion/tailwind-merge/clsx; create `lib/utils.ts` (cn helper); create `lib/animations.ts` (shared Framer Motion variants); extend globals.css with mesh gradient utilities; update middleware matcher.
- **Phase 2 (2 tasks)**: GlassNavbar.tsx (scroll-aware, mobile hamburger); Footer.tsx (4-column grid).
- **Phase 3 — US1 P1 (4 tasks)**: Convert app/page.tsx to landing page; HeroSection.tsx (staggered fadeInUp); BentoCard.tsx (hover spring); BentoGrid.tsx (6-card data, responsive grid).
- **Phase 4 — US2 P2 (5 tasks)**: login/page.tsx; register/page.tsx; redirect sign-in→login; redirect sign-up→register; update auth-client callback URLs.
- **Phase 5 — US3 P2 (3 tasks)**: Sidebar.tsx (AnimatePresence mobile overlay, Escape key); DashboardShell.tsx (Client Component owning sidebar+chat state); dashboard/layout.tsx (Server Component → renders DashboardShell).
- **Phase 6 — US4 P3 (1 task)**: ChatDrawer.tsx (AnimatePresence slide-in, wraps existing ChatWindow unchanged, full-width mobile).
- **Phase 7 — US5 P3 (3 tasks)**: TaskPriorityBadge.tsx (4-tier color map); TaskCardGrid.tsx (stagger container, AnimatePresence exit); dashboard/page.tsx (uses TaskCardGrid, removes two-column grid).
- **Phase 8 — Polish (5 tasks)**: Hover springs on CTAs + BentoCards; Sidebar mount animation; accessibility focus rings + WCAG contrast; full non-regression check.
- **15 of 28 tasks marked [P]** (parallelizable).

## Outcome

- ✅ Impact: 28 immediately executable tasks cover all 5 user stories (P1–P3) and all 15 acceptance criteria from saas-plan.md.
- 🧪 Tests: Manual verification checkpoints at end of each phase. Non-regression run defined in T-3.4.28.
- 📁 Files: `todo-web-app/specs/ui/saas-tasks.md` created.
- 🔁 Next prompts: Run `/sp.implement` or `interface-engineer` agent to execute tasks sequentially starting from Phase 1.
- 🧠 Reflection: Task numbering follows user-specified T-3.4.x scheme. Each task includes exact file path, implementation contract, and non-regression constraint. ChatWindow is marked untouchable — ChatDrawer wraps it without modification.

## Evaluation notes (flywheel)

- Failure modes observed: None — plan was complete; user story priorities mapped cleanly to phase order.
- Graders run and results (PASS/FAIL): Format validation — all 28 tasks follow checkbox + ID + [P?] + [Story?] + description + file path format.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Consider extracting FilterBar tabs into TaskCardGrid to preserve All/Pending/Completed filtering in the new card view (currently left as agent discretion in T-3.4.23 notes).
