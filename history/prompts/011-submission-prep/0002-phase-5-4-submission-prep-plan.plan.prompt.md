---
id: "0002"
title: Phase 5.4 Submission Prep Plan
stage: plan
date: 2026-03-10
surface: agent
model: claude-sonnet-4-6
feature: 011-submission-prep
branch: 011-submission-prep
user: brownie
command: /sp.plan
labels: ["plan","submission-prep","documentation","verification","cleanup"]
links:
  spec: specs/011-submission-prep/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/phase5/wrap-up-plan.md
  - specs/011-submission-prep/plan.md
tests:
  - Manual E2E verification protocol (Groups A–D) — planned, not yet run
---

## Prompt

Generate the technical plan for Phase 5.4: Project Finalization and Submission Prep in `/todo-web-app/specs/phase5/wrap-up-plan.md` based strictly on the approved spec `@/todo-web-app/specs/phase5/notifications.md` and the root project goals.

The plan must include:
1. **MONOREPO SANITIZATION:** Plan a sweep of all directories (`/todo-cli`, `/todo-web-app`) to remove log files, temporary build artifacts (`.next`, `__pycache__`), and stray `.env` files that should not be in the final repo. Verify that all sensitive data is exclusively managed via environment variables (Local/Vercel/HF) or Kubernetes Secrets.

2. **DOCUMENTATION ARCHITECTURE:** Root README.md high-level overview with "Evolution" journey. Architecture diagrams for Phase 3 (AI) and Phase 5 (Microservices). Live Links Registry. Local K8s Guide Quick Start.

3. **FINAL SYSTEM VERIFICATION:** Testing protocol for Auth (sign-up/login on LIVE), AI ("Remind me" tasks trigger Notification Service), UI (SaaS Landing page and Bento-grid visual check).

4. **DEMO SCRIPT PREPARATION:** 90-second script for submission video: 0-15s intro, 15-45s task/AI demo, 45-75s infra showcase, 75-90s conclusion.

5. **CODE QUALITY AUDIT:** Final check of CLAUDE.md files for accuracy.

## Response snapshot

Generated comprehensive technical plan at `todo-web-app/specs/phase5/wrap-up-plan.md` (212 lines) covering:
- Phase 0 research: confirmed README (224 lines), demo-script.md, and project structure are already in good shape
- Phase 1 design: 6 sections — S1-S3 sanitization commands, D-001 through D-005 documentation artifacts, K8s quick start verification, E2E test groups A-D, 90s demo script segment breakdown, CLAUDE.md audit checklist
- Constitution check: all 13 principles pass (documentation-only feature)
- FR-001 through FR-009 and SC-001 through SC-005 fully mapped to plan sections
- Known blockers documented: Redpanda `reminders` topic manual creation required

## Outcome

- ✅ Impact: Comprehensive plan produced; all 9 FRs and 5 SCs mapped to concrete verification steps
- 🧪 Tests: Manual E2E verification protocol defined in §1.4 (Groups A, B, C, D) — execution is the next step
- 📁 Files: todo-web-app/specs/phase5/wrap-up-plan.md (created)
- 🔁 Next prompts: `/sp.tasks` to generate task list for 011-submission-prep; then execute TG-01 → TG-05 in order
- 🧠 Reflection: README and demo-script were already complete from Phase 5.1 deployment work — plan focuses on verification and gap-filling rather than creation

## Evaluation notes (flywheel)

- Failure modes observed: none — all artifacts were found in expected locations
- Graders run and results (PASS/FAIL): Constitution check — all 13 gates PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run secret scan commands from §1.1 Step S2 to confirm zero hardcoded credentials
