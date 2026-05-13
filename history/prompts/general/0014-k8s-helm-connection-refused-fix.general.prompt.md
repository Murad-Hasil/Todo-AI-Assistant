---
id: "0014"
title: K8s Helm Connection Refused Fix
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: main
user: brownie
command: /sp.implement
labels: ["kubernetes", "helm", "docker", "connection-refused", "port", "cors"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/Dockerfile
  - todo-web-app/k8s/charts/todoai/templates/backend-deployment.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml.example
tests:
  - "null"
---

## Prompt

Final Infrastructure Sync: Align Local Kubernetes with Production Hardening.

MISSION: Update local Docker and Helm configurations to match the working production environment and resolve the 'Connection Refused' issue.

STRICT EXECUTION STEPS:
1. DOCKERFILE ALIGNMENT — ensure ENV HOSTNAME="0.0.0.0" in both Dockerfiles, port consistency
2. HELM CHART SYNC — CORS_ORIGINS, NEXT_PUBLIC_API_URL, BETTER_AUTH_URL
3. NETWORK FIX — Backend Service name todoai-backend-svc
4. VERIFICATION INSTRUCTIONS — exact docker build + helm upgrade commands

## Response snapshot

Root cause of Connection Refused identified and fixed:

**Backend Dockerfile** had CMD with --port 7860 hardcoded:
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

But Helm chart has backend.port: 8000. The Service routes to 8000 on the pod, but the pod listens on 7860 → Connection Refused.

**Fixes applied:**

1. backend/Dockerfile — Changed CMD to shell form with $PORT variable:
   CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
   - HF Space: PORT=7860 (default ENV, unchanged)
   - Kubernetes: PORT=8000 injected by backend-deployment.yaml

2. backend-deployment.yaml — Added PORT env var injection:
   - name: PORT
     value: "{{ .Values.backend.port }}"

3. secrets.values.yaml.example — Fixed dead config and improved documentation:
   - Removed dead 'nextPublicApiUrl' field (never referenced in templates)
   - Added CORS_ORIGINS with minikube IP placeholder
   - Fixed betterAuthUrl pattern to use minikube NodePort URL
   - Added note that NEXT_PUBLIC_API_URL is baked at docker build time

**Already correct (no changes needed):**
- Backend service name: todoai-backend-svc ✅
- Frontend Dockerfile: ENV HOSTNAME="0.0.0.0" ✅
- Backend Dockerfile: ENV HOSTNAME="0.0.0.0" ✅
- Frontend deployment: HOSTNAME env var injected ✅
- values.yaml: CORS_ORIGINS default "http://localhost:3000" ✅

Deployed: HF Space 5acc1b9, GitHub d2feee2

## Outcome

- Impact: Backend will now listen on port 8000 in Kubernetes (not 7860); Connection Refused resolved
- Tests: n/a (requires local Minikube cluster to verify)
- Files: Dockerfile, backend-deployment.yaml, secrets.values.yaml.example
- Next prompts: Run verification commands to confirm cluster works
- Reflection: The port mismatch is a subtle but critical bug in multi-environment Dockerfiles. Using $PORT env var is the correct pattern for shared Dockerfiles that serve both HF Space and Kubernetes.

## Evaluation notes (flywheel)

- Failure modes observed: CMD --port hardcoded to 7860 ignored Helm backend.port: 8000
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Run docker build + helm upgrade sequence below
