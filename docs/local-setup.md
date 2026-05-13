# TodoAI — Local Kubernetes Setup Guide

**[Task]: T-5.4.4 — Local K8s Quick Start for evaluators and developers**

This guide covers running the full TodoAI stack locally using Minikube, Dapr, Helm, and Redpanda Cloud.

---

## Prerequisites

Install the following tools before proceeding:

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |
| Minikube | 1.32+ | `brew install minikube` / [docs](https://minikube.sigs.k8s.io/docs/) |
| kubectl | 1.28+ | `brew install kubectl` |
| Helm | 3.x | `brew install helm` |
| Dapr CLI | 1.13+ | `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh \| /bin/bash` |

> **WSL2 note**: All commands work on Ubuntu 22.04 under WSL2. `minikube service` URLs may require `kubectl port-forward` instead of direct NodePort access.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Murad-Hasil/Todo-AI-Assistant
cd Todo-AI-Assistant

# Initialize the backend git submodule (HF Space repo)
git submodule update --init --recursive
```

---

## Step 2 — Prepare Secrets

```bash
# Copy the example secrets file
cp todo-web-app/k8s/charts/todoai/secrets.values.yaml.example \
   todo-web-app/k8s/charts/todoai/secrets.values.yaml
```

Now edit `secrets.values.yaml` with your real values:

```yaml
# todo-web-app/k8s/charts/todoai/secrets.values.yaml
backend:
  secret:
    DATABASE_URL: "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
    BETTER_AUTH_SECRET: "your-32-char-secret"
    GROQ_API_KEY: "gsk_your-groq-key"
    CORS_ORIGINS: "http://localhost:3000"
    REDPANDA_BOOTSTRAP_SERVER: "your-broker.redpanda.cloud:9092"
    REDPANDA_USERNAME: "your-sasl-username"
    REDPANDA_PASSWORD: "your-sasl-password"
```

> This file is in `.gitignore` — it will never be committed.

---

## Step 3 — Start Minikube

```bash
minikube start --memory=4096 --cpus=2
```

Verify the cluster is running:

```bash
kubectl cluster-info
# Expected: Kubernetes control plane is running at https://...
```

---

## Step 4 — Install Dapr on the Cluster

```bash
# Initialize Dapr control plane (takes ~2 minutes)
dapr init --kubernetes --wait

# Verify Dapr pods are running
kubectl get pods -n dapr-system
# Expected: dapr-dashboard, dapr-operator, dapr-placement-server, dapr-sentry, dapr-sidecar-injector — all Running
```

---

## Step 5 — Build Docker Images into Minikube

All images must be built inside Minikube's Docker daemon (not the host machine's):

```bash
# Point Docker CLI at Minikube's daemon
eval $(minikube docker-env)

# Build all three service images
docker build -t todo-backend:local ./todo-web-app/backend/
docker build -t todo-frontend:local ./todo-web-app/frontend/
docker build -t todo-notification:local ./todo-web-app/services/notification/

# Verify images are available in Minikube
docker images | grep todo-
```

> **Important**: `imagePullPolicy: Never` is set in the Helm chart — Kubernetes will only use locally-built images.

---

## Step 6 — Deploy with Helm

```bash
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml \
  --wait --timeout 120s

# Verify the Helm release
helm status todoai
```

---

## Step 7 — Apply Dapr Manifests

```bash
# Pub/Sub component (Redpanda/Kafka connection)
kubectl apply -f todo-web-app/k8s/dapr/pubsub.yaml

# Subscription manifests (which services consume which topics)
kubectl apply -f todo-web-app/k8s/dapr/subscription-reminders.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-updates-sub.yaml

# Verify Dapr subscriptions are applied
kubectl get subscriptions.dapr.io
```

---

## Step 8 — Verify All Pods Running

```bash
kubectl get pods
```

Expected output:

```
NAME                                    READY   STATUS    RESTARTS
todoai-backend-xxx                      2/2     Running   0
todoai-frontend-xxx                     2/2     Running   0
todoai-notification-xxx                 2/2     Running   0
```

> `2/2` means both the application container and the Dapr sidecar are running.
> The notification pod may show `1/2` if the Dapr scheduler sidecar is non-critical — this is acceptable.

---

## Step 9 — Access the Application

Open two terminal windows and run:

```bash
# Terminal 1 — Frontend
kubectl port-forward svc/todoai-frontend 3000:3000

# Terminal 2 — Backend API
kubectl port-forward svc/todoai-backend-svc 8000:8000
```

Open your browser at: **http://localhost:3000**

---

## Step 10 — Verify Event-Driven Pipeline

To confirm the Phase 5 notification pipeline is working:

```bash
# Create a task with "remind me" in the title via the frontend, then:
kubectl logs -l app.kubernetes.io/name=todoai-notification -c notification --tail=10
```

Expected log output:
```
[REMINDER]: Hey User <user_id>, your task "remind me to ..." is due now!
```

### Manual Smoke Test (without Kafka topic)

If the `reminders` Kafka topic hasn't been created in Redpanda Cloud yet, use this direct test:

```bash
# Get the backend pod name
BACKEND_POD=$(kubectl get pods -l app.kubernetes.io/name=todoai-backend \
  -o jsonpath='{.items[0].metadata.name}')

# Publish a test reminder event via Dapr HTTP API
kubectl exec "$BACKEND_POD" -c backend -- python3 -c "
import urllib.request, json
payload = json.dumps({
    'action': 'reminder',
    'task_id': 'smoke-test-001',
    'task_title': 'remind me to buy groceries',
    'user_id': 'test-user',
    'timestamp': '2026-03-10T12:00:00+00:00'
}).encode()
req = urllib.request.Request(
    'http://localhost:3500/v1.0/publish/todoai-pubsub/reminders',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print('Published:', urllib.request.urlopen(req, timeout=10).status)
"
```

Then check notification logs again.

---

## Useful Commands

```bash
# Check all pod statuses
kubectl get pods -o wide

# Follow backend logs
kubectl logs -f -l app.kubernetes.io/name=todoai-backend -c backend

# Follow notification service logs
kubectl logs -f -l app.kubernetes.io/name=todoai-notification -c notification

# Check Dapr sidecar logs for a pod
kubectl logs <pod-name> -c daprd

# Check Dapr pubsub component status
kubectl describe component todoai-pubsub

# Restart a deployment (e.g., after config change)
kubectl rollout restart deployment/todoai-backend

# Full reset (removes all resources, keeps Minikube running)
helm uninstall todoai
kubectl delete -f todo-web-app/k8s/dapr/
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Pod stuck in `Init:0/1` | Dapr not installed | Run `dapr init --kubernetes --wait` |
| Pod `CrashLoopBackOff` | Missing secret or wrong value in `secrets.values.yaml` | Check `kubectl logs <pod> -c backend` |
| `ImagePullBackOff` | Image not built into Minikube | Run `eval $(minikube docker-env)` then rebuild |
| Port-forward fails | Port already in use | `lsof -i :3000` then kill the process |
| Notification logs empty | `reminders` Kafka topic missing in Redpanda | Create topic manually in Redpanda Cloud UI (name: `reminders`, 1 partition) OR use manual smoke test above |

---

## Architecture Reference

```
Browser → http://localhost:3000 (Frontend pod)
               │ REST API + JWT
               ▼
         http://localhost:8000 (Backend pod + Dapr sidecar)
               │ Dapr HTTP: localhost:3500
               ▼
         Redpanda Cloud (Kafka)
               │ topic: reminders
               ▼
         Notification Service pod → [REMINDER] log
```

---

*Last verified: 2026-03-10 | Cluster: Minikube v1.32 | Dapr: 1.17.1 | Helm revision: 4*
