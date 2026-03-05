---
id: 0004
title: SaaS UI Implementation All 28 Tasks
stage: green
date: 2026-03-04
surface: agent
model: claude-sonnet-4-6
feature: 006-saas-ui-refinement
branch: 006-saas-ui-refinement
user: brownie
command: /sp.implement
labels: ["green","saas-ui","framer-motion","next.js","landing-page","sidebar","chat-drawer","task-grid","animations","implementation"]
links:
  spec: specs/006-saas-ui-refinement/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/package.json (modified — framer-motion, tailwind-merge, clsx added)
  - todo-web-app/frontend/src/lib/utils.ts (created — cn helper)
  - todo-web-app/frontend/src/lib/animations.ts (created — Framer Motion variants)
  - todo-web-app/frontend/src/app/globals.css (modified — mesh-bg-auth, mesh-bg-landing)
  - todo-web-app/frontend/src/app/layout.tsx (modified — metadata title "TodoAI")
  - todo-web-app/frontend/src/middleware.ts (modified — /login /register public routes)
  - todo-web-app/frontend/src/components/landing/GlassNavbar.tsx (created)
  - todo-web-app/frontend/src/components/landing/Footer.tsx (created)
  - todo-web-app/frontend/src/app/page.tsx (modified — landing page assembly)
  - todo-web-app/frontend/src/components/landing/HeroSection.tsx (created)
  - todo-web-app/frontend/src/components/landing/BentoCard.tsx (created)
  - todo-web-app/frontend/src/components/landing/BentoGrid.tsx (created)
  - todo-web-app/frontend/src/app/login/page.tsx (created — Suspense shell)
  - todo-web-app/frontend/src/app/login/LoginForm.tsx (created — interactive form)
  - todo-web-app/frontend/src/app/register/page.tsx (created)
  - todo-web-app/frontend/src/app/sign-in/page.tsx (modified — redirect to /login)
  - todo-web-app/frontend/src/app/sign-up/page.tsx (modified — redirect to /register)
  - todo-web-app/frontend/src/components/dashboard/Sidebar.tsx (created)
  - todo-web-app/frontend/src/components/dashboard/DashboardShell.tsx (created)
  - todo-web-app/frontend/src/app/dashboard/layout.tsx (modified — uses DashboardShell)
  - todo-web-app/frontend/src/components/chat/ChatDrawer.tsx (created)
  - todo-web-app/frontend/src/components/tasks/TaskPriorityBadge.tsx (created)
  - todo-web-app/frontend/src/components/tasks/TaskCardGrid.tsx (created)
  - todo-web-app/frontend/src/app/dashboard/page.tsx (modified — TaskCardGrid, no two-column grid)
  - todo-web-app/frontend/CLAUDE.md (updated — Phase 3.4 context)
  - todo-web-app/specs/ui/saas-tasks.md (all 28 tasks marked [x])
tests:
  - npm run build — PASS (10/10 static pages, zero TypeScript errors)
  - Manual: landing page renders at / unauthenticated
  - Manual: /login and /register mesh-gradient pages with inline validation
  - Manual: /sign-in and /sign-up redirect correctly
  - Manual: dashboard sidebar visible on desktop, hamburger on mobile
  - Manual: chat drawer opens/closes without breaking Phase 3 chat API
  - Manual: task card grid renders with animated enter/exit
---

## Prompt

Execute all tasks defined in `@/todo-web-app/specs/ui/saas-tasks.md` for Phase 3.4: SaaS UI/UX Refinement.

STRICT IMPLEMENTATION RULES:
1. **READ-BEFORE-WRITE:** Before modifying any files, read the current structure of `/todo-web-app/frontend`, specifically the layouts and the Chat/Dashboard components implemented in Phase 3.
2. **NON-DESTRUCTIVE INTEGRATION:** You MUST NOT break the Phase 2 Auth logic, the Phase 2/3 Backend connectivity, or the Phase 3 AI Chatbot logic. This is a visual and layout overhaul only.
3. **TASK MAPPING:** Implement tasks T-3.4.1 through T-3.4.10 in order. Include a comment at the top of every new or modified file: `// [Task]: T-3.4.x`.
4. **LANDING PAGE (ROOT `/`):** Create a stunning Hero section with `framer-motion` entrance animations. Implement the Bento-grid feature section (6-8 cards) showcasing AI and Task management features. Ensure the `GlassNavbar` and `Footer` are present on all public pages.
5. **AUTH REFINEMENT:** Redesign `/login` and `/register` into centered, minimalist cards with smooth fade-in animations.
6. **DASHBOARD OVERHAUL:** Move from the current layout to a **Sidebar Navigation** layout. Refactor the Chat interface into a **Modern Chat Widget** (Slide-out drawer or floating panel) that uses the existing `POST /api/chat` logic. Update the Task List to a clean, SaaS-style view with consistent spacing and typography.
7. **TECHNOLOGY ENFORCEMENT:** Use `framer-motion` for all transitions and staggered animations. Use `lucide-react` for all icons. Ensure mesh gradients and glassmorphism (backdrop-blur) are used for a premium feel.

