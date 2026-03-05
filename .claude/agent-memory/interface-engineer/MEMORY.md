# Interface Engineer — Persistent Memory

## Project: Hackathon-II Todo Web App Frontend

### Key File Paths
- Frontend root: `/home/brownie/projects/hackathon-II/todo-web-app/frontend/`
- App router: `src/app/` (Next.js 16.1.6, Turbopack)
- Components: `src/components/`
- Lib: `src/lib/` (api.ts, auth.ts, auth-client.ts, utils.ts, animations.ts)
- CLAUDE.md: `todo-web-app/frontend/CLAUDE.md` (keep updated after each phase)

### READ-ONLY Files (Never Modify)
- `src/lib/api.ts` — Task type has NO priority field; 401 redirects to `/sign-in?reason=session_expired`
- `src/lib/auth.ts` — server-side Better Auth
- `src/lib/auth-client.ts` — client-side Better Auth
- `src/lib/server-token.ts` — HS256 JWT signing
- `src/components/chat/ChatWindow.tsx` — complex Phase 3.3 state; requires `<Suspense>` in parent
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/MessageBubble.tsx`

### Critical Patterns

**useSearchParams Suspense Boundary (Next.js 16)**
Any page using `useSearchParams()` causes build failure if not wrapped in Suspense.
Pattern: create a `page.tsx` shell with `<Suspense>` wrapping a `Form.tsx` inner component.
Example: `app/login/page.tsx` + `app/login/LoginForm.tsx`.

**npm install on this project**
Requires `--legacy-peer-deps` due to eslint-config-next peer dep conflict with eslint@8.

**ChatWindow CSS override in drawer**
Use `[&>div]:h-full [&>div]:rounded-none [&>div]:border-0` on wrapper div to override
ChatWindow's inner div styles without modifying ChatWindow.tsx.

**Middleware deprecation warning**
Next.js 16 warns: `"middleware" file convention is deprecated; use "proxy"`. Not blocking — build succeeds.

### Phase 3.4 Architecture (Current)
- Landing page at `/` — dark mesh-gradient, GlassNavbar, HeroSection, BentoGrid, Footer
- Auth routes: `/login` (primary), `/register` (primary); `/sign-in` → `/login`, `/sign-up` → `/register`
- Dashboard uses DashboardShell (Client) → Sidebar (fixed desktop, overlay mobile) + ChatDrawer
- Task list uses TaskCardGrid (animated 2-col grid) + TaskPriorityBadge (always "Normal" — no priority in Task type)
- Chat accessed via ChatDrawer (slide-out right panel) triggered from Sidebar "AI Chat" button

### Dark Theme Tokens (no Tailwind config additions needed)
- Dashboard bg: `bg-[#0f0f1a]`
- Sidebar/drawer bg: `bg-[#0d0d1a]`
- Borders: `border-white/10`
- Cards: `bg-white/5`
- Auth bg: `.mesh-bg-auth` (CSS utility in globals.css)
- Landing bg: `.mesh-bg-landing` (CSS utility in globals.css)

### Framer Motion Rules
- Always check `useReducedMotion()` and use `reducedVariants(variants)` when true
- `springTransition`: stiffness 380, damping 30 — for hover/tap
- `easeTransition`: 0.4s — for page-level entrances
- `staggerContainer` + `fadeInUp` for list-enter animations
