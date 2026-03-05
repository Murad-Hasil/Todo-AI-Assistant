# Feature Specification: Local Kubernetes Deployment

**Feature Branch**: `007-local-k8s-deploy`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "Phase 4: Local Kubernetes Deployment — containerize backend and frontend with Docker multi-stage builds, orchestrate with Helm charts, deploy to Minikube with ConfigMaps and Secrets, define health probes, resource limits, and AIOps kubectl-ai inspection strategy."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer Deploys the Full Stack Locally in One Command (Priority: P1)

A developer clones the repository, sets up Minikube on their local machine, and deploys the entire application — backend and frontend — using a single Helm command. Within minutes they can open a browser, log in, and interact with the full Todo AI application without manually starting any services.

**Why this priority**: This is the core deliverable of Phase 4. If a developer cannot reliably deploy the full stack to a local Kubernetes cluster in one command, no other scenario is reachable. Everything else depends on this working.

**Independent Test**: Run `helm install todoai ./charts/todoai --values secrets.values.yaml` on a clean Minikube cluster and verify the application loads in a browser via `minikube service` or `minikube tunnel` within 5 minutes.

**Acceptance Scenarios**:

1. **Given** a machine with Minikube and Helm installed and the repository checked out, **When** the developer runs a single `helm install` command referencing a secrets values file, **Then** all pods reach `Running` status and the frontend is reachable in a browser.
2. **Given** the deployed stack is running, **When** the developer opens the frontend URL, **Then** the login page loads correctly and the complete application is functional.
3. **Given** the deployed stack is running, **When** a user logs in and creates a task, **Then** the task is persisted in the remote database, confirming the backend pod is communicating with the external database.
4. **Given** the deployed stack is running, **When** the developer runs `helm uninstall todoai`, **Then** all pods, services, and cluster resources are cleanly removed with no orphaned objects.

---

### User Story 2 — Application Secrets Are Never Exposed in Version Control (Priority: P1)

A developer configuring the deployment never embeds sensitive credentials (database URL, auth secrets, API keys) in source-controlled files. All sensitive values are injected at deploy time through Kubernetes Secrets, keeping the repository safe to share publicly.

**Why this priority**: Security is non-negotiable. A deployment that hardcodes secrets into committed files is a disqualifying defect. This must be satisfied alongside User Story 1.

**Independent Test**: Search the repository with `git grep -rn "DATABASE_URL\|GROQ_API_KEY\|BETTER_AUTH_SECRET"` and verify no actual credential values appear. Deploy successfully by providing secrets via a `secrets.values.yaml` file listed in `.gitignore`.

**Acceptance Scenarios**:

1. **Given** the Helm chart repository, **When** a reviewer inspects all committed files, **Then** no secret values appear — only placeholder names or references.
2. **Given** a `secrets.values.yaml` file with real credentials kept outside version control, **When** the developer runs `helm install --values secrets.values.yaml`, **Then** the pods receive the correct environment variables and the application authenticates successfully.
3. **Given** the deployed stack, **When** a developer runs `kubectl describe pod`, **Then** environment variable names are visible but their values are sourced from Kubernetes Secrets and not logged in plain text.

---

### User Story 3 — The AI Chatbot Remains Fully Functional After Containerization (Priority: P2)

An authenticated user opens the chat drawer and sends a natural language task command. The AI assistant processes the request, calls the MCP tools, and returns a response — entirely within the containerized environment with no degradation from the local development experience.

**Why this priority**: The Phase 3 AI chatbot is a core differentiator. Verifying it survives containerization confirms the API key injection and outbound network connectivity from the backend pod are configured correctly.

**Independent Test**: Log in via the deployed frontend URL, open the chat drawer, type "Add a task: test containerized AI", and verify the AI responds with a confirmation and the task appears in the task list.

**Acceptance Scenarios**:

1. **Given** the deployed stack with a valid AI API key in the Kubernetes Secret, **When** a user sends a chat message, **Then** the backend pod forwards the request and returns a response within 10 seconds.
2. **Given** a chat response that includes a write action, **When** the AI confirms the action, **Then** the task list refreshes and shows the newly created task.
3. **Given** the backend pod is operating within defined memory limits, **When** a chat message is sent, **Then** the pod does not crash and the response is returned successfully.

---

### User Story 4 — Operations Engineer Inspects Cluster Health Using Natural Language (Priority: P3)

An engineer wants to understand the current state of the Kubernetes cluster without memorizing command syntax. Using the AI-powered cluster inspection tool, they ask plain-English questions about pod status, resource usage, and recent events.

**Why this priority**: AIOps integration is a Phase 4 value-add that demonstrates cluster observability. It does not affect application functionality and is therefore lower priority.

**Independent Test**: Run `kubectl-ai "Show me all pods and their status"` and verify a human-readable summary of all pods is returned within 5 seconds.

**Acceptance Scenarios**:

1. **Given** the AI cluster inspection tool is installed, **When** the engineer asks "Are all pods healthy?", **Then** a plain-language summary of pod readiness and any failing conditions is returned.
2. **Given** a pod in a failing state, **When** the engineer asks why it is failing, **Then** a summary of relevant logs and events is returned without requiring manual `kubectl` commands.
3. **Given** a normally running cluster, **When** the engineer asks for resource usage, **Then** approximate CPU and memory utilization per pod is reported.

---

### Edge Cases

