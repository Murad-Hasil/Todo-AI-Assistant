# Research: Local Kubernetes Deployment (Phase 4)

**Feature Branch**: `007-local-k8s-deploy`
**Date**: 2026-03-05
**Spec**: [specs/007-local-k8s-deploy/spec.md](./spec.md)

---

## Base Image Selection: python:3.13-slim vs distroless

**Decision**: Use `python:3.13-slim` for both builder and runner stages of the backend image.

**Rationale**: `python:3.13-slim` (Debian-based, stripped) provides a predictable shell environment useful for debugging in local Minikube sessions (`kubectl exec -it`). Distroless images eliminate shell access entirely, which is a security advantage in production but a maintenance burden in local development where `kubectl exec` and `ps` are standard debugging tools. Since this is a local Kubernetes deployment for developer use, the debugging ergonomics outweigh the marginal security gain. The slim variant still removes documentation, locale data, and build tooling, keeping the runtime image small (~130MB versus ~1.1GB full image).

**Alternatives considered**: `python:3.13-alpine` was considered for its even smaller footprint (~50MB) but rejected because several Python packages in `pyproject.toml` — particularly `psycopg2-binary` and `uvicorn[standard]` — include C extensions that require `glibc`. Alpine uses `musl libc`, which causes binary incompatibilities without full recompilation. Using `python:3.13-slim` avoids this class of failure entirely. Distroless `gcr.io/distroless/python3` was rejected for the debugging reason stated above.

---

## Dependency Installation: uv vs pip

**Decision**: Use `uv` for dependency installation in the backend builder stage (`uv sync --frozen --no-dev`), copying the resulting `.venv` into the runner stage.

**Rationale**: The backend already uses `uv` as its package manager (evidenced by `uv.lock` at `todo-web-app/backend/uv.lock` and `pyproject.toml` with `[dependency-groups]`). Using `uv` in the Dockerfile preserves the lock-file-reproducible build and is 10–100x faster than `pip install` for cold builds. The `--frozen` flag ensures the lock file is not updated during the Docker build, guaranteeing reproducibility. `--no-dev` excludes `pytest`, `httpx`, and other dev dependencies from the production image.

**Alternatives considered**: `pip install -r requirements.txt` was rejected because it requires a separate `requirements.txt` export step that would introduce drift from `uv.lock`. `pip install .` from `pyproject.toml` was rejected because it does not honor the lock file, allowing transitive dependency version drift between environments. A multi-layer approach installing `uv` via `pip install uv` first was rejected in favor of installing `uv` via its official install script (`curl -LsSf https://astral.sh/uv/install.sh | sh`) or the pinned binary approach (`COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv`) for reproducibility.

---

## NEXT_PUBLIC_API_URL: Build-time Baking vs Runtime Injection

**Decision**: Bake `NEXT_PUBLIC_API_URL` at Docker build time as a `--build-arg`, setting it to `http://$(minikube ip):30800` (the backend's NodePort URL).

**Rationale**: Next.js 14 App Router processes `NEXT_PUBLIC_*` environment variables at `next build` time — they are inlined into the JavaScript bundle via static analysis. They cannot be changed at container runtime without a full rebuild, regardless of what environment variables are set in the Kubernetes Pod spec. This is a fundamental constraint of the Next.js build system. The decision therefore is not whether to bake them, but what value to bake. The NodePort URL `http://$(minikube ip):30800` satisfies both browser-side (client components) and SSR calls, since the Minikube NodePort is accessible from the developer's host machine, and SSR running inside the frontend pod can also route through the NodePort (the pod has outbound network access to Minikube's host network).

**Alternatives considered**: 
- Runtime injection via `env:` in the Pod spec was rejected because it does not work for `NEXT_PUBLIC_*` variables — they are already compiled into the bundle by the time the container starts. 
- A Next.js custom server with `server.js` was considered to proxy backend calls server-side, allowing the URL to remain dynamic at runtime. This was rejected as it adds significant complexity and deviates from the standard `next start` deployment model. 
- Using the ClusterIP DNS name `http://todoai-backend-svc:8000` was considered for SSR calls. This works inside the cluster but browser-side client components cannot resolve Kubernetes DNS — the client has no access to the cluster's CoreDNS. This would require splitting the URL by render context, which is not supported by `NEXT_PUBLIC_*` semantics.
- An Nginx sidecar or reverse proxy to rewrite API paths was considered and rejected for the same complexity reason.

---

## Helm Chart Structure: Single Chart vs Umbrella/Subchart

**Decision**: Single Helm chart named `todoai` containing both backend and frontend templates under `todo-web-app/k8s/charts/todoai/`.

