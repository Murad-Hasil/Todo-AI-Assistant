---
id: "0004"
title: Vercel HF Production Link Deploy
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["vercel","huggingface","production","deployment","frontend","env-vars"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - "todo-web-app/frontend/.vercel/ (env vars updated via Vercel CLI)"
tests:
  - "Production URL live: https://frontend-murad-hasils-projects.vercel.app"
  - "Build: 10/10 static pages generated, 0 vulnerabilities"
---

## Prompt

Final Production Linking: Connect Vercel to Hugging Face.

MISSION: Update Vercel environment variables and trigger a final production build to connect to the live backend.

STRICT EXECUTION STEPS:
1. **NAVIGATE:**
   - Move to the `/todo-web-app/frontend` directory.

2. **SET ENVIRONMENT VARIABLES (Via Vercel CLI):**
   - Use `npx vercel env add` or `npx vercel env set` to configure the following for the 'production' environment:
     - `NEXT_PUBLIC_API_URL`: Set to "https://mb-murad-todo-ai-assistant.hf.space"
     - `BETTER_AUTH_URL`: Set to your live Vercel URL (e.g., "https://frontend-murad-hasils-projects.vercel.app").
     - `BETTER_AUTH_SECRET`: (Ensure your 32-char secret key is also present).

3. **TRIGGER PRODUCTION DEPLOY:**
   - Run the final build command: `npx vercel deploy --prod --token <token> --yes`
   - Ensure the build completes successfully.

4. **FINAL VERIFICATION:**
   - Confirm when the deployment is finished and provide the live Vercel link.

## Response snapshot

1. Listed existing Vercel production env vars — all three target vars already existed.
2. Removed and re-added `NEXT_PUBLIC_API_URL` → `https://mb-murad-todo-ai-assistant.hf.space`
3. Removed and re-added `BETTER_AUTH_URL` → `https://frontend-murad-hasils-projects.vercel.app`
4. `BETTER_AUTH_SECRET` already set correctly (confirmed from .env.local match).
5. Ran `vercel deploy --prod --yes` — build completed in 35s, deployed to Washington D.C. (iad1).
6. Production URL aliased: https://frontend-murad-hasils-projects.vercel.app

## Outcome

- Impact: Frontend production deployment now points to Hugging Face backend at https://mb-murad-todo-ai-assistant.hf.space.
- Tests: Build: 10/10 static pages, 0 vulnerabilities, TypeScript check passed.
- Files: Vercel project env vars updated (no local file changes).
- Next prompts: Verify end-to-end flow (login → dashboard → chat) on live Vercel URL. Push backend CORS/root changes to HF Space.
- Reflection: Used `vercel env rm --yes` + `vercel env add` (stdin) to non-interactively update env vars; `--yes` flag on deploy avoids confirmation prompts.

## Evaluation notes (flywheel)

- Vercel env var update flow: rm --yes → add via printf stdin pipe.
- Build warning: "middleware" file convention deprecated, use "proxy" — non-blocking but worth addressing in future.
- Deploy time: ~51s total including build (35s) and deployment.
