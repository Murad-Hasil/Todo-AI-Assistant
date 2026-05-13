# Cloud Ops Agent Memory — hackathon-II

## Project Identity
- Repo root: `/home/brownie/projects/hackathon-II`
- Active web app: `todo-web-app/` (monorepo sub-project)
- Backend: `todo-web-app/backend/` — FastAPI 0.115+, Python 3.13, uv package manager
- Frontend: `todo-web-app/frontend/` — Next.js 16.1.6 (App Router), TypeScript, Tailwind
- K8s infra: `todo-web-app/k8s/` — Helm charts, K8s specs

## Confirmed Patterns

### Namespace / Labels
- Kubernetes namespace: `default` (local Minikube dev; no multi-namespace strategy yet)
- Label schema: `app.kubernetes.io/name`, `app.kubernetes.io/part-of` (component/version NOT used in this project)

### Helm Chart Structure (007-local-k8s-deploy) — CONFIRMED BUILT
- Chart location: `todo-web-app/k8s/charts/todoai/`
- Single chart (not umbrella) containing both backend and frontend templates
- imagePullPolicy: `Never` for all local images (minikube docker-env build strategy)
- secrets.values.yaml excluded from git; example file committed at `secrets.values.yaml.example`
- 6 templates: backend-secret, backend-deployment, backend-service, frontend-configmap, frontend-deployment, frontend-service

### Image Strategy — CONFIRMED
- Build method: `eval $(minikube docker-env)` then `docker build` directly into Minikube's daemon
- Backend tag: `todo-backend:local`; Frontend tag: `todo-frontend:local`
- No external registry used for local dev
- Backend base: `python:3.13-slim` (2-stage: builder + runner); uv from `ghcr.io/astral-sh/uv:latest`
- Frontend base: `node:20-alpine` (3-stage: deps + builder + runner)
- Non-root: backend UID 1001 appuser; frontend GID 1001 nodejs / UID 1001 nextjs

### NEXT_PUBLIC_API_URL Pattern — CONFIRMED
- Baked at build time via `--build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800`
- Cannot be changed at container runtime — Next.js inlines it during `next build`
- Backend exposed as NodePort 30800 so both browser and SSR can use same URL
- next.config.mjs MUST include `output: 'standalone'` — CONFIRMED ADDED in 007 session

### Resource Sizing (Minikube 3GB) — CONFIRMED
- Backend: requests 128Mi/250m, limits 256Mi/500m
- Frontend: requests 192Mi/250m, limits 384Mi/500m
- Combined limits: 640Mi — well under 2.5GB app cap

### Backend Health Probes — CONFIRMED
- livenessProbe: GET /health, initialDelay 15s, period 20s, failureThreshold 3, timeout 5s
- readinessProbe: GET /health, initialDelay 10s, period 10s, failureThreshold 3, timeout 5s
- Frontend readinessProbe: GET /, initialDelay 20s, period 10s, failureThreshold 3, timeout 10s

## Key Files
- Backend pyproject.toml: `todo-web-app/backend/pyproject.toml` (uses uv, requires-python >=3.13)
- Frontend package.json: `todo-web-app/frontend/package.json` (next ^16.1.6, npm)
- Helm chart: `todo-web-app/k8s/charts/todoai/` (BUILT — Chart.yaml, values.yaml, 6 templates)
- K8s specs: `todo-web-app/k8s/specs/` (mirror of specs/007-local-k8s-deploy/ tasks/plan/spec)
- next.config.mjs: `todo-web-app/frontend/next.config.mjs` — has `output: 'standalone'`

## Risks to Watch
- WSL2 + Docker driver: $(minikube ip) may not be browser-reachable; `minikube tunnel` fallback
- CORS_ORIGINS must exactly match frontend NodePort URL including port (set in secrets.values.yaml)
- uv.lock must be present in backend/ at build time — it IS committed to the repo