**Rationale**: The backend and frontend are tightly coupled components of a single application — they share the same Kubernetes namespace, the same `helm install`/`helm uninstall` lifecycle, and the same set of secrets. An umbrella chart with subcharts (`todoai/charts/backend/` and `todoai/charts/frontend/`) would add directory depth, a second `Chart.yaml` per subchart, and a `helm dependency update` step with no functional benefit at this scale (2 services). A single chart keeps the number of Helm commands at 1 (`helm upgrade --install todoai ./charts/todoai`), directly satisfying SC-002 (≤3 terminal commands total). The spec's FR-005 requirement for a single `helm install` command also directly supports this choice.

**Alternatives considered**: Umbrella chart with subcharts was considered and rejected as described above. Separate charts for backend and frontend were rejected because they would require two `helm install` commands, violating SC-002. Raw `kubectl apply -f` manifests without Helm were rejected because they lose parameterization, environment-specific overrides, and the atomic install/uninstall lifecycle that Helm provides.

---

## Backend Service Exposure: NodePort vs ClusterIP-Only

**Decision**: Backend exposed as both ClusterIP (internal DNS `todoai-backend-svc:8000`) AND NodePort (port 30800) for external browser access. Frontend exposed as NodePort (port 30300).

**Rationale**: Because `NEXT_PUBLIC_API_URL` is baked at build time and must be resolvable from both the browser and the SSR server, the backend must be accessible from outside the cluster. A ClusterIP-only backend would require a separate `kubectl port-forward` step running in a terminal, which violates the SC-002 "≤3 commands" requirement and introduces a fragile long-running process. NodePort 30800 is stable as long as Minikube is running and requires no additional process. The ClusterIP service name (`todoai-backend-svc`) is still used for pod-to-pod DNS resolution in any server-side fetch calls that reference it directly. Using a single Service resource of type NodePort provides both: ClusterIP DNS resolution within the cluster and host-level access via `$(minikube ip):30800`.

**Alternatives considered**: ClusterIP-only backend with `kubectl port-forward` was rejected as described. LoadBalancer type was rejected because Minikube's load balancer implementation (`minikube tunnel`) requires a separately running terminal process, similar to port-forward. Ingress controller was considered for a more production-like setup but rejected as it requires enabling the Minikube ingress addon and adds configuration complexity disproportionate to the local dev goal.

---

## Resource Sizing for 3 GB Minikube

**Decision**: Backend: requests 128Mi/0.25cpu, limits 256Mi/0.5cpu. Frontend: requests 192Mi/0.25cpu, limits 384Mi/0.5cpu. Total limits: 640Mi, well under the 2.5GB combined cap.

**Rationale**: Minikube is allocated 3072 MB (3GB). The Kubernetes control plane (API server, scheduler, controller-manager, etcd, CoreDNS, kube-proxy) consumes approximately 400–600MB under normal conditions, leaving ~2.4–2.6GB for workloads. The 2.5GB combined application cap from FR-017 is therefore a safe headroom target. FastAPI with uvicorn and the AI model client libraries (`openai-agents`, `mcp`) typically baseline at 60–100MB RSS and peak at 150–200MB under AI inference load. The 256Mi limit provides a 50% buffer over the observed 150–200MB peak. Next.js 16 production server (without the build stage in memory) typically baselines at 80–120MB RSS; 384Mi provides a ~3x headroom for concurrent SSR rendering of complex pages. Setting requests at 50% of limits allows Kubernetes to schedule both pods on the same node without requiring memory reservation equal to the full limit.

**Alternatives considered**: Equal requests and limits (guaranteed QoS class) was considered for predictability but rejected because it would require reserving the full 640MB regardless of actual usage, reducing available headroom for the control plane. Higher limits (512Mi backend, 512Mi frontend) were considered for extra safety but rejected as they risk Minikube OOM if the control plane spikes unexpectedly.

---

## Image Loading: minikube image load vs Registry

**Decision**: Use `eval $(minikube docker-env)` to point the local Docker daemon at Minikube's internal Docker daemon, then build images directly into Minikube's image store. No external registry is used.

**Rationale**: Building images directly into Minikube's Docker daemon (`eval $(minikube docker-env)` then `docker build`) eliminates the push/pull cycle entirely — the image is available immediately in Minikube's local store after the build completes. This is the fastest approach for local development and avoids the need for registry credentials, registry setup, or internet connectivity for image pulls. The Helm chart sets `imagePullPolicy: Never` to ensure Kubernetes never attempts to pull the image from a registry, which would fail since the image tag `todo-backend:local` does not exist in any public registry.

**Alternatives considered**: `minikube image load` (build locally, then transfer into Minikube) was considered but rejected because it requires two separate steps — a local build then a transfer — and the transfer of a 200–400MB image via `minikube image load` is significantly slower than building directly inside Minikube's daemon. A local registry (`docker run -d -p 5000:5000 registry:2`) was considered for a more production-like workflow but rejected as it adds a third external service that developers must manage and that must be healthy for deployments to succeed. Docker Hub or GitHub Container Registry was rejected as it requires internet access, authentication, and image publishing, all of which are disproportionate to a local dev workflow.
