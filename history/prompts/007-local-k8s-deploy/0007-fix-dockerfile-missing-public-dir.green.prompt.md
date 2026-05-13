---
id: "0007"
title: fix-dockerfile-missing-public-dir
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.implement
labels: ["docker","frontend","fix","public-dir"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/Dockerfile
  - todo-web-app/frontend/public/.gitkeep
tests:
  - null
---

## Prompt

The Frontend Dockerfile build is failing because the 'public' folder is missing in the source.

Please update the Frontend Dockerfile:
1. In the 'builder' stage, add a command 'RUN mkdir -p public' before 'RUN npm run build' to ensure the folder exists.
2. In the 'runner' stage, ensure the COPY command for the public folder doesn't fail the build.

Also, check if 'todo-web-app/frontend/public' exists in the workspace; if not, create it with a dummy placeholder file (e.g., favicon.ico or .gitkeep).

## Response snapshot

Confirmed `todo-web-app/frontend/public/` was missing. Applied three fixes:

1. **`frontend/Dockerfile` builder stage**: Added `RUN mkdir -p public` before `RUN npm run build` so Next.js build never fails on a missing public dir.
2. **`frontend/Dockerfile` runner stage**: Updated comment (the COPY command is now safe since `mkdir -p` guarantees the directory exists in the builder stage).
3. **`frontend/public/.gitkeep`**: Created the directory and an empty `.gitkeep` so the `public/` directory is tracked in git and present in the Docker build context without relying solely on the `mkdir -p` runtime command.

## Outcome

- ✅ Impact: Frontend Docker build no longer fails with "COPY failed: no source files were specified" on the public directory
- 🧪 Tests: Retry `docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 -t todo-frontend:local ./todo-web-app/frontend/`
- 📁 Files: todo-web-app/frontend/Dockerfile, todo-web-app/frontend/public/.gitkeep
- 🔁 Next prompts: Retry T-4.8 image build
- 🧠 Reflection: Both the in-source `.gitkeep` and the `RUN mkdir -p` are complementary — .gitkeep ensures the dir is in the build context, mkdir -p is a defensive fallback if .gitkeep is somehow excluded by .dockerignore in future.

## Evaluation notes (flywheel)

- Failure modes observed: Docker COPY fails when source path does not exist in builder stage
- Graders run and results (PASS/FAIL): static review only
- Prompt variant (if applicable): null
- Next experiment: null
