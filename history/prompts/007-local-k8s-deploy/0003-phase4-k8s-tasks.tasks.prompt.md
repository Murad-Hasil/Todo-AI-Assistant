---
id: "0003"
title: phase4-k8s-tasks
stage: tasks
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.tasks
labels: ["kubernetes","helm","docker","minikube","tasks","phase4"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-local-k8s-deploy/tasks.md
  - todo-web-app/k8s/specs/k8s-tasks.md
tests:
  - null
---

## Prompt

Generate a task list for Phase 4: Local Kubernetes Deployment in `/todo-web-app/k8s/specs/k8s-tasks.md` based strictly on the plan `@/todo-web-app/k8s/specs/k8s-plan.md`.

The task list must include:
1. **DOCKERIZATION TASKS:**
   - T-4.1: Backend Dockerfile (Create a multi-stage Dockerfile for the FastAPI app in `/backend/Dockerfile`).
   - T-4.2: Frontend Dockerfile (Create a multi-stage Dockerfile for the Next.js app in `/frontend/Dockerfile`).
   - T-4.3: Docker Ignore (Create `.dockerignore` files for both to optimize build context).

2. **HELM CHART DEVELOPMENT:**
   - T-4.4: Chart Scaffolding (Create the directory structure for `todo-backend` and `todo-frontend` charts in `/k8s/charts/`).
   - T-4.5: Backend Templates (Implement `deployment.yaml`, `service.yaml`, and `secret.yaml` for the backend).
   - T-4.6: Frontend Templates (Implement `deployment.yaml`, `service.yaml`, and `configmap.yaml` for the frontend).
   - T-4.7: Values Configuration (Define default `values.yaml` for both charts with resource limits and environment variables).

3. **K8S ORCHESTRATION & DEPLOYMENT:**
   - T-4.8: Image Build & Load (Provide instructions/commands to build Docker images and load them into Minikube via `minikube image load`).
   - T-4.9: Secret Management (Create a script or command to generate the K8s Secret for `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `GROQ_API_KEY`).
   - T-4.10: Helm Deployment (Deploy both charts to the Minikube cluster using `helm upgrade --install`).

4. **AIOPS & VERIFICATION:**
   - T-4.11: Health Check Verification (Verify pod status, liveness/readiness probes, and logs using `kubectl`).
   - T-4.12: Accessing the App (Expose the frontend service via `minikube service` and verify the SaaS UI is functional).

5. **VERIFICATION CRITERIA:**
   - T-4.3 is verified when Docker images are under 500MB.
   - T-4.10 is verified when `kubectl get pods` shows all pods in `Running` state.
   - T-4.12 is verified when the chatbot can still add a task while running inside Kubernetes.

6. **STYLISTIC RULES:**
   - Use Task IDs in comments: `# [Task]: T-4.x`.
   - Ensure the `user_id` logic and JWT flow are preserved across the network boundary within the cluster.

## Response snapshot

Generated 22 tasks across 7 phases organized by 4 user stories (US1–US4) from spec.md.

**Phase 1 (Setup)**: T-4.0 — add `output: 'standalone'` to `next.config.mjs` (prerequisite for frontend Dockerfile)

**Phase 2 (Foundational)**: T-4.1 [P], T-4.2 [P], T-4.3a [P], T-4.3b [P] — all 4 Dockerfiles and .dockerignore files run in parallel

**Phase 3 (US1 — Full Stack Deploy)**: T-4.4 Helm scaffold, T-4.5 backend templates (deployment+service), T-4.6 frontend templates (deployment+service+configmap), T-4.7 helm lint, T-4.8 image build, T-4.10 helm upgrade --install

**Phase 4 (US2 — Secrets)**: T-4.9 backend-secret.yaml template, T-4.9b secrets.values.yaml.example, T-4.9c .gitignore entry

**Phase 5 (US3 — AI Chatbot)**: T-4.11 pod health + logs, T-4.11b in-cluster DNS, T-4.11c end-to-end chat test

**Phase 6 (US4 — AIOps)**: T-4.12a kubectl-ai install, T-4.12b standard query set

**Phase 7 (Polish)**: T-4.13 .helmignore, T-4.14 copy tasks, T-4.15 uninstall test, T-4.16 security audit, T-4.17 CLAUDE.md update

Tasks written to `specs/007-local-k8s-deploy/tasks.md` and mirrored to `todo-web-app/k8s/specs/k8s-tasks.md`.

## Outcome

- ✅ Impact: 22 immediately-executable tasks organized by US1–US4; ready for /sp.implement
- 🧪 Tests: No test tasks (not requested); each story has an Independent Test criterion
- 📁 Files: specs/007-local-k8s-deploy/tasks.md, todo-web-app/k8s/specs/k8s-tasks.md
- 🔁 Next prompts: /sp.implement — execute all tasks to create Dockerfiles, Helm chart, and deploy
- 🧠 Reflection: Added T-4.0 (not in user's list) as a Setup prerequisite because next.config.mjs must have `output: 'standalone'` before any frontend image build; this was flagged as Risk 1 in the plan. Kept user's T-4.x numbering throughout for traceability.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all 22 tasks follow checklist format (checkbox + ID + [P?] + [Story?] + description with file path)
- Prompt variant (if applicable): null
- Next experiment: Consider adding a Makefile task (T-4.make) that wraps the 3-command deploy sequence into a single `make deploy` target
