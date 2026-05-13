---
id: "0008"
title: fix-frontend-better-auth-env-vars
stage: green
date: 2026-03-05
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: brownie
command: /sp.implement
labels: ["helm","kubernetes","better-auth","frontend","env-vars","fix"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/k8s/charts/todoai/templates/frontend-deployment.yaml
  - todo-web-app/k8s/charts/todoai/values.yaml
  - todo-web-app/k8s/charts/todoai/secrets.values.yaml.example
tests:
  - null
---

## Prompt

The Frontend Kubernetes pod is failing with "BetterAuthError".

Please fix the Helm chart:
1. Update `templates/frontend-deployment.yaml` to include the following environment variables in the container spec:
   - `BETTER_AUTH_SECRET`: Pull this from the existing `todo-secrets` K8s secret.
   - `BETTER_AUTH_URL`: Pull this from the `Values.BETTER_AUTH_URL` (ensure it's added to `values.yaml` as well).
   - `DATABASE_URL`: Ensure the frontend also has access to this if required by Better Auth.
2. Update `values.yaml` to include a placeholder for `BETTER_AUTH_URL`.
3. Verify that the `todo-secrets` manifest correctly includes all these keys.

## Response snapshot

Updated three Helm chart files:

1. **`templates/frontend-deployment.yaml`**: Added three env vars after `NODE_ENV`:
   - `BETTER_AUTH_SECRET` — `secretKeyRef` from `todoai-backend-secret`
   - `BETTER_AUTH_URL` — plain value from `{{ .Values.frontend.betterAuthUrl }}`
   - `DATABASE_URL` — `secretKeyRef` from `todoai-backend-secret`

2. **`values.yaml`**: Added `frontend.betterAuthUrl: ""` with comment explaining it must be set to `http://$(minikube ip):30300`.

3. **`secrets.values.yaml.example`**: Added `frontend.betterAuthUrl` section so operators know to set it when copying the example file.

The existing `templates/backend-secret.yaml` already has both `BETTER_AUTH_SECRET` and `DATABASE_URL` keys — no changes needed there.

## Outcome

- ✅ Impact: Frontend pod can now start successfully — Better Auth has all required runtime env vars (BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL)
- 🧪 Tests: After `helm upgrade --install todoai . -f secrets.values.yaml` (with betterAuthUrl set), verify pod is Running and `/login` page loads
- 📁 Files: frontend-deployment.yaml, values.yaml, secrets.values.yaml.example
- 🔁 Next prompts: Redeploy with updated secrets.values.yaml (add betterAuthUrl); retry T-4.11 health check verification
- 🧠 Reflection: Better Auth requires DATABASE_URL at runtime (not just build time) because it manages sessions directly in PostgreSQL. BETTER_AUTH_URL must match the public URL users hit — for Minikube, that's http://$(minikube ip):30300.

## Evaluation notes (flywheel)

- Failure modes observed: BetterAuthError when BETTER_AUTH_SECRET/URL/DATABASE_URL are absent from frontend container env
- Graders run and results (PASS/FAIL): static review only — helm upgrade + pod status needed for full validation
- Prompt variant (if applicable): null
- Next experiment: null
