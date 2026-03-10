---
id: "0015"
title: K8s Local Deploy Connection Resolved
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: main
user: brownie
command: /sp.implement
labels: ["kubernetes", "helm", "docker", "minikube", "deploy", "resolved"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/Dockerfile
  - todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml.example
tests:
  - "Cluster test: kubectl run curltest -- curl http://todoai-backend-svc:8000/ → {message: Todo AI Backend is Running}"
  - "kubectl get pods → both 1/1 Running"
  - "Uvicorn running on http://0.0.0.0:8000 confirmed in logs"
---

## Prompt

Ab docker on ha ye kaam kar do please. (Docker is on, do the deployment.)

## Response snapshot

Executed full local Kubernetes deployment:

1. `minikube ip` → 192.168.49.2
2. `eval $(minikube docker-env)` — switched to Minikube Docker daemon
3. Backend image built: `todo-backend:local` (with PORT fix — uvicorn now on 8000)
4. Frontend image built: `todo-frontend:local` (NEXT_PUBLIC_API_URL=http://192.168.49.2:30800 baked in, ~82s build)
5. Fixed `secrets.values.yaml` — was malformed (frontend nested inside backend.secret, dead nextPublicApiUrl field). Rewrote with correct structure: CORS_ORIGINS, betterAuthUrl both pointing to http://192.168.49.2:30300
6. `helm upgrade --install todoai` → REVISION 4, STATUS deployed
7. Verified: both pods 1/1 Running
8. In-cluster test: `curl http://todoai-backend-svc:8000/` → {"message":"Todo AI Backend is Running","status":"online"}

Frontend accessible at: http://192.168.49.2:30300 (or via minikube service todoai-frontend)

## Outcome

- Impact: Local Kubernetes cluster fully operational — Connection Refused resolved
- Tests: In-cluster curl confirmed backend on port 8000; both pods Running
- Files: secrets.values.yaml (local only, not committed)
- Next prompts: Test full flow — login, add task, chat
- Reflection: WSL2 cannot directly reach Minikube NodePort via 192.168.49.2 (known WSL2 networking limitation). Use `minikube service todoai-frontend` or kubectl port-forward for browser access.

## Evaluation notes (flywheel)

- Failure modes observed: secrets.values.yaml had malformed YAML (frontend block indented under backend.secret)
- Graders run and results (PASS/FAIL): in-cluster curl PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): kubectl port-forward svc/todoai-frontend 3000:3000 for direct browser access on WSL2
