---
id: "0003"
title: Phase 5.4 Submission Prep Tasks
stage: tasks
date: 2026-03-10
surface: agent
model: claude-sonnet-4-6
feature: 011-submission-prep
branch: 011-submission-prep
user: brownie
command: /sp.tasks
labels: ["tasks","submission-prep","documentation","verification","cleanup","security"]
links:
  spec: specs/011-submission-prep/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/specs/phase5/wrap-up-tasks.md
tests:
  - Manual E2E verification (Groups A–D) — defined in Phase 5 tasks
---

## Prompt

Generate a task list for Phase 5.4: Project Finalization and Submission Prep in `/todo-web-app/specs/phase5/wrap-up-tasks.md` based strictly on the approved plan `@/todo-web-app/specs/phase5/wrap-up-plan.md`.

The task list must include:
1. **REPO SANITIZATION:** T-5.4.1: Artifact Cleanup. T-5.4.2: Security Verification.
2. **PROFESSIONAL DOCUMENTATION:** T-5.4.3: Root README.md. T-5.4.4: Local Setup Guide. T-5.4.5: CLAUDE.md Finalization.
3. **SUBMISSION PREP:** T-5.4.6: Final GitHub Sync. T-5.4.7: Demo Script Creation.
4. **VERIFICATION:** T-5.4.8: Final GitHub Audit.
5. **STYLISTIC RULES:** Use Task IDs in comments: `# [Task]: T-5.4.x`. Maintain calm, architectural tone.

## Response snapshot

Generated `todo-web-app/specs/phase5/wrap-up-tasks.md` with 7 phases and 28 tasks (T-5.4.1a through T-5.4.8e):
- Phase 1 (Sanitization): T-5.4.1a–c, T-5.4.2a–b — .gitignore audit, artifact cleanup, secret scan
- Phase 2 (CLAUDE.md Audit): T-5.4.5a–d — verify all 4 CLAUDE.md files
- Phase 3 (Documentation US1 P1): T-5.4.3a–d, T-5.4.4 — README completeness, evolution table, diagrams, live links, K8s guide
- Phase 4 (Demo Script US2 P2): T-5.4.7a–c — verify script segments, pre-recording checklist, Option A/B
- Phase 5 (E2E Verification US3 P3): T-5.4.8a–e — Test Groups A, B, C, D + e2e-final.md
- Phase 6 (Security US4 P4): T-5.4.2c–e — comprehensive scan, secrets.values.yaml audit
- Phase 7 (GitHub Sync): T-5.4.6a–e — git status, selective staging, commit, push, final audit
All 9 FRs and 5 SCs mapped. Known blocker (Redpanda reminders topic) documented with fallback.

## Outcome

- ✅ Impact: 28 immediately-executable tasks covering all 4 user stories and 8 top-level T-5.4.x deliverables
- 🧪 Tests: Manual E2E test groups A–D defined in Phase 5; results captured in e2e-final.md
- 📁 Files: todo-web-app/specs/phase5/wrap-up-tasks.md (created)
- 🔁 Next prompts: `/sp.implement` to execute tasks in order; start with Phase 1 (T-5.4.1a)
- 🧠 Reflection: Existing README and demo-script.md are already solid — most tasks are verification rather than creation; focus effort on E2E verification and GitHub sync

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Task format validation — all tasks have checkbox, ID, story label (where applicable), and file path — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Execute T-5.4.1a (git ls-files secret check) immediately to confirm baseline security hygiene
