---
id: "0004"
title: Phase 4 K8s Implementation
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: execute-tasks
labels: ["kubernetes","docker","helm","minikube","containerization","phase4","implementation"]
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
  - specs/007-local-k8s-deploy/tasks.md
  - todo-web-app/k8s/specs/k8s-tasks.md
tests:
  - helm lint ./todo-web-app/k8s/charts/todoai (manual — developer runs after setup)
  - docker build -t todo-backend:local ./todo-web-app/backend/ (manual — requires minikube docker-env)
  - docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 -t todo-frontend:local ./todo-web-app/frontend/ (manual)
  - kubectl get pods (manual — verifies 1/1 Running for both pods after helm install)
---

## Prompt

Execute all tasks from Phase 4: Local Kubernetes Deployment for the TodoAI full-stack application.

Tasks file: /home/brownie/projects/hackathon-II/specs/007-local-k8s-deploy/tasks.md
Plan: /home/brownie/projects/hackathon-II/specs/007-local-k8s-deploy/plan.md

Implement in order:
- T-4.0: Add output: 'standalone' to next.config.mjs
- T-4.1: Create backend/Dockerfile (multi-stage python:3.13-slim with uv)
- T-4.2: Create frontend/Dockerfile (multi-stage node:20-alpine)
- T-4.3a: Create backend/.dockerignore
- T-4.3b: Create frontend/.dockerignore
- T-4.4: Create Helm chart scaffold (Chart.yaml, values.yaml, secrets.values.yaml.example)
- T-4.5: Create backend Helm templates (backend-deployment.yaml, backend-service.yaml)
- T-4.6: Create frontend Helm templates (frontend-deployment.yaml, frontend-service.yaml, frontend-configmap.yaml)
- T-4.9: Create backend-secret.yaml Helm template
- T-4.9b: Create secrets.values.yaml.example
- T-4.9c: Update .gitignore with K8s secrets entries
- T-4.13: Create .helmignore
- T-4.17: Update todo-web-app/CLAUDE.md with K8s section

## Response snapshot

All Phase 4 infrastructure-as-code tasks completed successfully. 19 files created or modified:

Phase 1 (T-4.0): Modified next.config.mjs to add `output: 'standalone'` — required for Next.js standalone runner.

Phase 2 (T-4.1, T-4.2, T-4.3a, T-4.3b): Created all 4 Dockerization files:
- backend/Dockerfile: 2-stage python:3.13-slim; uv binary copied from ghcr.io/astral-sh/uv:latest; non-root UID 1001; CMD uvicorn
- frontend/Dockerfile: 3-stage node:20-alpine; deps/builder/runner pattern; ARG NEXT_PUBLIC_API_URL baked at build time; non-root nextjs user; CMD node server.js
- backend/.dockerignore: excludes .venv, __pycache__, .env*, tests/, migrations/
- frontend/.dockerignore: excludes node_modules/, .next/, .env*, .git/, .playwright-mcp/

Phase 3 (T-4.4 through T-4.6, T-4.9, T-4.13): Created complete Helm chart at todo-web-app/k8s/charts/todoai/:
- Chart.yaml: apiVersion v2, name todoai, version 0.1.0, appVersion 2.2.0
- values.yaml: backend (NodePort 30800, 128Mi/256Mi, 250m/500m) + frontend (NodePort 30300, 192Mi/384Mi, 250m/500m), imagePullPolicy Never
- secrets.values.yaml.example: placeholder credentials only — no real values
- .helmignore: excludes secrets.values.yaml from helm package output
- 6 templates: backend-secret.yaml (Opaque Secret, stringData), backend-deployment.yaml (livenessProbe + readinessProbe on /health), backend-service.yaml (NodePort 30800), frontend-configmap.yaml (informational NEXT_PUBLIC_API_URL), frontend-deployment.yaml (readinessProbe on /), frontend-service.yaml (NodePort 30300)

Security (T-4.9c): Added secrets.values.yaml entries to repo .gitignore.

Documentation (T-4.17): Updated todo-web-app/CLAUDE.md with Phase 4 K8s section including 3-command deploy sequence.

## Outcome

- Impact: Full infrastructure-as-code foundation for local Kubernetes deployment. Developer can now: (1) build images into Minikube daemon, (2) helm upgrade --install with secrets.values.yaml, (3) minikube service todoai-frontend to access the app.
- Tests: helm lint, docker build, kubectl get pods — all manual; developer runs after Minikube cluster is running
- Files: 19 files created/modified across backend/, frontend/, k8s/charts/todoai/, .gitignore, CLAUDE.md, and tasks.md files
- Next prompts: T-4.7 helm lint validation, T-4.8 docker build into minikube, T-4.10 helm deploy and pod verification, T-4.11 AI chatbot smoke test
- Reflection: All files follow plan.md exactly. imagePullPolicy Never enforced in both deployments. Secret values flow from secrets.values.yaml -> Helm template -> Kubernetes Secret -> pod env vars. NEXT_PUBLIC_API_URL baked at build time pattern documented in ConfigMap comment. Non-root users (UID 1001) in both images.

## Evaluation notes (flywheel)

- Failure modes observed: none — all files created cleanly; mirror k8s-tasks.md updated alongside canonical tasks.md
- Graders run and results (PASS/FAIL): structure check PASS (14 infrastructure files confirmed present)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): run helm lint to validate template syntax before developer builds images
