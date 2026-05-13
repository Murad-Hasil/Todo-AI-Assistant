# Quickstart: Local Kubernetes Deployment (Phase 4)

**Feature**: `007-local-k8s-deploy` | **Date**: 2026-03-05
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Prerequisites

Ensure the following tools are installed and available on your PATH before proceeding. Installation of these tools is out of scope for this guide.

| Tool | Minimum Version | Verify |
|------|----------------|--------|
| Minikube | 1.32 | `minikube version` |
| Helm | 3.14 | `helm version` |
| Docker | 24.x | `docker --version` |
| kubectl | 1.29 | `kubectl version --client` |
| kubectl-ai | any | `kubectl-ai --version` (optional, for AIOps) |

**Minimum host machine spec**: 4 CPU cores, 8 GB RAM, 20 GB free disk.

---

## Step 1 — Start Minikube

Start a Minikube cluster with sufficient resources for the TodoAI stack plus control plane overhead:

```bash
minikube start --memory=3072 --cpus=2 --driver=docker
```

Verify the cluster is ready:

```bash
kubectl get nodes
# Expected output: NAME       STATUS   ROLES           AGE   VERSION
#                  minikube   Ready    control-plane   1m    v1.29.x
```

Capture the Minikube IP address — you will need it in Steps 2 and 3:

```bash
export MINIKUBE_IP=$(minikube ip)
echo "Minikube IP: $MINIKUBE_IP"
```

**WSL2 Note**: If `minikube ip` returns an address that is not reachable from your browser (e.g., `192.168.49.2` on a WSL2 host with Docker driver), run `minikube tunnel` in a separate terminal and use `127.0.0.1` as the IP for all URLs below. Keep that terminal open for the duration of the session.

---

## Step 2 — Create the Secrets File

The Helm chart requires a `secrets.values.yaml` file with real credential values. This file is excluded from version control via `.gitignore`.

Copy the example file:

```bash
cp ./todo-web-app/k8s/charts/todoai/secrets.values.yaml.example \
   ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

Open `secrets.values.yaml` in your editor and fill in the real values:

```yaml
backend:
  secret:
    DATABASE_URL: "postgresql://user:password@host.neon.tech/dbname?sslmode=require"
    BETTER_AUTH_SECRET: "your-32-char-minimum-random-secret"
    GROQ_API_KEY: "gsk_your_actual_groq_api_key"
    CORS_ORIGINS: "http://192.168.49.2:30300"   # Replace 192.168.49.2 with your MINIKUBE_IP
```

**CORS_ORIGINS must match exactly**: Use `echo $MINIKUBE_IP` to get the correct value and substitute it into `CORS_ORIGINS`. The frontend's browser URL will be `http://$MINIKUBE_IP:30300`.

Verify the file is excluded from git:

```bash
git status ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
# Expected: nothing (the file is gitignored and should not appear in status)
```

---

## Step 3 — Build Images into Minikube (Command 1 of 3)

Point your shell's Docker client at Minikube's internal Docker daemon, then build both images:

```bash
eval $(minikube docker-env)
```

Build the backend image:

```bash
docker build \
  -t todo-backend:local \
  ./todo-web-app/backend/
```

Build the frontend image with the backend URL baked in at compile time:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://${MINIKUBE_IP}:30800 \
  -t todo-frontend:local \
  ./todo-web-app/frontend/
```

Verify both images are visible in Minikube's image store:

```bash
minikube image ls | grep todo
# Expected:
# docker.io/library/todo-backend:local
# docker.io/library/todo-frontend:local
```

**Important**: Both build commands must run in the same terminal session where `eval $(minikube docker-env)` was executed. Opening a new terminal will reset the Docker environment to your host daemon.

---

## Step 4 — Deploy with Helm (Command 2 of 3)

Deploy the full stack using Helm:

```bash
helm upgrade --install todoai \
  ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

Expected output:

```
Release "todoai" does not exist. Installing it now.
NAME: todoai
LAST DEPLOYED: [timestamp]
NAMESPACE: default
STATUS: deployed
REVISION: 1
```

---

## Step 5 — Verify the Deployment

Wait for pods to reach Running status (allow up to 3 minutes):

```bash
kubectl get pods --watch
```

Expected terminal state:

```
NAME                               READY   STATUS    RESTARTS   AGE
todoai-backend-xxxxxxxxx-xxxxx     1/1     Running   0          90s
todoai-frontend-xxxxxxxxx-xxxxx    1/1     Running   0          90s
```

Press `Ctrl+C` to stop watching once both pods show `1/1 Running`.

Verify services are correctly assigned NodePorts:

```bash
kubectl get services
# Expected:
# NAME                TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# todoai-backend-svc  NodePort   10.x.x.x        <none>        8000:30800/TCP   2m
# todoai-frontend     NodePort   10.x.x.x        <none>        3000:30300/TCP   2m
```

Verify the backend health endpoint responds:

```bash
curl http://${MINIKUBE_IP}:30800/health
# Expected: {"status":"ok"}
```

Confirm in-cluster DNS resolution (backend reachable from frontend pod):

