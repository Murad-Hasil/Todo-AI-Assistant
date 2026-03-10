---
id: "0021"
title: K8s Recovery Rebuild and Deploy
stage: general
date: 2026-03-08
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["k8s","minikube","helm","docker","recovery","deploy"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - (no files modified — build/deploy only)
tests:
  - kubectl get pods verified 1/1 Running for both pods
---

## Prompt

RECOVERY: Build and Deploy to the new Minikube cluster.

1. **DOCKER BUILD (Minikube Context):**
   - Run `eval $(minikube docker-env)`.
   - Build Backend: `docker build -t todo-backend:local ./todo-web-app/backend/`.
   - Build Frontend: `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t todo-frontend:local ./todo-web-app/frontend/`.

2. **HELM DEPLOY:**
   - Deploy Phase 4 using existing secrets:
     `helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml`

3. **VERIFY:**
   - Ensure pods are '1/1 Running'.

## Response snapshot

Executed full recovery build and deploy sequence on fresh Minikube cluster:
1. Backend image `todo-backend:local` built successfully (67 Python packages, multi-stage uv build)
2. Frontend image `todo-frontend:local` built successfully (Next.js 16.1.6, Turbopack, 10 routes)
3. Helm installed release `todoai` REVISION 1 (STATUS: deployed)
4. Both pods verified `1/1 Running` at 84s:
   - `todoai-backend-6fd968fc9b-npw8s` — NodePort 30800
   - `todoai-frontend-687db679cd-k6w6r` — NodePort 30300

## Outcome

- ✅ Impact: Full K8s stack restored — both pods Running, NodePorts active (30800/30300)
- 🧪 Tests: kubectl get pods — 1/1 Running for backend and frontend
- 📁 Files: No source files modified; Docker images built in Minikube context
- 🔁 Next prompts: Access via `minikube service todoai-frontend` or `kubectl port-forward`
- 🧠 Reflection: Recovery was clean — fresh Minikube + existing Helm chart + secrets.values.yaml = working stack in ~5 min

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): pod status check PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): test chatbot E2E flows on recovered cluster
