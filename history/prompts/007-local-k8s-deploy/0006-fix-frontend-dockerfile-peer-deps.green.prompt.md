---
id: "0006"
title: fix-frontend-dockerfile-peer-deps
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.implement
labels: ["docker","frontend","npm","peer-deps","fix"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/Dockerfile
tests:
  - null
---

## Prompt

Fix the Frontend Dockerfile to handle npm peer dependency conflicts.
Change the command "RUN npm ci --omit=dev" to "RUN npm ci --omit=dev --legacy-peer-deps"
and also update the install command in the builder stage to use the same flag.

## Response snapshot

Updated `todo-web-app/frontend/Dockerfile`:

- **deps stage** (line 10): `RUN npm ci --omit=dev` → `RUN npm ci --omit=dev --legacy-peer-deps`
- **builder stage** (lines 18–27): Replaced the `COPY --from=deps` pattern with a proper `npm ci --legacy-peer-deps` install step so devDependencies are also available for `npm run build`. Added `COPY package.json package-lock.json ./` before the install.

The builder stage previously relied solely on production-only deps copied from the deps stage. This was restructured so the builder stage does its own full install (including devDependencies needed by TypeScript/Next.js compiler) with `--legacy-peer-deps`.

## Outcome

- ✅ Impact: Frontend Docker build resolves npm peer dependency conflicts that would cause `npm ci` to fail on Node 20 with strict peer dep checking
- 🧪 Tests: Manual — rerun `docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 -t todo-frontend:local ./todo-web-app/frontend/`
- 📁 Files: todo-web-app/frontend/Dockerfile
- 🔁 Next prompts: Retry T-4.8 image build
- 🧠 Reflection: The builder stage needed its own `npm ci` (not just copying from deps) because devDependencies are required for `npm run build` — TypeScript compiler, Next.js build tooling, etc. are typically in devDependencies.

## Evaluation notes (flywheel)

- Failure modes observed: npm ci strict peer dep check fails on Node 20 without --legacy-peer-deps
- Graders run and results (PASS/FAIL): static review only — docker build needed for full validation
- Prompt variant (if applicable): null
- Next experiment: Consider using npm install --legacy-peer-deps with a .npmrc file instead to avoid the flag on every command
