---
id: "0005"
title: phase4-k8s-implementation
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.implement
labels: ["kubernetes","helm","docker","minikube","implementation","phase4","green"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/next.config.mjs
  - todo-web-app/backend/Dockerfile
  - todo-web-app/backend/.dockerignore
  - todo-web-app/frontend/Dockerfile
  - todo-web-app/frontend/.dockerignore
  - todo-web-app/k8s/charts/todoai/Chart.yaml
  - todo-web-app/k8s/charts/todoai/values.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml.example
  - todo-web-app/k8s/charts/todoai/.helmignore
  - todo-web-app/k8s/charts/todoai/templates/backend-secret.yaml
  - todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml
  - todo-web-app/k8s/charts/todoai/templates/backend-service.yaml
  - todo-web-app/k8s/charts/todoai/templates/frontend-configmap.yaml
  - todo-web-app/k8s/charts/todoai/templates/frontend-deployment.yaml
  - todo-web-app/k8s/charts/todoai/templates/frontend-service.yaml
  - .gitignore
  - todo-web-app/CLAUDE.md
  - todo-web-app/k8s/specs/k8s-tasks.md
tests:
  - "helm lint todo-web-app/k8s/charts/todoai — PASS: 1 chart(s) linted, 0 chart(s) failed"
  - "git grep credential audit — PASS: zero matches in committed files"
  - "secrets.values.yaml gitignore — PASS: not tracked by git"
---

## Prompt

Execute all tasks defined in `@/todo-web-app/k8s/specs/k8s-tasks.md` for Phase 4: Local Kubernetes Deployment.

STRICT IMPLEMENTATION RULES:
1. **READ-BEFORE-WRITE:** Read constitution and source before modifying infrastructure files.
2. **MULTI-STAGE DOCKER BUILDS:** Backend: python:3.13-slim with uv. Frontend: node:20-alpine 3-stage with NEXT_PUBLIC_API_URL build arg.
3. **HELM CHART LOGIC:** Single chart `todoai` with resource limits (256Mi backend, 384Mi frontend). Liveness + Readiness probes on `/health`.
4. **NETWORKING:** Frontend → Backend via `http://todoai-backend-svc:8000`. Frontend service NodePort.
5. **SECRET MANAGEMENT:** K8s Secret template for DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY.
6. **NON-DESTRUCTIVE:** No modification to existing app source code.
7. **TASK MAPPING:** T-4.1 through T-4.12, with `# [Task]: T-4.x` comments.

## Response snapshot

Implemented 17 files across 7 phases. Tasks T-4.0–T-4.9c, T-4.7, T-4.13, T-4.14, T-4.16, T-4.17 all marked [x].

- `next.config.mjs`: added `output: 'standalone'` enabling `node server.js` runner
- `backend/Dockerfile`: python:3.13-slim 2-stage; uv copy from ghcr.io; non-root UID 1001; uvicorn CMD
- `frontend/Dockerfile`: node:20-alpine 3-stage; NEXT_PUBLIC_API_URL baked in builder; nextjs non-root; node server.js CMD
- Both `.dockerignore` files exclude dev/secret artifacts
- Single `charts/todoai` chart with 6 templates; `helm lint` PASS
- `backend-secret.yaml` uses stringData with Helm `.Values.backend.secret.*` references
- `secrets.values.yaml.example` contains placeholder strings only; real file gitignored
- `todo-web-app/CLAUDE.md` updated with Phase 4 K8s section and 3-command deploy sequence

Remaining (require running Minikube): T-4.8 (docker build), T-4.10 (helm deploy), T-4.11–T-4.12 (smoke tests), T-4.15 (uninstall test).

## Outcome

- ✅ Impact: All infrastructure files created; helm lint passes; zero secrets in VCS; deployable with 3 commands once Minikube is available
- 🧪 Tests: helm lint PASS (1 linted, 0 failed); git grep audit PASS; gitignore PASS
- 📁 Files: 17 files — 5 Docker artifacts, 10 Helm chart files, .gitignore, CLAUDE.md
- 🔁 Next prompts: Developer runs 3-command deploy when Minikube is available; T-4.8/T-4.10/T-4.11/T-4.12 are manual verification steps requiring a cluster
- 🧠 Reflection: BETTER_AUTH_SECRET in secrets.values.yaml must match the value originally used to seed the Neon PostgreSQL Better Auth tables — mismatch causes silent JWT failures. Quickstart should warn about this explicitly.

## Evaluation notes (flywheel)

- Failure modes observed: helm lint emits [INFO] for missing icon field in Chart.yaml (non-blocking)
- Graders run and results (PASS/FAIL): helm lint PASS; security audit PASS; gitignore PASS
- Prompt variant (if applicable): null
- Next experiment: Add Makefile target `make deploy` wrapping 3-command sequence for SC-002 compliance in 1 command
