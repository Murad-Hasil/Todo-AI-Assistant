# Tasks: Local Kubernetes Deployment (Phase 4)

**Input**: Design documents from `/specs/007-local-k8s-deploy/`
**Plan**: `specs/007-local-k8s-deploy/plan.md`
**Spec**: `specs/007-local-k8s-deploy/spec.md`
**Branch**: `007-local-k8s-deploy`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label — [US1], [US2], [US3], [US4]
- Task IDs follow T-4.x convention matching Phase 4

---

## Phase 1: Setup (Pre-requisite — Blocks All Stories)

**Purpose**: Make existing source code container-ready. This is the only change to existing files.

**⚠️ CRITICAL**: Complete T-4.0 before any Docker image build is attempted.

- [x] T-4.0 Add `output: 'standalone'` to `todo-web-app/frontend/next.config.mjs` so the Next.js runner stage can start with `node server.js`

**Verification**: `cat todo-web-app/frontend/next.config.mjs` shows `output: 'standalone'` inside the `nextConfig` object.

**Checkpoint**: next.config.mjs updated — Dockerfile builds can now proceed.

---

## Phase 2: Foundational (Dockerization — Blocks US1)

**Purpose**: Multi-stage Docker builds for backend and frontend. All 4 tasks can run in parallel once T-4.0 is done.

**⚠️ CRITICAL**: No Helm deployment can succeed until both images build cleanly.

- [x] T-4.1 [P] Create `todo-web-app/backend/Dockerfile` — multi-stage python:3.13-slim with uv; builder stage: copy `pyproject.toml` + `uv.lock`, `COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv`, run `uv sync --frozen --no-dev`; runner stage: copy `.venv` + `app/`, non-root user 1001, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]`
- [x] T-4.2 [P] Create `todo-web-app/frontend/Dockerfile` — three-stage node:20-alpine: `deps` stage runs `npm ci --omit=dev`; `builder` stage copies source + declares `ARG NEXT_PUBLIC_API_URL` + runs `npm run build`; `runner` stage copies `.next/standalone` + `.next/static` + `public/`, non-root user nextjs, `CMD ["node", "server.js"]`
- [x] T-4.3a [P] Create `todo-web-app/backend/.dockerignore` — exclude: `.venv/`, `__pycache__/`, `*.pyc`, `*.pyo`, `.env`, `.env.*`, `tests/`, `.git/`, `.gitignore`, `migrations/`, `*.egg-info/`, `dist/`, `build/`, `.pytest_cache/`, `.mypy_cache/`
- [x] T-4.3b [P] Create `todo-web-app/frontend/.dockerignore` — exclude: `node_modules/`, `.next/`, `.env`, `.env.*`, `.env.local`, `.git/`, `.gitignore`, `README.md`, `*.log`, `.playwright-mcp/`

**Verification (T-4.3a/b)**: Run `docker build -t todo-backend:test ./todo-web-app/backend/` and `docker build --build-arg NEXT_PUBLIC_API_URL=http://192.168.49.2:30800 -t todo-frontend:test ./todo-web-app/frontend/` — both complete with 0 errors; `docker image ls` shows both images under 600MB.

**Checkpoint**: Foundation complete — Helm chart development can now proceed.

---

## Phase 3: User Story 1 — Developer Deploys the Full Stack in One Command (Priority: P1) 🎯 MVP

**Goal**: A developer runs ≤3 terminal commands from a clean Minikube cluster and has the full application accessible in a browser within 10 minutes.

**Independent Test**: On a machine with Minikube + Helm installed, run the 3-command deploy sequence and verify `kubectl get pods` shows both pods `1/1 Running` and `minikube service todoai-frontend` opens a working login page.

### Implementation for User Story 1

- [x] T-4.4 [US1] Create Helm chart scaffold at `todo-web-app/k8s/charts/todoai/` — write `Chart.yaml` (`apiVersion: v2, name: todoai, version: 0.1.0, appVersion: "2.2.0"`) and `values.yaml` (all values per the plan: backend image, frontend image, nodePort 30800/30300, resource requests/limits 128Mi–256Mi backend, 192Mi–384Mi frontend, replicaCount 1, imagePullPolicy Never)
- [x] T-4.5 [US1] Create backend Helm templates in `todo-web-app/k8s/charts/todoai/templates/`:
  - `backend-deployment.yaml` — Deployment `todoai-backend`, 1 replica, `imagePullPolicy: Never`, resources (requests 128Mi/250m, limits 256Mi/500m), livenessProbe httpGet `/health`:8000 (initialDelay 15s, period 20s, failureThreshold 3), readinessProbe httpGet `/health`:8000 (initialDelay 10s, period 10s), env vars sourced from Secret `todoai-backend-secret` (DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY, CORS_ORIGINS)
  - `backend-service.yaml` — Service `todoai-backend-svc`, type NodePort, port 8000 → targetPort 8000 → nodePort 30800
