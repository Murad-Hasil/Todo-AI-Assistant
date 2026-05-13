---
id: "0024"
title: K8s Dapr Fix + Testing Doc
stage: general
date: 2026-03-10
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 011-submission-prep
user: brownie
command: manual
labels: ["k8s","dapr","testing","notification","debugging"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - TESTING.md
tests:
  - Backend health: 200 OK
  - Notification direct HTTP: [REMINDER] log confirmed
  - Dapr pubsub publish: HTTP 204
  - All 3 pods 2/2 Running
---

## Prompt

Hum ne jo kuch implement kia ha usko hum test karege abhi complete uske bad final polishing ka kaam hoga, mujhe app ko complete check karne ke sare commands ka root pe .md file bana kar do with comments and uske bad aap kud check karo pore app ko, mai ne check kia ha localhost 3000 pe add task wali dashboard ke nechy ye "Unable to reach server. Please try again later." raha ha, vercel pe bilkul sai chal raha ha sab kuch, notification check karne ki koshish ki mai ne wo bhi mujhe nahi dekha wo bhi check kar lo abhi, sab ka pir mujhe report dedo mai .md file ko root se dekh kar manually app ko check karoga uske bad hum aage badege, hume aaj ke din hi is project ko final karna ha.

## Response snapshot

Diagnosed and fixed 2 critical issues:
1. Dapr scheduler-server 0/1/2 in CrashLoopBackOff (stale etcd TLS certs in PVCs after Minikube restart) → Full `dapr uninstall + dapr init --kubernetes --wait` resolved it. All 3 scheduler pods now 1/1 Running.
2. "Unable to reach server" on localhost:3000 → NEXT_PUBLIC_API_URL not baked in image, falls back to localhost:8000. Fix: kubectl port-forward backend to 8000 alongside frontend on 3000.
3. Subscription route mismatch: subscriptions/reminders-sub.yaml routes to /api/events/reminder but notification service listens on /on-reminder → Reapplied subscription-reminders.yaml (correct: /on-reminder + scope todo-notification-service).
4. Notification service direct test PASSED: [REMINDER] log confirmed.
5. Kafka delivery pending: Redpanda Cloud `reminders` topic needs manual creation (autoCreateTopics: false).
Created TESTING.md at project root with 11 sections covering all test scenarios.

## Outcome

- ✅ Impact: All 3 pods 2/2 Running, Dapr scheduler healthy, notification service verified, TESTING.md created
- 🧪 Tests: Backend health 200, notification direct HTTP PASS, pubsub publish 204
- 📁 Files: TESTING.md (new)
- 🔁 Next prompts: Create Redpanda reminders topic, final polishing, submission
- 🧠 Reflection: Dapr scheduler etcd TLS issue recurs after Minikube restart — full reinstall is the reliable fix. Subscription file conflict (two yamls with same name) was a latent bug.

## Evaluation notes (flywheel)

- Correct subscription file must be documented: subscription-reminders.yaml NOT subscriptions/reminders-sub.yaml
- After Minikube restart, always check dapr-system pods before app pods
- WSL2 requires port-forward for BOTH frontend and backend (not just frontend)
