# Todo Web App — Monorepo Agent Context

**Phase**: 2 (Full-Stack Web Application)
**Constitution**: `.specify/memory/constitution.md` v2.0.0
**Last Updated**: 2026-03-03

## Monorepo Structure

```
todo-web-app/
├── CLAUDE.md           # This file — root context
├── backend/
│   ├── CLAUDE.md       # Backend-specific context
│   └── app/            # FastAPI service
└── frontend/           # Next.js 14+ (Phase 2.3)
    └── CLAUDE.md       # Frontend-specific context (TBD)
```

## Active Phase: 2.1 — Backend API & Database

- Backend: FastAPI + SQLModel + Neon PostgreSQL
- Auth: Better Auth (frontend, Phase 2.3) + JWT stub (backend, Phase 2.1)
- Specs: `specs/002-backend-api-db/`

## Non-Negotiable Rules (Constitution v2.0.0)

1. No code without spec reference (`@specs/features/`, `@specs/api/`, `@specs/database/`)
2. Read frontend AND backend before modifying shared concerns
3. Phase 3 integration MUST NOT require rewriting CRUD or auth logic
4. All backend via `/api/` prefix; Pydantic for all I/O
5. Every query scoped to `user_id` — cross-user access is a critical violation
6. JWT from `Authorization: Bearer` only; stub active in Phase 2.1

## Phase 4: Local Kubernetes Deployment (007-local-k8s-deploy)

### Quick Deploy (3 commands)

```bash
# 1. Build images into Minikube's Docker daemon
eval $(minikube docker-env) && \
  docker build -t todo-backend:local ./todo-web-app/backend/ && \
  docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 \
    -t todo-frontend:local ./todo-web-app/frontend/

# 2. Deploy with Helm (copy secrets.values.yaml.example → secrets.values.yaml first)
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml

# 3. Open in browser
minikube service todoai-frontend
```

### K8s Infrastructure

- Helm chart: `todo-web-app/k8s/charts/todoai/` (single chart, 6 templates)
- Backend NodePort: `http://$(minikube ip):30800` (Service: `todoai-backend-svc`)
- Frontend NodePort: `http://$(minikube ip):30300` (Service: `todoai-frontend`)
- Secrets: `todo-web-app/k8s/charts/todoai/secrets.values.yaml` (gitignored — never commit)
- Example: `todo-web-app/k8s/charts/todoai/secrets.values.yaml.example`

### Active Technologies (Phase 4)

- Docker multi-stage builds: `python:3.13-slim` (backend), `node:20-alpine` (frontend)
- Helm 3, Minikube 1.32+, `imagePullPolicy: Never` (local images only)
- `NEXT_PUBLIC_API_URL` baked at build time via `--build-arg`
- `CORS_ORIGINS` injected at runtime via Kubernetes Secret