- What happens when Minikube runs out of memory during deployment? Pods enter `Pending` state with a descriptive event; a minimum system requirement is documented to prevent this.
- What happens when the external database is unreachable from inside the cluster? The backend readiness probe fails, the pod stays `NotReady`, and the frontend shows a degraded error state rather than a crash.
- What happens when a required secret value is missing from the values file? The pod fails to start with a clear event indicating which environment variable is absent.
- What happens when the developer runs `helm install` a second time without uninstalling first? Helm returns an error indicating the release already exists; documentation guides the use of `helm upgrade`.
- What happens when the frontend pod cannot resolve the backend service name? The frontend renders a connection error state rather than a blank page; in-cluster DNS must be verified.
- What happens if the AI API provider rate-limits the backend pod? The chat endpoint returns a user-friendly error message and does not crash the pod.

---

## Requirements *(mandatory)*

### Functional Requirements

**Containerization**

- **FR-001**: The backend application MUST be packaged as a container image using a multi-stage build that produces a minimal production image containing only runtime dependencies.
- **FR-002**: The frontend application MUST be packaged as a container image using a multi-stage build with a dedicated compilation stage and a separate lightweight runner stage.
- **FR-003**: Both images MUST exclude development files, test artifacts, local configuration files, and version control metadata.
- **FR-004**: The backend container MUST start the application server using a production-grade process configuration capable of handling concurrent HTTP requests.

**Helm Orchestration**

- **FR-005**: The complete stack MUST be deployable via a single `helm install` command; no additional `kubectl apply` commands should be required.
- **FR-006**: The Helm chart MUST include Deployment, Service, ConfigMap, and Secret templates for both the backend and frontend tiers.
- **FR-007**: The frontend Service MUST be accessible from the developer's host machine via Minikube's service exposure mechanism.
- **FR-008**: The backend Service MUST be reachable from the frontend pod using Kubernetes in-cluster DNS (service name resolution), not a hardcoded IP address.
- **FR-009**: The Helm chart MUST provide a `values.yaml` with safe defaults and a `secrets.values.yaml.example` with placeholder secret keys.

**Configuration Management**

- **FR-010**: Non-sensitive configuration (e.g., backend service URL) MUST be stored in a Kubernetes ConfigMap and injected as environment variables.
- **FR-011**: Sensitive values — database connection string, authentication secret, AI API key — MUST be stored in Kubernetes Secrets and injected as environment variables.
- **FR-012**: No sensitive value MUST appear in any version-controlled file; the real secrets file MUST be excluded via `.gitignore`.

**Health Probes**

- **FR-013**: The backend Deployment MUST define a Readiness probe that gates traffic until the application is fully initialized.
- **FR-014**: The backend Deployment MUST define a Liveness probe that triggers an automatic pod restart if the application becomes unresponsive.
- **FR-015**: The frontend Deployment MUST define at minimum a Readiness probe to gate traffic until the server is ready to serve requests.

**Resource Constraints**

- **FR-016**: Every pod MUST have explicit CPU and memory resource requests and limits defined.
- **FR-017**: The combined memory limits across all application pods MUST not exceed 2.5 GB, preserving headroom for the Kubernetes control plane on a 3 GB Minikube allocation.

**AIOps**

- **FR-018**: The deployment documentation MUST include a dedicated section describing how to use natural language cluster inspection to query pod status, read logs, and diagnose common failures.

### Key Entities

- **Container Image (Backend)**: The packaged FastAPI application runtime; attributes — base OS layer, runtime version, installed dependencies, startup command, exposed port.
- **Container Image (Frontend)**: The packaged Next.js production build; attributes — compiled output, Node.js runtime, exposed port, environment variable injection strategy (build-time vs. runtime).
- **Helm Chart**: A versioned, parameterized Kubernetes deployment package; attributes — chart name, version, `values.yaml` defaults, override values, rendered manifests.
- **ConfigMap**: A Kubernetes resource for non-sensitive key-value pairs; attributes — name, namespace, configuration keys.
- **Kubernetes Secret**: A Kubernetes resource for sensitive credentials; attributes — name, namespace, keys (DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY).
- **Deployment**: The desired-state descriptor for a running pod; attributes — replica count, container spec, resource limits/requests, health probe definitions, environment variable sources.
- **Service**: The stable network endpoint for pods; attributes — type (ClusterIP for backend, NodePort/LoadBalancer for frontend), selector labels, port mapping.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with Minikube and Helm installed can deploy the full stack and open the application in a browser in under 10 minutes by following the documented steps.
- **SC-002**: The entire deployment is accomplished with no more than 3 terminal commands after prerequisites are installed.
- **SC-003**: All pods reach `Running` status within 3 minutes of the `helm install` command completing on a machine meeting the minimum requirements.
- **SC-004**: A repository search confirms zero secret values appear in any committed file.
- **SC-005**: The AI chatbot responds to a natural language task command within 10 seconds under normal cluster load.
- **SC-006**: The full stack operates within a combined memory footprint of 2.5 GB, keeping the local machine responsive during development.
- **SC-007**: All Phase 3 end-to-end flows — registration, login, task CRUD, AI chat — pass without regression in the containerized environment.
- **SC-008**: `helm uninstall todoai` cleanly removes all cluster resources with no orphaned Kubernetes objects.

---

## Assumptions

- Minikube and Helm 3 are pre-installed on the developer's machine; their installation is out of scope.
- Neon PostgreSQL remains a managed external service; no in-cluster database is introduced in this phase.
- The Groq (or equivalent AI) API is reachable from within the Minikube network via outbound internet.
- A Docker-compatible container runtime is available locally for building images.
- For local development, images are built directly into Minikube's Docker daemon to avoid requiring a remote image registry.
- Minimum local machine specification: 4 CPU cores, 4 GB RAM, 20 GB free disk (Minikube default allocation: 2 CPUs, 3 GB RAM for the cluster).
- `kubectl-ai` refers to a natural-language Kubernetes inspection tool; its installation is documented but not automated by the chart.
- The frontend communicates with the backend exclusively via the Kubernetes Service DNS name inside the cluster; external URLs are not used for service-to-service communication.