```bash
FRONTEND_POD=$(kubectl get pod -l app.kubernetes.io/name=todoai-frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec $FRONTEND_POD -- wget -qO- http://todoai-backend-svc:8000/health
# Expected: {"status":"ok"}
```

---

## Step 6 — Open the Application (Command 3 of 3)

```bash
minikube service todoai-frontend
```

This command opens the application in your default browser. The URL will be `http://$MINIKUBE_IP:30300`.

If the browser does not open automatically, use the URL printed by the command:

```
|-----------|----------------|-------------|--------------------------|
| NAMESPACE |      NAME      | TARGET PORT |            URL           |
|-----------|----------------|-------------|--------------------------|
| default   | todoai-frontend|        3000 | http://192.168.49.2:30300|
|-----------|----------------|-------------|--------------------------|
```

**Smoke test checklist**:
- [ ] Login page renders correctly
- [ ] Register a new account or log in with existing credentials
- [ ] Create a task — confirm it persists after page refresh
- [ ] Open the AI chat drawer — send the message "Add a task: containerization verified"
- [ ] AI responds with confirmation and the task appears in the list

---

## Step 7 — AIOps Cluster Inspection (Optional)

Use `kubectl-ai` to inspect the cluster in natural language.

**Configure kubectl-ai** with your Groq API key (or another OpenAI-compatible key):

```bash
export OPENAI_API_KEY="gsk_your_groq_api_key"
# If using Groq endpoint:
export OPENAI_BASE_URL="https://api.groq.com/openai/v1"
```

**Standard health check**:

```bash
kubectl-ai "Are all pods healthy?"
```

**Diagnose a failing pod** (replace with actual pod name if needed):

```bash
kubectl-ai "Why is the todoai-backend pod not ready?"
```

**Inspect logs**:

```bash
kubectl-ai "Show the last 30 log lines for the todoai-backend pod"
```

**Resource utilization**:

```bash
kubectl-ai "What is the CPU and memory usage of each pod?"
```

**Network topology**:

```bash
kubectl-ai "List all services in the default namespace and their port mappings"
```

**Recent events**:

```bash
kubectl-ai "Show all cluster events from the last 10 minutes"
```

---

## Helm Management Commands

**Upgrade after code changes** (rebuild images first, then):

```bash
helm upgrade todoai \
  ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

**Check release status**:

```bash
helm status todoai
```

**Inspect rendered templates** (dry run, no cluster changes):

```bash
helm template todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

**Lint the chart** (validate YAML and Helm syntax):

```bash
helm lint ./todo-web-app/k8s/charts/todoai
```

---

## Teardown

Remove all deployed resources from the cluster:

```bash
helm uninstall todoai
```

Expected output:

```
release "todoai" uninstalled
```

Verify all resources are removed:

```bash
kubectl get all
# Expected: only Kubernetes system resources remain (no todoai-* objects)
```

Stop Minikube (preserves cluster state for next session):

```bash
minikube stop
```

Delete the Minikube cluster entirely (full teardown):

```bash
minikube delete
```

---

## Troubleshooting Reference

| Symptom | Likely Cause | Remediation |
|---------|-------------|-------------|
| Pod stuck in `Pending` | Minikube OOM or CPU exhausted | Run `kubectl describe pod <name>` to see events; restart Minikube with more memory |
| Pod in `CrashLoopBackOff` | Application startup error or missing secret | Run `kubectl logs <pod-name> --previous` to see crash output |
| Backend pod `NotReady` | Database unreachable (Neon down or wrong DATABASE_URL) | Verify DATABASE_URL in secrets file; check Neon dashboard |
| Frontend pod `NotReady` | Node.js startup taking longer than 20s | Wait 1–2 more minutes; check logs with `kubectl logs <frontend-pod>` |
| CORS error in browser | `CORS_ORIGINS` in secrets.values.yaml doesn't match browser URL | Update CORS_ORIGINS to include `http://$MINIKUBE_IP:30300` and `helm upgrade` |
| `ImagePullBackOff` | `eval $(minikube docker-env)` was not run before `docker build` | Rebuild images with the correct Docker environment set |
| `helm install` fails with "already exists" | Previous release not uninstalled | Run `helm upgrade --install` (idempotent) instead of `helm install` |
| Browser cannot reach `$MINIKUBE_IP:30300` on WSL2 | Docker driver on WSL2 doesn't expose NodePorts to Windows host | Use `minikube service todoai-frontend --url` or run `minikube tunnel` |
| `next.config.mjs` standalone error | `output: 'standalone'` missing from Next.js config | Add `output: 'standalone'` to `next.config.mjs` and rebuild the frontend image |
| AI chat returns no response | `GROQ_API_KEY` incorrect or Groq API unreachable | Verify key in secrets file; test with `curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"` |

---

## Resource Footprint Summary

| Pod | Memory Request | Memory Limit | CPU Request | CPU Limit |
|-----|---------------|-------------|------------|----------|
| todoai-backend | 128Mi | 256Mi | 250m | 500m |
| todoai-frontend | 192Mi | 384Mi | 250m | 500m |
| **Combined** | **320Mi** | **640Mi** | **500m** | **1000m** |

Control plane headroom: ~2.4GB of the 3GB Minikube allocation remains after application limits.
