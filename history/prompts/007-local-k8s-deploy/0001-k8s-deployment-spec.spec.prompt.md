---
id: "0001"
title: k8s-deployment-spec
stage: spec
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.specify
labels: ["kubernetes","helm","docker","containerization","aiops","phase-4"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-local-k8s-deploy/spec.md
  - specs/007-local-k8s-deploy/checklists/requirements.md
tests:
  - null
---

## Prompt

Generate a comprehensive infrastructure specification for Phase 4: Local Kubernetes Deployment in `/todo-web-app/k8s/specs/k8s-deployment.md` based strictly on the Project PDF (Page 22).

The specification must cover:
1. **CONTAINERIZATION (@specs/k8s/docker.md):**
   - **Backend Dockerfile:** Multi-stage build for Python 3.13 (FastAPI). Must include production-ready `gunicorn` or `uvicorn` configuration.
   - **Frontend Dockerfile:** Multi-stage build for Next.js. Must include a build stage and a lightweight runner stage.
   - **Optimization:** Ensure `.dockerignore` files are defined to keep images small.

2. **HELM ORCHESTRATION (@specs/k8s/helm.md):**
   - **Structure:** Create two Helm charts: `todo-backend` and `todo-frontend`.
   - **Templates:** Define `Deployment`, `Service`, `ConfigMap`, and `Secret` templates for both.
   - **Service Types:** Use `NodePort` or `LoadBalancer` (via Minikube tunnel) for the frontend to make it accessible locally.

3. **CONFIGURATION MANAGEMENT:**
   - **ConfigMaps:** For non-sensitive data like `NEXT_PUBLIC_BACKEND_URL`.
   - **Secrets:** For sensitive data like `BETTER_AUTH_SECRET`, `DATABASE_URL`, and `GROQ_API_KEY`.

4. **AIOPS INTEGRATION:**
   - Define a strategy for using `kubectl-ai` to inspect the cluster.
   - Define health check probes (Liveness & Readiness) for the backend to ensure high availability.

5. **RESOURCE CONSTRAINTS:**
   - Define CPU/Memory limits (e.g., 256MB/512MB) per pod to respect the local system's 3GB RAM limit.

6. **ACCEPTANCE CRITERIA:**
   - The entire stack must be deployable via a single `helm install` command.
   - The Frontend must be able to communicate with the Backend pod inside the cluster.
   - The AI Chatbot must remain functional within the containerized environment.

## Response snapshot

Created branch `007-local-k8s-deploy` and wrote comprehensive Phase 4 specification to `specs/007-local-k8s-deploy/spec.md`.

The spec covers 4 user stories:
- **US1 (P1)**: Developer deploys full stack locally in one command via `helm install todoai ./charts/todoai --values secrets.values.yaml`
- **US2 (P1)**: Application secrets never exposed in version control — injected via Kubernetes Secrets at deploy time
- **US3 (P2)**: AI chatbot remains fully functional after containerization (API key injection + outbound network)
- **US4 (P3)**: Operations engineer inspects cluster health using `kubectl-ai` natural language queries

18 functional requirements across: containerization (FR-001–004), Helm orchestration (FR-005–009), configuration management (FR-010–012), health probes (FR-013–015), resource constraints (FR-016–017), AIOps (FR-018).

8 success criteria including: one-command deploy under 10 minutes, all pods Running within 3 minutes, zero secrets in committed files, AI chatbot responds within 10 seconds, combined memory under 2.5 GB.

Quality checklist created at `specs/007-local-k8s-deploy/checklists/requirements.md` — all 16 items pass.

## Outcome

- ✅ Impact: Phase 4 spec created; feature branch 007-local-k8s-deploy active; ready for /sp.plan
- 🧪 Tests: No tests (spec stage)
- 📁 Files: specs/007-local-k8s-deploy/spec.md, specs/007-local-k8s-deploy/checklists/requirements.md
- 🔁 Next prompts: /sp.plan — generate technical plan (Dockerfiles, Helm chart structure, ConfigMap/Secret templates, health probe config, resource limits)
- 🧠 Reflection: Spec deliberately excludes in-cluster database (Neon stays external) and Minikube/Helm installation. Combined memory budget of 2.5 GB leaves headroom for k8s control plane on 3 GB Minikube allocation.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): quality checklist — all 16 items PASS
- Prompt variant (if applicable): null
- Next experiment: Consider splitting into two charts (todo-backend, todo-frontend) vs single parent chart (todoai) — single chart simplifies one-command deploy per SC-002
