---
id: "0019"
title: K8s Recovery — Redeploy Fresh Minikube Cluster
stage: general
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: "007-local-k8s-deploy"
branch: main
user: brownie
command: "/sp.implement RECOVERY: Rebuild and Redeploy to fresh Minikube cluster"
labels: ["kubernetes", "minikube", "helm", "docker", "recovery", "health-probe-fix"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml
tests:
  - "kubectl get pods → both 1/1 Running"
  - "curl localhost:8001/api/health → {status: ok}"
  - "GET /api/health 200 OK in backend pod logs (x2)"
---

## Prompt

Kal humare kaam ka 1 testing reh gaya tha liken bad'qismati se mujhe minikube ka 1 file delete hogya dobara cluster banaye hai, kal ka ye kaam reh gaya tha "Task #1 complete karo — chatbot test finish karna hai" ye tumhre memory main save ha liken is kaam ko karne se pehle pir se hume deploy ka kaam karna hoga our testing karni hogi jiska prompt mene pehle bhi dia tha abhi bhi necy dia ha. /sp.implement RECOVERY: Rebuild and Redeploy to fresh Minikube cluster.

1. **DOCKER BUILD:**
   - Run `eval $(minikube docker-env)`
   - Rebuild Backend image: `docker build -t todo-backend:local ./todo-web-app/backend/`
   - Rebuild Frontend image with build-arg: `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t todo-frontend:local ./todo-web-app/frontend/`

2. **HELM DEPLOY:**
   - Deploy using the existing secrets: `helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml`

3. **VERIFY:**
   - Check if pods are '1/1 Running'.

## Response

### Steps Executed

1. **Minikube status** — Running (Control Plane, kubelet, apiserver all OK)
2. **Backend image build** — `todo-backend:local` built successfully (python:3.13-slim, uv, 67 packages)
3. **Frontend image build** — `todo-frontend:local` built successfully (node:20-alpine, Next.js 16.1.6, build complete)
4. **Helm deploy** — REVISION 1 installed cleanly
5. **Bug found** — Backend pod crash-looping: liveness/readiness probes using `/health` but actual endpoint is `/api/health`
6. **Fix applied** — `backend-deployment.yaml` probes path updated: `/health` → `/api/health` (replace_all)
7. **Helm redeploy** — REVISION 2 deployed
8. **Verification** — Both pods `1/1 Running`, `GET /api/health → {"status":"ok"}` confirmed via port-forward

### Bug Fixed

`todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml` — readinessProbe and livenessProbe path was `/health` (wrong), corrected to `/api/health` (actual FastAPI route).

### Final State

| Pod | Status | Restarts |
|-----|--------|----------|
| todoai-backend | 1/1 Running | 5 (from old wrong probe) |
| todoai-frontend | 1/1 Running | 0 |

Health check: `curl localhost:8001/api/health` → `{"status":"ok"}`

Cluster is ready for chatbot E2E testing (Task #1).
