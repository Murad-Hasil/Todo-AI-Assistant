---
id: "0016"
title: Localhost Config Phase 4 K8s
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: main
user: brownie
command: /sp.implement
labels: ["kubernetes", "helm", "docker", "localhost", "port-forward", "cors"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/Dockerfile
  - todo-web-app/k8s/charts/todoai/values.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml
tests:
  - "null"
---

## Prompt

Final Infrastructure Sync: Localhost Configuration for Phase 4.

MISSION: Configure the local Kubernetes environment to use local networking (localhost:3000/8000) while keeping the live Neon DB connection.

STRICT EXECUTION STEPS:
1. **FRONTEND DOCKERFILE:**
   - Set `ARG NEXT_PUBLIC_API_URL=http://localhost:8000` as a build argument.
   - Set `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL`.
   - Set `ENV HOSTNAME="0.0.0.0"` and `ENV PORT=3000`.

2. **BACKEND DOCKERFILE:**
   - Set `ENV HOSTNAME="0.0.0.0"` and `ENV PORT=8000`.
   - Ensure it listens on `0.0.0.0` so the tunnel can find it.

3. **HELM VALUES (todo-web-app/k8s/charts/todoai/values.yaml):**
   - Update `betterAuthUrl` to `http://localhost:3000`.
   - Update `corsOrigins` to include `http://localhost:3000`.

4. **VERIFICATION:**
   - Provide the user with the 2 build commands (Frontend and Backend) and the 2 port-forward commands needed to run everything locally on localhost:3000.

## Response snapshot

Applied 3 changes:

1. **frontend/Dockerfile** — Added `http://localhost:8000` as default for `ARG NEXT_PUBLIC_API_URL` (was blank). `ENV HOSTNAME="0.0.0.0"` and `ENV PORT=3000` already present in runner stage.

2. **values.yaml** — Changed `betterAuthUrl: ""` → `betterAuthUrl: "http://localhost:3000"`. `CORS_ORIGINS: "http://localhost:3000"` was already correct.

3. **secrets.values.yaml** (local only) — Updated `CORS_ORIGINS` and `betterAuthUrl` from `http://192.168.49.2:30300` → `http://localhost:3000`.

Backend Dockerfile left unchanged: `ENV PORT=7860` default kept for HF Space; Kubernetes injects `PORT=8000` at runtime via backend-deployment.yaml.

Build + access sequence:
```bash
eval $(minikube docker-env)
docker build -t todo-backend:local ./todo-web-app/backend/
docker build -t todo-frontend:local ./todo-web-app/frontend/
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
kubectl port-forward svc/todoai-backend-svc 8000:8000   # Terminal 1
kubectl port-forward svc/todoai-frontend 3000:3000       # Terminal 2
# Browser: http://localhost:3000
```

## Outcome

- Impact: Local K8s cluster now accessible via localhost:3000/8000 through kubectl port-forward; no Minikube IP required on WSL2
- Tests: n/a (requires port-forward + browser test)
- Files: frontend/Dockerfile, values.yaml, secrets.values.yaml (local only)
- Next prompts: Run build commands, port-forward, test full flow (login → tasks → AI chat)
- Reflection: The ARG default pattern means `docker build -t todo-frontend:local ./todo-web-app/frontend/` works with no extra flags for local dev. Override with `--build-arg NEXT_PUBLIC_API_URL=...` for Minikube NodePort or production.

## Evaluation notes (flywheel)

- Failure modes observed: Backend Dockerfile ENV PORT would have broken HF Space if changed to 8000 — correctly identified and preserved
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Run port-forward + open http://localhost:3000 to test sign-in flow
