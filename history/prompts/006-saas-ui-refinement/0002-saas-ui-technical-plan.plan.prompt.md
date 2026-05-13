---
id: 0002
title: SaaS UI Technical Plan Generation
stage: plan
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 006-saas-ui-refinement
branch: 006-saas-ui-refinement
user: brownie
command: /sp.plan
labels: ["plan","saas-ui","framer-motion","next.js","layout","sidebar","chat-drawer","animations"]
links:
  spec: specs/006-saas-ui-refinement/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/ui/saas-plan.md (created)
  - todo-web-app/specs/ui/ (directory created)
tests:
  - Manual visual verification at 320px/768px/1280px
  - Existing Phase 3 E2E regression (auth + CRUD + chat)
---

## Prompt

Generate a technical plan for Phase 3.4: SaaS UI/UX Refinement in `/todo-web-app/specs/ui/saas-plan.md` based strictly on the approved spec `@/todo-web-app/specs/ui/saas-refinement.md`.

The plan must include:
1. **NEXT.JS ROUTE & LAYOUT STRATEGY:**
   - **Public Layout:** Create a root layout for the Landing Page (`/`), Login, and Register pages with the SaaS Navbar and Footer.
   - **Authenticated Layout:** Implement a `(dashboard)` route group with a Sidebar layout for all protected routes.
   - **Mesh Backgrounds:** Implementation details for using CSS gradients or SVGs for high-end background textures.

2. **COMPONENT BREAKDOWN:**
   - `HeroSection`: Centered text with Framer Motion `initial/animate` states for a smooth entrance.
   - `BentoGrid`: A responsive CSS Grid (col-span-1, col-span-2) container for the 6-8 feature cards.
   - `Sidebar`: A collapsible or fixed left-hand navigation component with active state handling.
   - `ModernChatWidget`: A slide-out "Drawer" component (using Framer Motion `AnimatePresence`) for the AI Chatbot.
   - `GlassNavbar`: A sticky top bar with `backdrop-blur-md` and scroll-position-aware transparency.

3. **ANIMATION LOGIC (Framer Motion):**
   - Define a `framer-motion` utility or shared variants for consistent "Fade-In-Up" and "Staggered List" animations.
   - Implement "Spring" transitions for buttons and cards to give a tactile feel.

4. **STATE & REFACTORING:**
   - Plan for moving the Phase 3 Chat logic into the new `ChatWidget` component.
   - Ensure the Task List component is refactored into a "Clean Table" or "Minimalist Cards" view.

5. **DEPENDENCIES:**
   - Addition of `framer-motion` and `lucide-react` (if not already present).
   - Use of `clsx` or `tailwind-merge` for clean dynamic class handling.

## Response snapshot

Generated `todo-web-app/specs/ui/saas-plan.md` — a complete technical implementation plan covering:

- **Route/Layout Strategy**: Public pages (`/`, `/login`, `/register`) using per-page GlassNavbar + Footer; Dashboard with `DashboardShell` (Client Component) wrapping a persistent `Sidebar` + `ChatDrawer`; legacy `/sign-in` and `/sign-up` redirected to new routes.
- **Research resolutions**: Auth route rename strategy (create new routes, add redirect pages); Framer Motion App Router pattern (Client Components only, `useReducedMotion` for accessibility); Mesh gradients via `@layer utilities` in `globals.css`; Sidebar state via `DashboardShell` Client Component; `cn()` utility via `clsx` + `tailwind-merge`.
- **Component contracts**: `GlassNavbar` (scroll-aware), `HeroSection` (staggered fade-in-up), `BentoGrid`/`BentoCard` (6–8 cards, col-span variants, hover spring), `Sidebar` (Escape key, active pathname, mobile overlay), `ChatDrawer` (AnimatePresence slide-in, wraps existing ChatWindow unchanged), `TaskCardGrid` (enter/exit animations), `TaskPriorityBadge` (Low/Normal/High/Urgent).
- **Animation system**: `lib/animations.ts` exports `fadeInUp`, `staggerContainer`, `slideInRight`, `springTransition`, `easeTransition`, `reducedVariants`.
- **Dependencies**: `framer-motion ^11`, `tailwind-merge ^2`, `clsx ^2` (new); `lucide-react` already installed.
- **Middleware update**: matcher exclusions updated for `/login`, `/register`.
- **9-step implementation sequence** and 15-item acceptance checklist.

## Outcome

- ✅ Impact: Complete technical plan for Phase 3.4 SaaS UI/UX Refinement ready for `/sp.tasks` task generation.
- 🧪 Tests: No tests run (planning phase). Manual E2E verification steps defined in acceptance checklist.
- 📁 Files: `todo-web-app/specs/ui/saas-plan.md` created (new directory `specs/ui/` created).
- 🔁 Next prompts: Run `/sp.tasks` to generate `saas-tasks.md`; then proceed to implementation via `/sp.implement`.
- 🧠 Reflection: Auth route rename (sign-in→login, sign-up→register) required careful middleware/auth config analysis. DashboardShell pattern cleanly separates Server Component session reading from Client Component sidebar state management.

## Evaluation notes (flywheel)

- Failure modes observed: None — spec was complete; all NEEDS CLARIFICATION resolved in Phase 0 research.
- Graders run and results (PASS/FAIL): Constitution Check — 9/9 PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Verify ChatWindow Suspense boundary still works correctly when nested inside ChatDrawer before implementation begins.
