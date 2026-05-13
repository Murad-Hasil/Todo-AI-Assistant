---
id: "0002"
title: Phase 4 K8s Deployment Plan
stage: plan
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.plan
labels: ["kubernetes","helm","docker","minikube","phase4","planning","cloud-ops"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-local-k8s-deploy/research.md
  - specs/007-local-k8s-deploy/plan.md
  - specs/007-local-k8s-deploy/quickstart.md
  - specs/007-local-k8s-deploy/contracts/health-check.yaml
  - todo-web-app/k8s/specs/k8s-deployment.md
  - todo-web-app/k8s/specs/k8s-plan.md
  - CLAUDE.md
  - .claude/agent-memory/cloud-ops-agent/MEMORY.md
tests:
  - "helm lint ./todo-web-app/k8s/charts/todoai (to be run in tasks phase)"
  - "docker build -t todo-backend:local ./todo-web-app/backend/ (to be run in tasks phase)"
  - "kubectl get pods --watch (to be run after helm install)"
---

## Prompt

Generate all planning artifacts for Phase 4: Local Kubernetes Deployment of a TodoAI full-stack application (Next.js 14+ frontend + FastAPI backend).

## Context

**Repo root**: `/home/brownie/projects/hackathon-II`
**Branch**: `007-local-k8s-deploy`
**Spec file**: `/home/brownie/projects/hackathon-II/specs/007-local-k8s-deploy/spec.md` (already written, do NOT modify)
**Plan template** (already copied to): `/home/brownie/projects/hackathon-II/specs/007-local-k8s-deploy/plan.md` — OVERWRITE this with the full plan

## Existing App Stack

- **Backend**: FastAPI 0.115+, Python 3.13, SQLModel, `uvicorn[standard]>=0.30.0`, `openai-agents`, `mcp[cli]`, `PyJWT`, `pydantic-settings`, `psycopg2-binary`. Dependencies in `todo-web-app/backend/pyproject.toml` (uses `uv`). Entry point: `uvicorn app.main:app`. Health endpoint: `GET /health` returns `{"status":"ok"}`. CORS origins from `CORS_ORIGINS` env var (comma-separated).
- **Frontend**: Next.js 16.1.6 (App Router), TypeScript, Tailwind. `NEXT_PUBLIC_API_URL` env var for backend base URL. Uses `npm`.
- **Database**: Neon PostgreSQL (external, stays external — no in-cluster DB). `DATABASE_URL` env var.
- **Auth**: Better Auth (`BETTER_AUTH_SECRET` env var) + JWT (`BETTER_AUTH_SECRET` shared).
- **AI**: Groq API (`GROQ_API_KEY` env var).

## User Requirements

From `/sp.plan` invocation:
1. **Backend Dockerfile**: multi-stage python:3.13-slim; use `uv` for dep install; `uvicorn` entrypoint
2. **Frontend Dockerfile**: multi-stage node:20-alpine build + node:20-alpine runner; `NEXT_PUBLIC_API_URL` handled as build arg
3. **Image loading**: `minikube image load` strategy
4. **Helm chart**: single `charts/todoai` in `todo-web-app/k8s/charts/todoai/` containing both backend and frontend templates
   - Backend templates: `deployment.yaml`, `service.yaml`, `secret.yaml`
   - Frontend templates: `deployment.yaml`, `service.yaml`, `configmap.yaml`
   - Backend Service: ClusterIP (in-cluster DNS: `todoai-backend-svc:8000`)
   - Frontend Service: NodePort (accessible via `minikube service`)
5. **Resource limits**: Backend 256Mi/0.5CPU, Frontend 384Mi/0.5CPU
6. **Health probes**: livenessProbe + readinessProbe on `/health` for backend
7. **AIOps**: kubectl-ai workflow documentation
8. **Directory**: Dockerfiles in their respective app folders; Helm chart in `todo-web-app/k8s/charts/`

## NEXT_PUBLIC_API_URL Networking Decision

`NEXT_PUBLIC_*` vars are baked into the Next.js bundle at build time. For Minikube:
- Frontend pod (SSR) can reach backend via ClusterIP DNS `http://todoai-backend-svc:8000`
- Browser (user) cannot resolve K8s DNS — needs external URL

**Solution**: Backend also exposed as NodePort (port 30800). `NEXT_PUBLIC_API_URL` is set as a Docker build arg to the NodePort URL `http://$(minikube ip):30800`. This works for both SSR and browser since Minikube NodePort is reachable from the developer's machine.

[Full prompt text preserved — see original user message for complete files-to-create specification including research.md, plan.md, quickstart.md, contracts/health-check.yaml, todo-web-app/k8s/specs/ files, and CLAUDE.md update requirements]

## Response snapshot

Generated 7 files for Phase 4 Local Kubernetes Deployment planning:

1. `specs/007-local-k8s-deploy/research.md` — 6 research findings: base image selection (python:3.13-slim over distroless/alpine), uv vs pip for dependency install, NEXT_PUBLIC_API_URL build-time baking rationale, single Helm chart vs umbrella decision, backend NodePort exposure strategy, minikube docker-env build approach.

2. `specs/007-local-k8s-deploy/plan.md` — Full technical plan with: Constitution Check (5 principles, 1 justified violation), project structure tree, backend multi-stage Dockerfile spec (builder+runner), frontend multi-stage Dockerfile spec (deps+builder+runner with standalone output note), Helm chart architecture (Chart.yaml, values.yaml, 6 template inventory), Kubernetes resource design for all 6 K8s objects, networking/CORS traffic flow diagram, 3-command deployment workflow, AIOps kubectl-ai queries, 15-item acceptance checklist, 3 follow-up risks.

3. `specs/007-local-k8s-deploy/quickstart.md` — Step-by-step developer guide covering: prerequisites table, minikube start with resource flags, secrets.values.yaml creation, docker build commands with eval minikube docker-env, helm upgrade --install, pod verification, minikube service command, AIOps inspection queries, helm management commands, teardown, and troubleshooting table (10 common failure scenarios).

4. `specs/007-local-k8s-deploy/contracts/health-check.yaml` — OpenAPI 3.0.3 spec for GET /health with 200 and 503 response schemas, two server entries (ClusterIP and NodePort), and example responses.

5. `todo-web-app/k8s/specs/k8s-deployment.md` — Pointer file to authoritative spec.

6. `todo-web-app/k8s/specs/k8s-plan.md` — Full plan content mirrored for infrastructure navigation.

7. `CLAUDE.md` — Active Technologies section updated with 3 new entries for 007-local-k8s-deploy: Docker multi-stage builds, Helm 3 + Minikube, kubectl-ai AIOps.

8. `.claude/agent-memory/cloud-ops-agent/MEMORY.md` — Agent memory initialized with confirmed patterns, key file paths, and risks.

## Outcome

- Impact: Complete Phase 4 planning artifacts created; implementation-ready specs for Dockerfiles, Helm chart, and K8s manifests. No existing source code modified.
- Tests: No tests run (plan stage only); helm lint and docker build commands documented for tasks phase.
- Files: 8 files created/modified (see files list above)
- Next prompts: Run `/sp.tasks 007-local-k8s-deploy` to generate testable implementation tasks from this plan
- Reflection: The NEXT_PUBLIC_API_URL networking constraint (build-time baking) was the most architecturally significant decision — it drives the NodePort exposure strategy for the backend and determines the entire networking topology.

## Evaluation notes (flywheel)

- Failure modes observed: None — plan stage only
- Graders run and results (PASS/FAIL): Constitution Check PASS (4/5 principles), Principle VII justified violation documented
- Prompt variant (if applicable): null
- Next experiment: Verify next.config.mjs already has output:standalone before writing frontend Dockerfile task
