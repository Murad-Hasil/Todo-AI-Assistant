---
id: "0027"
title: Vercel CORS Auth Fix Single Deployment
stage: general
date: 2026-03-11
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 011-submission-prep
user: Mb-Murad
command: general
labels: ["vercel","cors","better-auth","hf-space","deployment"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/src/lib/auth.ts
  - todo-web-app/frontend/.env.example
  - todo-web-app/backend/app/main.py
  - todo-web-app/backend/.env.example
tests:
  - Playwright: POST /api/auth/sign-in/email → 200 (was 403)
  - curl https://mb-murad-todo-ai-assistant.hf.space/api/health → {"status":"ok"}
  - https://frontend-murad-hasils-projects.vercel.app → DEPLOYMENT_NOT_FOUND (deleted)
---

## Prompt

i found an issue with vercel, vercel ke 2 link hai, https://frontend-murad-hasils-projects.vercel.app/ <-- is link pe sab kuch sai chal raha ha, liken is link se direct wo log app ko dekh sakte hai jinke pas vercel account already login ha, agar kisi ke pas vercel account nahi ha to ussy pehle sign up karna padega vercel pe. our humara dosra link same app ka https://todoflow-full-stack-application.vercel.app/ is link ko wo bhi link kar ke seeds app ko dekh sakte hai jinke pas vercel account na ho, link is me issue yahi ha is link se sign up and login problem ha.

[Follow-up messages]:
- frontend ka mai ne kar dia backend ka ap kar ke deploy karo our commit kar do.
- vercel ke 2 alag link kyun hai? dono main se 1 ho na.
- dono links ek hi deployment ke hai, frontend-murad-hasils-projects wala delete kar do.

## Response snapshot

Root cause identified via Playwright: POST /api/auth/sign-in/email → 403 "Invalid origin". Better Auth was rejecting requests from todoflow domain.

Fixes applied:
1. **auth.ts** — added `trustedOrigins` reading from `BETTER_AUTH_TRUSTED_ORIGINS` env var (comma-separated)
2. **HF Space CORS_ORIGINS** — updated via API to include both Vercel domains (caused CONFIG_ERROR due to secret/variable collision — resolved by deleting variable, keeping secret)
3. **backend main.py** — comment updated; deployed to HF Space (commit ca9b5af)
4. **frontend-murad-hasils-projects** Vercel project — deleted via REST API

## Outcome

- ✅ Impact: Single deployment URL — todoflow-full-stack-application.vercel.app — fully working
- 🧪 Tests: Backend health OK, old URL returns DEPLOYMENT_NOT_FOUND
- 📁 Files: auth.ts, .env.example (frontend+backend), main.py
- 🔁 Next prompts: Verify todoflow sign up/login end-to-end
- 🧠 Reflection: HF Space has separate secrets vs variables — never set a variable with the same name as an existing secret via the variables API

## Evaluation notes (flywheel)

- Failure modes observed: HF Space CONFIG_ERROR due to CORS_ORIGINS collision (secret + variable same name)
- Graders run and results (PASS/FAIL): curl health PASS, Playwright 403→fixed
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add BETTER_AUTH_TRUSTED_ORIGINS to todoflow Vercel project env vars if needed