- [x] T-4.6 [US1] Create frontend Helm templates in `todo-web-app/k8s/charts/todoai/templates/`:
  - `frontend-deployment.yaml` — Deployment `todoai-frontend`, 1 replica, `imagePullPolicy: Never`, resources (requests 192Mi/250m, limits 384Mi/500m), readinessProbe httpGet `/`:3000 (initialDelay 20s, period 10s, failureThreshold 3), `ENV PORT=3000 NODE_ENV=production`
  - `frontend-service.yaml` — Service `todoai-frontend`, type NodePort, port 3000 → targetPort 3000 → nodePort 30300
  - `frontend-configmap.yaml` — ConfigMap `todoai-frontend-config` with key `NEXT_PUBLIC_API_URL: "http://MINIKUBE_IP:30800"` (documentation only — value is baked at build time)
- [x] T-4.7 [US1] Validate Helm chart structure — run `helm lint ./todo-web-app/k8s/charts/todoai` (must exit 0, print `1 chart(s) linted, 0 chart(s) failed`); also run `helm template todoai ./todo-web-app/k8s/charts/todoai --set backend.secret.DATABASE_URL=test --set backend.secret.BETTER_AUTH_SECRET=test --set backend.secret.GROQ_API_KEY=test --set backend.secret.CORS_ORIGINS=test` and verify 6 Kubernetes objects are rendered (2 Deployments, 2 Services, 1 Secret, 1 ConfigMap)
- [ ] T-4.8 [US1] Build Docker images directly into Minikube's daemon and confirm images are available — run: `eval $(minikube docker-env) && docker build -t todo-backend:local ./todo-web-app/backend/ && docker build --build-arg NEXT_PUBLIC_API_URL=http://$(minikube ip):30800 -t todo-frontend:local ./todo-web-app/frontend/`; verify with `minikube ssh docker images | grep todo-`
- [ ] T-4.10 [US1] Deploy the full stack with Helm and verify both pods reach Running — run: `helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml`; then watch with `kubectl get pods --watch` until both pods show `1/1 Running`

**Verification**: `kubectl get pods` shows `todoai-backend-XXXX 1/1 Running` and `todoai-frontend-XXXX 1/1 Running`. `minikube service todoai-frontend` opens a browser showing the TodoAI login page.

**Checkpoint**: User Story 1 complete — developer can deploy and access the app in ≤3 commands.

---

## Phase 4: User Story 2 — Application Secrets Are Never Exposed in Version Control (Priority: P1)

**Goal**: No credential values ever appear in any committed file; sensitive values are injected exclusively via Kubernetes Secrets at deploy time.

**Independent Test**: Run `git grep -rn "DATABASE_URL=\|GROQ_API_KEY=\|BETTER_AUTH_SECRET="` in the repository and confirm zero matches. Separately, deploy using `secrets.values.yaml` (not committed) and confirm pods authenticate to Neon PostgreSQL.

### Implementation for User Story 2

- [x] T-4.9 [US2] Create `todo-web-app/k8s/charts/todoai/templates/backend-secret.yaml` — Kubernetes Secret template `todoai-backend-secret` using `stringData` with Helm template values: `DATABASE_URL: {{ .Values.backend.secret.DATABASE_URL | quote }}`, `BETTER_AUTH_SECRET: {{ .Values.backend.secret.BETTER_AUTH_SECRET | quote }}`, `GROQ_API_KEY: {{ .Values.backend.secret.GROQ_API_KEY | quote }}`, `CORS_ORIGINS: {{ .Values.backend.secret.CORS_ORIGINS | quote }}`
- [x] T-4.9b [US2] Create `todo-web-app/k8s/charts/todoai/secrets.values.yaml.example` — placeholder values only: `DATABASE_URL: "postgresql://user:password@host/dbname?sslmode=require"`, `BETTER_AUTH_SECRET: "your-better-auth-secret-here"`, `GROQ_API_KEY: "gsk_your_groq_api_key_here"`, `CORS_ORIGINS: "http://192.168.49.2:30300"` (no real credentials)
- [x] T-4.9c [US2] Add `secrets.values.yaml` to repository `.gitignore` (repo root `/home/brownie/projects/hackathon-II/.gitignore`) under a `# K8s secrets` comment; also add `todo-web-app/k8s/charts/todoai/secrets.values.yaml` explicitly; verify with `git status` that the file is not tracked

