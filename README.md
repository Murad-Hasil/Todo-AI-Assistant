# TodoAI — AI-Powered Task Manager

A full-stack, event-driven todo application with an AI chatbot assistant, built across 5 progressive phases as part of the Panaversity Hackathon II.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://frontend-murad-hasils-projects.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-HuggingFace-yellow?logo=huggingface)](https://mb-murad-todo-ai-assistant.hf.space)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Murad-Hasil/Todo-AI-Assistant)

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)
![Dapr](https://img.shields.io/badge/Dapr-1.17-purple?logo=dapr&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5?logo=kubernetes&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-Redpanda-orange?logo=apachekafka&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql&logoColor=white)

---

## Live Demo

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | https://frontend-murad-hasils-projects.vercel.app | Always-on (Vercel) |
| **Backend API** | https://mb-murad-todo-ai-assistant.hf.space | ~30s cold-start on first request |
| **API Health** | https://mb-murad-todo-ai-assistant.hf.space/api/health | Returns `{"status":"ok"}` |

> **HF Space cold-start**: The backend runs on HuggingFace Spaces free tier. If it has been idle, the first request may take ~30 seconds. Subsequent requests are instant.

---

## What It Does

TodoAI is a production-grade task manager where users can:
- **Create, complete, and delete tasks** via a modern dark-themed dashboard
- **Talk to an AI assistant** that manages tasks through natural language ("add a task: buy groceries", "mark buy groceries complete")
- **Receive reminders** — tasks with "remind me" in the title trigger an event-driven notification pipeline via Kafka

---

## 5-Phase Evolution

| Phase | Name | What Was Built | Key Technologies |
|-------|------|---------------|-----------------|
| **1** | Python CLI | In-memory todo CLI app | Python 3.13, dataclasses |
| **2** | Full-Stack Web App | REST API + Next.js frontend + PostgreSQL + Auth | FastAPI, SQLModel, Neon PostgreSQL, Next.js 14, Better Auth |
| **3** | AI Chatbot | Conversational AI that manages tasks via MCP tools | OpenAI Agents SDK, Groq llama-3.3-70b, FastMCP |
| **4** | Kubernetes Deploy | Containerized microservices on local Kubernetes | Docker, Helm, Minikube, kubectl |
| **5** | Event-Driven Architecture | Kafka pub/sub pipeline with microservice notifications | Dapr, Redpanda Cloud (Kafka), 3-pod cluster |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                              │
│                                                             │
│  [Browser] → [Vercel Frontend] → [HF Space Backend]        │
│                  Next.js 14           FastAPI 0.115+        │
│                  Better Auth          SQLModel              │
│                  Tailwind CSS         Neon PostgreSQL       │
│                                       Groq AI (MCP tools)  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  LOCAL KUBERNETES (Phase 4+5)               │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Frontend   │  │   Backend   │  │  Notification    │   │
│  │  Pod 2/2   │  │   Pod 2/2   │  │   Service 2/2    │   │
│  │ (app+dapr) │  │ (app+dapr)  │  │  (app+daprd)     │   │
│  └─────────────┘  └──────┬──────┘  └────────┬─────────┘   │
│                           │  Dapr PubSub     │             │
│                           ▼  (Kafka/Redpanda)│             │
│                  ┌────────────────┐          │             │
│                  │ Redpanda Cloud │──────────┘             │
│                  │  (3 topics)    │  reminders topic       │
│                  └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Event Flow (Phase 5):**
1. User creates task with "remind me" in the title
2. Backend fires `publish_reminder_event()` as a background task
3. Dapr sidecar publishes to `reminders` Kafka topic (Redpanda Cloud)
4. Notification service consumes the event → logs `[REMINDER]: Hey User <id>, your task "<title>" is due now!`

---

## Tech Stack

### Backend (`todo-web-app/backend/` — HF Space submodule)
- **Python 3.13** + **FastAPI 0.115+** + **uvicorn**
- **SQLModel 0.0.21+** — ORM over Neon PostgreSQL
- **Alembic** — database migrations
- **PyJWT** — HS256 JWT verification
- **OpenAI Agents SDK** — agent loop with tool calls
- **Groq** — `llama-3.3-70b-versatile` LLM inference
- **FastMCP** — 5 MCP tools: add / list / complete / delete / update task
- **httpx** — async Dapr sidecar calls (fire-and-forget pubsub)
- **slowapi** — rate limiting (chat: 10/min, tasks: 30/min)

### Frontend (`todo-web-app/frontend/`)
- **Next.js 16.1.6** (App Router, TypeScript strict)
- **Better Auth ^1.x** — sign-up / sign-in / session management
- **Tailwind CSS ^3.x** — dark glass aesthetic
- **Framer Motion** — animated task cards and chat drawer

### Notification Service (`todo-web-app/services/notification/`)
- **Python 3.13** + **FastAPI 0.115+** (stateless, no DB)
- Listens on `POST /on-reminder` — Dapr-invoked endpoint
- Logs `[REMINDER]` messages; placeholder for email/push integration

### Infrastructure
- **Docker** — multi-stage builds (`python:3.13-slim`, `node:20-alpine`)
- **Helm 3** — single chart `charts/todoai` managing all 3 deployments
- **Minikube** — local Kubernetes cluster
- **Dapr 1.17.1** — sidecar-injected into all pods; pubsub via `pubsub.kafka/v1`
- **Redpanda Cloud** — managed Kafka (3 topics: `task-events`, `task-updates`, `reminders`)
- **Neon PostgreSQL** — serverless PostgreSQL (external managed)

---

## Repository Structure

```
hackathon-II/
├── todo-web-app/
│   ├── backend/              # Git submodule → HuggingFace Space repo
│   │   └── app/
│   │       ├── main.py       # FastAPI entry point
│   │       ├── agent/        # OpenAI Agents SDK + Groq
│   │       ├── mcp/          # FastMCP server (5 tools)
│   │       └── routes/       # tasks, chat, auth endpoints
│   ├── frontend/             # Next.js 14 App Router
│   │   └── src/
│   │       ├── app/          # Pages: landing, login, dashboard
│   │       └── components/   # TaskCardGrid, ChatDrawer, Sidebar
│   ├── services/
│   │   └── notification/     # Phase 5.3 — Dapr subscriber
│   └── k8s/
│       ├── charts/todoai/    # Helm chart (3 deployments + services)
│       └── dapr/             # Dapr component + subscription YAMLs
├── specs/                    # Feature specs (SDD methodology)
├── history/                  # Prompt History Records (PHRs)
├── docs/
│   ├── demo-script.md        # 90-second demo recording guide
│   └── local-setup.md        # Full Minikube + Dapr + Helm setup guide
└── .specify/                 # SpecKit Plus templates
```

---

## Local Kubernetes Setup

### Prerequisites
- Minikube, kubectl, Helm 3, Dapr CLI 1.17+, Docker

### First-Time Setup

```bash
# 1. Clone with submodule
git clone https://github.com/Murad-Hasil/Todo-AI-Assistant
cd Todo-AI-Assistant
git submodule update --init --recursive

# 2. Copy and fill secrets
cp todo-web-app/k8s/charts/todoai/secrets.values.yaml.example \
   todo-web-app/k8s/charts/todoai/secrets.values.yaml
# Edit secrets.values.yaml with real values

# 3. Start Minikube + install Dapr
minikube start
dapr init --kubernetes --wait

# 4. Build Docker images into Minikube
eval $(minikube docker-env)
docker build -t todo-backend:local ./todo-web-app/backend/
docker build -t todo-frontend:local ./todo-web-app/frontend/
docker build -t todo-notification:local ./todo-web-app/services/notification/

# 5. Deploy via Helm
helm upgrade --install todoai ./todo-web-app/k8s/charts/todoai \
  --values ./todo-web-app/k8s/charts/todoai/secrets.values.yaml

# 6. Apply Dapr manifests
kubectl apply -f todo-web-app/k8s/dapr/pubsub.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscription-reminders.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-events-sub.yaml
kubectl apply -f todo-web-app/k8s/dapr/subscriptions/task-updates-sub.yaml

# 7. Access in browser (run in two terminals)
kubectl port-forward svc/todoai-frontend 3000:3000
kubectl port-forward svc/todoai-backend-svc 8000:8000
# Open http://localhost:3000
```

### Required Secrets (`secrets.values.yaml`)

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Shared HS256 secret (same as frontend) |
| `GROQ_API_KEY` | Groq API key |
| `CORS_ORIGINS` | Allowed origins (e.g. `http://localhost:3000`) |
| `REDPANDA_BOOTSTRAP_SERVER` | Redpanda Cloud broker host:port |
| `REDPANDA_USERNAME` | Redpanda SASL username |
| `REDPANDA_PASSWORD` | Redpanda SASL password |

---

## Key Design Decisions

- **Backend as Git Submodule** — HuggingFace Spaces requires a standalone repo; the backend lives at `todo-web-app/backend/` pointing to the HF Space repo
- **Dapr Sidecar Pattern** — all inter-service messaging goes through Dapr sidecars; app code uses plain HTTP to `localhost:3500`
- **MCP over HTTP** — the AI agent communicates with the database via a local MCP server (FastMCP), keeping agent logic decoupled from SQL
- **Fire-and-Forget Events** — reminder events are published as `BackgroundTask`; failure to publish never blocks the task creation response
- **Better Auth + JWT** — Better Auth manages sessions (frontend); backend verifies HS256 JWTs issued by the `/api/token` route (not EdDSA tokens from Better Auth directly)

---

## Development Methodology

This project follows **Spec-Driven Development (SDD)** using SpecKit Plus:
- Each feature starts with a `spec.md` → `plan.md` → `tasks.md` pipeline
- Every user interaction is recorded as a **Prompt History Record (PHR)** in `history/prompts/`
- Architecturally significant decisions are tracked as **ADRs** in `history/adr/`

---

## Authors

Built by **Murad Hasil** for Panaversity Hackathon II — 2026
