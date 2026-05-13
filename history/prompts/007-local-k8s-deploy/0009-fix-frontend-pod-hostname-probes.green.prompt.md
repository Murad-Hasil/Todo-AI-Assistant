---
id: "0009"
title: fix-frontend-pod-hostname-probes
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.implement
labels: ["helm","kubernetes","frontend","dockerfile","hostname","probes","fix"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/Dockerfile
  - todo-web-app/k8s/charts/todoai/templates/frontend-deployment.yaml
tests:
  - null
---

## Prompt

The Frontend pod is refusing connections on port 3000.

Please update the Frontend Kubernetes Deployment:
1. Add `ENV HOSTNAME="0.0.0.0"` and `ENV PORT=3000` to the Frontend Dockerfile (final stage).
2. In `templates/frontend-deployment.yaml`, add the `HOSTNAME` environment variable with value `"0.0.0.0"`.
3. Ensure the `livenessProbe` and `readinessProbe` in the deployment are pointing to the correct port (3000).
4. Double check that `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` are being passed correctly from the Secret and Values.

## Response snapshot

Applied fixes across two files:

1. **`frontend/Dockerfile` runner stage**: Added `ENV HOSTNAME="0.0.0.0"` after `ENV PORT=3000`. The Next.js standalone `server.js` reads `HOSTNAME` to determine the bind address — without it, it defaults to `127.0.0.1` (loopback only), making the container unreachable from K8s.

2. **`templates/frontend-deployment.yaml`**:
   - Added `HOSTNAME: "0.0.0.0"` env var to container spec.
   - Added `livenessProbe` (was missing — only `readinessProbe` existed). Both probes use `httpGet path: /` on `{{ .Values.frontend.port }}` (3000) — correct.
   - Verified `BETTER_AUTH_SECRET` pulls from `todoai-backend-secret` via `secretKeyRef` - correct.
   - Verified `BETTER_AUTH_URL` pulls from `{{ .Values.frontend.betterAuthUrl | quote }}` - correct.
   - Verified `DATABASE_URL` pulls from `todoai-backend-secret` via `secretKeyRef` - correct.

## Outcome

- ✅ Impact: Next.js standalone server now binds to 0.0.0.0:3000 inside the container, making it reachable from K8s pod network and NodePort service
- 🧪 Tests: Rebuild frontend image with eval $(minikube docker-env), then helm upgrade --install and verify kubectl get pods shows Running
- 📁 Files: todo-web-app/frontend/Dockerfile, todo-web-app/k8s/charts/todoai/templates/frontend-deployment.yaml
- 🔁 Next prompts: T-4.11 health check verification, T-4.12 access app via minikube service
- 🧠 Reflection: Next.js standalone mode uses HOSTNAME env var (not HOST) to set the bind address. Default 127.0.0.1 is secure for local dev but fatal in K8s where kubelet probe comes from a different IP.

## Evaluation notes (flywheel)

- Failure modes observed: Next.js standalone server binds to 127.0.0.1 by default — connection refused from outside the loopback interface
- Graders run and results (PASS/FAIL): static review only — image rebuild + helm upgrade needed for full validation
- Prompt variant (if applicable): null
- Next experiment: null