**Verification**: `git grep -rn "DATABASE_URL\|GROQ_API_KEY\|BETTER_AUTH_SECRET" -- "*.yaml" "*.yml"` returns only `secrets.values.yaml.example` with placeholder values. `kubectl describe pod todoai-backend-XXXX` shows env var names but not their values.

**Checkpoint**: User Story 2 complete — all secrets injection validated, no credentials in VCS.

---

## Phase 5: User Story 3 — AI Chatbot Remains Fully Functional After Containerization (Priority: P2)

**Goal**: Verify that the Groq API key is correctly injected, outbound network from the backend pod reaches the Groq API endpoint, and the chat feature works end-to-end inside the cluster.

**Independent Test**: After full-stack deploy, log in, open the chat drawer, type "Add a task: test containerized AI", and confirm the AI responds with a confirmation within 10 seconds and the task appears in the list.

### Implementation for User Story 3

- [ ] T-4.11 [US3] Verify backend health probes and pod logs — run `kubectl get pods`, `kubectl describe pod <backend-pod>` (confirm readinessProbe and livenessProbe status), `kubectl logs <backend-pod>` (confirm uvicorn startup logs with no errors), and `kubectl exec <backend-pod> -- curl -s http://localhost:8000/health` (confirm `{"status":"ok"}`)
- [ ] T-4.11b [US3] Verify in-cluster DNS resolution — run `kubectl exec <frontend-pod> -- wget -qO- http://todoai-backend-svc:8000/health` and confirm `{"status":"ok"}` is returned, proving in-cluster DNS is functional between pods
- [ ] T-4.11c [US3] Verify AI chatbot end-to-end in container — open `minikube service todoai-frontend`, log in, open the chat drawer, send "Add a task: test containerized AI", verify the AI responds with a confirmation within 10 seconds and the task card "test containerized AI" appears in the task grid

**Verification**: Chat response received within 10 seconds; task appears in dashboard; `kubectl logs <backend-pod>` shows `POST /api/chat 200` log line.

**Checkpoint**: User Story 3 complete — Phase 3 AI functionality fully preserved in containerized environment.

---

## Phase 6: User Story 4 — AIOps Cluster Inspection with Natural Language (Priority: P3)

**Goal**: An engineer can query cluster state in plain English using `kubectl-ai` without memorizing `kubectl` syntax.

**Independent Test**: Run `kubectl-ai "Show me all pods and their status"` and verify a human-readable summary of both pods is returned within 5 seconds.

### Implementation for User Story 4

- [ ] T-4.12a [US4] Install `kubectl-ai` via the preferred method for WSL2/Linux: `curl -Lo kubectl-ai.gz https://github.com/sozercan/kubectl-ai/releases/latest/download/kubectl-ai_linux_amd64.gz && gunzip kubectl-ai.gz && chmod +x kubectl-ai && sudo mv kubectl-ai /usr/local/bin/kubectl-ai`; set `OPENAI_API_KEY=$GROQ_API_KEY` and `OPENAI_API_BASE=https://api.groq.com/openai/v1` in shell environment
- [ ] T-4.12b [US4] Run the standard AIOps inspection query set from the plan to verify kubectl-ai is functional:
  - `kubectl-ai "Are all pods healthy?"` → confirm human-readable pod readiness summary
  - `kubectl-ai "Show logs for the todoai-backend pod"` → confirm log output returned
  - `kubectl-ai "What is the CPU and memory usage of all pods?"` → confirm resource summary returned
  - `kubectl-ai "List all services and their NodePort assignments"` → confirm network topology summary

**Verification**: `kubectl-ai "Are all pods healthy?"` returns a natural language summary confirming `todoai-backend` and `todoai-frontend` are both Ready. No manual `kubectl` commands required for any of the above queries.

**Checkpoint**: User Story 4 complete — AIOps workflow operational.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, cleanup, and documentation finalization.

