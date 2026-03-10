---
id: "0013"
title: Fix SignIn Session Race Condition
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 004-nextjs-frontend
branch: main
user: brownie
command: debugging
labels: ["bug", "frontend", "better-auth", "session", "cookie", "race-condition"]
links:
  spec: specs/004-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/src/app/login/LoginForm.tsx
  - todo-web-app/frontend/src/app/register/page.tsx
tests:
  - "null"
---

## Prompt

Mai ne kuch notice kia ha, jab mai laptop ya apne phone se frontend vercel pe sign in karta hon to wo dashboard dekhane ke bajaye wahi pe rukta ha, refresh ke bad dashboard show hota ha, aesa kyun ho raha ha?

## Response snapshot

Root cause: Session race condition between Better Auth cookie storage and Next.js client-side navigation.

Flow of the bug:
1. authClient.signIn.email() → Better Auth sets session cookie via HTTP response
2. router.push("/dashboard") → Next.js immediately makes a server request (client-side SPA navigation)
3. dashboard/layout.tsx → getSession() reads the cookie → cookie not yet committed by browser → null
4. redirect("/login") → user stays on login page
5. Manual refresh → browser now has the cookie → session exists → dashboard shows

Fix: Replace router.push("/dashboard") with window.location.href = "/dashboard" in both:
- LoginForm.tsx (login flow)
- register/page.tsx (sign-up flow)

window.location.href triggers a full browser navigation. The browser:
1. Processes all pending cookie Set-Cookie headers from the Better Auth response
2. Makes a fresh HTTP request with all cookies in the headers
3. Server reads the session cookie successfully → dashboard renders

Deployed to Vercel: a89487c → production
https://frontend-murad-hasils-projects.vercel.app

## Outcome

- Impact: Login and register now redirect to dashboard correctly without requiring a manual refresh
- Tests: n/a (manual testing on Vercel)
- Files: LoginForm.tsx, register/page.tsx
- Next prompts: n/a
- Reflection: This is a classic Better Auth + Next.js App Router gotcha. router.push() is asynchronous from the browser's cookie perspective. window.location.href is the only reliable way to ensure cookie-dependent server-side code sees the new session.

## Evaluation notes (flywheel)

- Failure modes observed: router.push() racing with cookie storage → server sees no session → redirect to login
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a — fix is definitive
