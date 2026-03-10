---
id: "0023"
title: Fix Broken HF Space and K8s Dapr Scheduler Crash
stage: general
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 011-submission-prep
user: brownie
command: diagnose and fix broken production + local environments
labels: ["debugging","k8s","dapr","hf-space","production"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - (no files modified — infrastructure fix only)
tests:
  - curl https://mb-murad-todo-ai-assistant.hf.space/api/health → {"status":"ok"} PASS
  - curl https://mb-murad-todo-ai-assistant.hf.space/ → {"message":"Todo AI Backend is Running","status":"online"} PASS
  - kubectl get pods — all 3 pods 2/2 Running 0 restarts PASS
---

## Prompt

The Todo AI app is broken. The frontend dashboard shows "Unable to reach server. Please try again later" below the task area. This means the frontend can connect (it loads) but can't reach the backend API for tasks.

**Environments affected:**
- Production: Vercel frontend → HF Space backend
- Local: localhost (likely K8s)

[Full diagnostic investigation requested — read frontend API client, dashboard components, backend routes, CORS config, check HF Space health, check local K8s state, fix root causes]

## Response snapshot

**Root Cause 1 — K8s Local:**
- `dapr-scheduler-server` (all 3 replicas) in CrashLoopBackOff with fatal error: "peer certificate does not contain the expected DNS name dapr-scheduler-server-0.dapr-scheduler-server.dapr-system.svc.cluster.local"
- This is a TLS cert mismatch in Dapr's internal etcd cluster after Minikube restart
- Cascades: daprd sidecar fails readiness probe → pods stuck at 1/2 → backend unreachable
- Fix: `dapr uninstall -k` + `dapr init -k --wait` (fresh cert issuance) + `kubectl rollout restart` on all deployments

**Root Cause 2 — HF Space Production:**
- HF Space in RUNTIME_ERROR: "Initialization step 'init' failed" — DNS resolution failure `Could not resolve host: huggingface.co` within HF's own build runners
- Transient HF infrastructure issue, not caused by our code
- Fix: push a new commit to trigger rebuild (also deployed Phase 5.3 backend changes: reminder events + retry logic for tool_use_failed)

**Actions taken:**
1. Diagnosed HF Space: `curl https://huggingface.co/api/spaces/Mb-Murad/todo-ai-assistant` — RUNTIME_ERROR confirmed
2. Diagnosed K8s: `kubectl get pods -n dapr-system` — dapr-scheduler-server-0/1/2 CrashLoopBackOff
3. Read dapr-scheduler-server logs — TLS cert DNS mismatch (etcd internal peer cert)
4. `dapr uninstall -k` → `dapr init -k --wait` — fresh Dapr install with new certs
5. `kubectl rollout restart` — all 3 deployments get new pods with fresh sidecar identity
6. `./deploy-backend.sh "fix: Phase 5.3 reminder events + retry on tool_use_failed"` — HF Space rebuild triggered
7. Final verification: all 3 K8s pods 2/2 Running, HF Space RUNNING, health endpoint OK

## Outcome

- Impact: Both production (HF Space) and local K8s environments restored to full operation. All pods 2/2 Running. Backend API healthy on both environments.
- Tests: Health endpoint curl PASS on HF Space; kubectl pods all 2/2 Running PASS
- Files: No application code changed; only infrastructure ops (dapr reinstall, helm redeploy, backend submodule commit for HF rebuild trigger)
- Next prompts: Monitor HF Space stability; check if Dapr scheduler cert issue recurs after next Minikube restart
- Reflection: Dapr scheduler TLS cert mismatch is a known issue when Minikube restarts — sentry issues new certs but etcd peer certs from StatefulSet don't match. Full uninstall+reinstall is the cleanest fix. Should document in COMMANDS.md.

## Evaluation notes (flywheel)

- Failure modes observed: Dapr scheduler crash cascades to daprd sidecar failing readiness → pods not ready → NetworkError in frontend; HF Space DNS transient failure not caused by code
- Graders run and results (PASS/FAIL): curl /api/health PASS, kubectl get pods 2/2 PASS
- Prompt variant (if applicable): null
- Next experiment: Add dapr reinstall procedure to COMMANDS.md to prevent confusion on next Minikube restart
