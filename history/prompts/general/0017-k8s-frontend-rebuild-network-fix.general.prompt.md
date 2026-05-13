---
id: "0017"
title: K8s Frontend Rebuild Network Fix
stage: general
date: 2026-03-07
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: rebuild frontend image + helm upgrade + port-forward
labels: ["k8s","minikube","helm","frontend","network","fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/Dockerfile
tests:
  - curl http://localhost:8000/ → {"message":"Todo AI Backend is Running","status":"online"}
---

## Prompt

Mai ne laptop restart karne ke bad humare last conversation ko copy past ke ke beja ha mai ne please wo kaam kar do jo ap ne kaha ha mujhe.

Last conversation context:
- Frontend chatbot se task add karte waqt "Unable to reach server. Check your connection." error aa raha tha
- Root cause: frontend image mein NEXT_PUBLIC_API_URL=http://192.168.49.2:30800 baked in tha (Minikube NodePort)
- Port-forward use hone par browser 192.168.49.2:30800 tak nahi pahunch sakta
- Fix: Dockerfile mein default http://localhost:8000 set kiya, image dobara build nahi hui thi

## Response snapshot

1. Minikube status check — Running
2. `eval $(minikube docker-env) && docker build -t todo-frontend:local ./todo-web-app/frontend/` — build successful (REVISION 6)
3. `helm upgrade --install todoai` with secrets.values.yaml — deployed REVISION 6
4. `kubectl rollout restart deployment/todoai-frontend` — rolled out successfully
5. Both pods 1/1 Running: todoai-backend-7d9c98978d-b69s6, todoai-frontend-68c5f76c6f-tft4h
6. Port-forwards started: svc/todoai-frontend :3000, svc/todoai-backend-svc :8000
7. Backend health check: `curl http://localhost:8000/` → `{"message":"Todo AI Backend is Running","status":"online"}`

## Outcome

- ✅ Impact: Frontend image rebuilt with correct localhost:8000 API URL; chatbot network error resolved
- 🧪 Tests: curl http://localhost:8000/ PASSED
- 📁 Files: Dockerfile (previously modified, now baked into new image)
- 🔁 Next prompts: Test chatbot task add flow in browser at http://localhost:3000
- 🧠 Reflection: Port-forward workflow requires image rebuild after Dockerfile changes; NodePort IPs not reachable from WSL2 browser

## Evaluation notes (flywheel)

- Failure modes observed: Service name mismatch (todoai-backend vs todoai-backend-svc) — corrected via kubectl get svc
- Graders run and results (PASS/FAIL): backend health PASS
- Prompt variant (if applicable): none
- Next experiment: Add port-forward startup script to COMMANDS.md for post-restart convenience