- [x] T-4.13 [P] Add `todo-web-app/k8s/charts/todoai/secrets.values.yaml` to `todo-web-app/k8s/charts/todoai/.helmignore` to prevent it from being packaged in `helm package` output
- [x] T-4.14 [P] Copy tasks.md to `todo-web-app/k8s/specs/k8s-tasks.md` so the k8s/ directory has the full plan/tasks/spec set in one location
- [ ] T-4.15 Run `helm uninstall todoai` and verify `kubectl get all` shows no remaining `todoai-*` resources — confirms AC-13 from plan acceptance checklist
- [x] T-4.16 Run security audit: `git grep -rn "DATABASE_URL=\|GROQ_API_KEY=\|BETTER_AUTH_SECRET=" -- "*.yaml" "*.yml" "*.md" "*.json"` — must return zero matches; also verify `git ls-files | grep secrets.values.yaml` returns empty
- [x] T-4.17 Update `CLAUDE.md` at repo root — add under Recent Changes: `007-local-k8s-deploy: Docker multi-stage builds (Python 3.13-slim, Node 20-alpine), Helm chart todoai with 6 templates, Minikube NodePort deployment`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational — Dockerization)
    │
    ├── Phase 3 (US1 — Full Stack Deploy)   ← MVP: stop here first
    │       │
    │       ├── Phase 4 (US2 — Secrets)     ← required alongside US1 (both P1)
    │       │
    │       ├── Phase 5 (US3 — AI Chatbot)  ← requires running cluster from US1
    │       │
    │       └── Phase 6 (US4 — AIOps)       ← requires running cluster from US1
    │
    └── Phase 7 (Polish)                    ← after all stories complete
```

### Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (Dockerfiles must build cleanly)
- **US2 (P1)**: Depends on Phase 3 T-4.4–T-4.6 (Helm templates must exist before Secret template is added); can be worked in parallel with US1 after T-4.4
- **US3 (P2)**: Depends on US1 cluster being running; requires `GROQ_API_KEY` from US2
- **US4 (P3)**: Depends on US1 cluster being running; independent of US2/US3

### Parallel Opportunities

Within **Phase 2**: T-4.1, T-4.2, T-4.3a, T-4.3b all [P] — run simultaneously

Within **US1**: T-4.5 and T-4.6 — backend and frontend templates [P] after T-4.4 chart scaffold

Within **Polish**: T-4.13 and T-4.14 are [P] — run simultaneously

---

## Parallel Example: Phase 2 Dockerization

```
Launch all 4 foundation tasks simultaneously (different files, no dependencies):

Task A: Create todo-web-app/backend/Dockerfile            [T-4.1]
Task B: Create todo-web-app/frontend/Dockerfile           [T-4.2]
Task C: Create todo-web-app/backend/.dockerignore         [T-4.3a]
Task D: Create todo-web-app/frontend/.dockerignore        [T-4.3b]
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — both P1)

1. Complete **Phase 1**: Add `output: 'standalone'` to next.config.mjs
2. Complete **Phase 2**: Create all 4 Dockerfiles + .dockerignore files
3. Complete **Phase 3 (US1)**: Helm chart + templates + lint + build + deploy
4. Complete **Phase 4 (US2)**: Secret template + secrets.values.yaml.example + .gitignore
5. **STOP and VALIDATE**: `kubectl get pods` shows `1/1 Running`, login page loads, task CRUD works
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Docker images build cleanly
2. US1 + US2 → Full stack deployed with secrets isolation (P1 MVP)
3. US3 → AI chatbot verified in container
4. US4 → AIOps workflow documented and functional
5. Polish → Security audit, helm uninstall test, docs updated

---

## Notes

- `# [Task]: T-4.x` comment style required in all created files per stylistic rules
- `user_id` and JWT flow are untouched — containerization wraps existing code without modification; `auth.py` FastAPI dependency remains identical inside the container
- `imagePullPolicy: Never` is required in both Deployments — without it, Kubernetes attempts a registry pull and fails because `todo-backend:local` and `todo-frontend:local` are Minikube-local images only
- The `uv.lock` file is committed to the repository and must be present in `todo-web-app/backend/` at build time for `uv sync --frozen` to work
- Do NOT modify any file under `todo-web-app/backend/app/` or `todo-web-app/frontend/src/` — containerization is additive only