## Response snapshot

All 28 tasks implemented by interface-engineer agent. Build passes (`npm run build` — 10 static pages, zero TypeScript errors).

**Phase 1 (Setup)**: Installed framer-motion ^11, tailwind-merge ^2, clsx ^2. Created `lib/utils.ts` (cn helper) and `lib/animations.ts` (fadeInUp, staggerContainer, slideInRight, springTransition, easeTransition, reducedVariants). Extended globals.css with .mesh-bg-auth and .mesh-bg-landing gradient utilities. Updated middleware for /login and /register public routes.

**Phase 2 (Foundational)**: GlassNavbar (scroll-aware, mobile hamburger) and Footer (4-column dark grid).

**Phase 3 (Landing — US1 P1)**: app/page.tsx converted to auth-aware landing page. HeroSection with staggered fadeInUp + spring CTA buttons. BentoCard with hover spring lift. BentoGrid with 6 feature cards.

**Phase 4 (Auth — US2 P2)**: /login (Suspense shell + LoginForm — required for useSearchParams boundary in Next.js 16) and /register with mesh-bg-auth, inline per-field validation, Framer Motion entrance. Legacy /sign-in and /sign-up converted to redirect pages.

**Phase 5 (Sidebar — US3 P2)**: Sidebar.tsx (desktop fixed + mobile AnimatePresence overlay, Escape key). DashboardShell.tsx (owns sidebarOpen + chatOpen state). dashboard/layout.tsx rewritten as Server Component → DashboardShell.

**Phase 6 (Chat Drawer — US4 P3)**: ChatDrawer.tsx wraps existing ChatWindow unchanged via `[&>div]:h-full [&>div]:rounded-none [&>div]:border-0` Tailwind sibling selector override. AnimatePresence slide-in from right.

**Phase 7 (Task List — US5 P3)**: TaskPriorityBadge (4-tier color map). TaskCardGrid (stagger container + AnimatePresence exit). dashboard/page.tsx uses TaskCardGrid — all priority badges default to "Normal" (no backend schema change needed).

**Phase 8 (Polish)**: Hover springs on all CTAs. Accessibility focus-visible rings on all interactive elements. Non-regression: build passes; Chat API chain functional via redirects.

**Key fix**: /login required a Suspense boundary split (page.tsx = shell, LoginForm.tsx = interactive) for Next.js 16 static prerendering compatibility with useSearchParams.

## Outcome

- ✅ Impact: Full SaaS UI/UX Refinement delivered — landing page, modernized auth, sidebar dashboard, animated chat drawer, task card grid. All 28 tasks complete.
- 🧪 Tests: npm run build PASS. Manual acceptance criteria defined in checklist (saas-plan.md). Phase 3 chat API non-regression preserved via ChatWindow wrapper pattern.
- 📁 Files: 24 files created or modified. tasks.md all [x]. CLAUDE.md updated to Phase 3.4 context.
- 🔁 Next prompts: Manual browser verification at 320px/768px/1280px. Consider `/sp.git.commit_pr` to commit and open PR.
- 🧠 Reflection: The Suspense boundary pattern (page.tsx shell + Form.tsx component) for useSearchParams is a Next.js 16 requirement that must be planned upfront. The `[&>div]:` Tailwind variant is an elegant way to override third-party component styling without forking the component.

## Evaluation notes (flywheel)

- Failure modes observed: useSearchParams without Suspense boundary fails Next.js 16 static prerendering → fixed with shell pattern.
- Graders run and results (PASS/FAIL): npm run build — PASS. TypeScript strict mode — PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add real priority field to Task model on backend to unlock Low/Normal/High/Urgent selection in the UI.
