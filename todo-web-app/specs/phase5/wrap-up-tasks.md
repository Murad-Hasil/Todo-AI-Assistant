# Tasks: Phase 5.4 — Project Finalization and Submission Prep

**Input**: Design documents from `todo-web-app/specs/phase5/wrap-up-plan.md` + `specs/011-submission-prep/spec.md`
**Branch**: `011-submission-prep`
**Date**: 2026-03-10

**Constraint**: Zero new application code. All tasks are documentation, verification, or cleanup.
**Style rule**: `# [Task]: T-5.4.x` in all file edits and comments.

## Format: `[ID] [P?] [USx] Description — file path`

- **[P]**: Parallelizable with other [P] tasks in same phase
- **[USx]**: User story this task satisfies (US1=Documentation, US2=Demo, US3=E2E, US4=Security)
- All paths are relative to monorepo root (`/home/brownie/projects/hackathon-II/`)

---

## Phase 1: Setup — Monorepo Sanitization

**Purpose**: Remove artifacts and verify .gitignore before any documentation work.
**Maps to**: TG-01 SANITIZE, User Story 4 (P4 — Security hygiene baseline)

**⚠️ COMPLETE BEFORE DOCUMENTATION**: These tasks confirm the repo is clean and safe to submit.

- [ ] T-5.4.1a [US4] Run .gitignore coverage check — verify no `.env`, `__pycache__`, `.next/`, or `secrets.values.yaml` files are tracked: `git ls-files | grep -E '\.env$|__pycache__|\.next/|secrets\.values\.yaml$'` → expect zero output
- [ ] T-5.4.1b [P] [US4] Clean local build artifacts (non-destructive, does not affect git): `find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; find . -name '*.pyc' -delete 2>/dev/null; rm -rf todo-web-app/frontend/.next/` — confirm directories removed
- [ ] T-5.4.1c [P] [US4] Verify `.gitignore` at repo root contains patterns for: `__pycache__/`, `.next/`, `.env`, `secrets.values.yaml` (not `.example`) — read `/.gitignore` and confirm each pattern present
- [ ] T-5.4.2a [US4] Run secret pattern scan on tracked files — execute: `git grep -rn 'postgresql://' -- ':!*.example' ':!*.md' ':!history/'` and `git grep -rn 'gsk_\|sk-\|Bearer ' -- ':!*.md' ':!*.example' ':!history/'` → expect zero matches in source files
- [ ] T-5.4.2b [US4] Verify `todo-web-app/backend/.env.example` exists and contains all 10 required variables (DATABASE_URL, SECRET_KEY, BETTER_AUTH_SECRET, GROQ_API_KEY, CORS_ORIGINS, REDPANDA_BOOTSTRAP_SERVER, REDPANDA_USERNAME, REDPANDA_PASSWORD, DAPR_HTTP_PORT, DAPR_GRPC_PORT) with placeholder values only — read `todo-web-app/backend/.env.example`

**Checkpoint**: All tracked files clean — zero secrets, zero build artifacts. Safe to proceed.

---

## Phase 2: Foundational — CLAUDE.md Audit

**Purpose**: Ensure all CLAUDE.md files are accurate before documentation work references them.
**Maps to**: TG-05 AUDIT

**⚠️ COMPLETE BEFORE DOCUMENTATION**: CLAUDE.md files are the source of commands documented in the README.

- [ ] T-5.4.5a [P] Read and verify `todo-web-app/CLAUDE.md` — confirm Helm upgrade command, Dapr apply command, and `kubectl get pods` command are accurate for current Phase 5.3 state; apply minimal targeted fix if any command is stale — `todo-web-app/CLAUDE.md`
- [ ] T-5.4.5b [P] Read and verify `todo-web-app/backend/CLAUDE.md` — confirm `./deploy-backend.sh`, uvicorn run command, and Alembic migration commands are accurate; apply minimal targeted fix if stale — `todo-web-app/backend/CLAUDE.md`
- [ ] T-5.4.5c [P] Read and verify `todo-web-app/frontend/CLAUDE.md` — confirm `npx vercel deploy --prod`, `npm run build`, and `npm run dev` commands are accurate; apply minimal targeted fix if stale — `todo-web-app/frontend/CLAUDE.md`
- [ ] T-5.4.5d Read and verify root `CLAUDE.md` — confirm `Active Technologies` section includes Phase 5 stack (Dapr 1.17, Redpanda/Kafka, Notification Service Python 3.13); update if any technology is missing or version is wrong — `CLAUDE.md`

**Checkpoint**: All CLAUDE.md files reflect the current Phase 5.3 stack and commands.

---

## Phase 3: User Story 1 — Professional Documentation (Priority: P1) 🎯 MVP

**Goal**: An evaluator opens the root README and, within 3 minutes, understands the project, all 5 phases, the tech stack, architecture, and can click live links.

**Independent Test**: Open `README.md` on GitHub, read top to bottom — all 9 verification items in the checklist below are checked.

**Maps to**: FR-001, FR-002, FR-004, FR-006, FR-008 | TG-02 DOCS

### Implementation for User Story 1

- [ ] T-5.4.3a [US1] Read `README.md` and tick off the completeness checklist from plan §1.2 D-001 — confirm: title visible, live demo table present, HF cold-start warning documented, 5-phase evolution table present, tech stack table present, architecture diagram present, K8s commands accurate, secrets table present, Redpanda blocker documented — `README.md`
- [ ] T-5.4.3b [P] [US1] Verify or add Phase Evolution table to `README.md` — table must have 5 rows (Phase 1–5) with columns: Phase, What Was Built, Key Technologies — see plan §1.2 D-002 for exact content — `README.md`
- [ ] T-5.4.3c [P] [US1] Verify or add ASCII architecture diagrams to `README.md` — two diagrams required: Phase 3 AI architecture (Browser → Vercel → FastAPI → MCP → Neon) and Phase 5 event-driven architecture (FastAPI → Dapr sidecar → Redpanda → Notification Service) — see plan §1.2 D-003 — `README.md`
- [ ] T-5.4.3d [US1] Verify Live Links Registry in `README.md` — manually open all 5 URLs (Vercel frontend, HF Backend root, HF Health `/api/health`, GitHub repo, HF Space page) and confirm each loads within 35s; update README with last-verified date — `README.md`
- [ ] T-5.4.4 [US1] Verify K8s Quick Start section in `README.md` is accurate against current cluster state — compare commands in README §"Local Kubernetes Setup" against `todo-web-app/CLAUDE.md` Phase 5.3 commands; ensure `kubectl apply -f todo-web-app/k8s/dapr/` step is present; add Redpanda `reminders` topic manual creation warning if not present — `README.md`

**Checkpoint**: README passes all 9 checklist items. SC-001 (< 3 min read) and SC-002 (< 35s link load) satisfied.

---

## Phase 4: User Story 2 — Demo Script Prep (Priority: P2)

**Goal**: A presenter reads `docs/demo-script.md` and produces a coherent 90-second recording without additional briefing.

**Independent Test**: A team member cold-reads the script and identifies which of the 4 segments covers each of the 5 phases.

**Maps to**: FR-003 | TG-04 DEMO

### Implementation for User Story 2

- [ ] T-5.4.7a [US2] Read `docs/demo-script.md` and verify segment timing matches plan §1.5: 0-15s landing page, 15-45s task/AI chatbot, 45-75s K8s/Dapr infra, 75-90s conclusion — confirm all 5 phases represented; apply minimal fix if any segment is missing or timing is off — `docs/demo-script.md`
- [ ] T-5.4.7b [P] [US2] Verify `docs/demo-script.md` includes pre-recording checklist from plan §1.5 — must have 7 items: frontend loads, HF health check, Minikube running, notification logs visible, screen resolution, audio check, logged-out session — add any missing items — `docs/demo-script.md`
- [ ] T-5.4.7c [US2] Confirm Option A (K8s live demo) vs Option B (fallback narration) for the notification segment is clearly distinguished in `docs/demo-script.md` — verify the kubectl logs command in Option A matches the current pod label `app.kubernetes.io/name=todoai-notification` — `docs/demo-script.md`

**Checkpoint**: Script is self-contained, all 5 phases represented, Option A/B clearly marked. SC-003 (90s script) satisfied.

---

## Phase 5: User Story 3 — E2E Verification (Priority: P3)

**Goal**: Confirm that the production E2E flow (sign in → create task → AI chatbot) works and that the local K8s cluster reflects the same feature set.

**Independent Test**: Execute all items in Test Groups A–D from plan §1.4 and mark each pass/fail. Document results in `specs/011-submission-prep/checklists/e2e-final.md`.

**Maps to**: FR-007, FR-009 | TG-03 VERIFY

### Implementation for User Story 3

- [ ] T-5.4.8a [US3] Execute Test Group A — Production Auth (plan §1.4): open Vercel frontend → register new user → sign out → sign in → create task → complete task → refresh and verify persistence — record each of A1–A6 pass/fail in `specs/011-submission-prep/checklists/e2e-final.md`
- [ ] T-5.4.8b [US3] Execute Test Group B — AI Chatbot (plan §1.4): open ChatDrawer → send "add a task: remind me to buy milk" → verify task created → send "show me my tasks" → verify list returned → send "delete the task about buying milk" → verify deletion — record B1–B3 in `specs/011-submission-prep/checklists/e2e-final.md`
- [ ] T-5.4.8c [US3] Execute Test Group C — Notification Service (plan §1.4): run `kubectl get pods` → verify backend 2/2, frontend 2/2, notification 1+/2 Running → run notification log command → confirm REMINDER log entry visible — if `reminders` topic not created, use fallback direct-POST; record C1–C3 and which path taken in `specs/011-submission-prep/checklists/e2e-final.md`
- [ ] T-5.4.8d [P] [US3] Execute Test Group D — UI Visual Check (plan §1.4): verify landing page bento-grid and hero at 1280×720, dashboard grid layout, ChatDrawer FAB opens correctly, layout at 1024px width — record D1–D4 pass/fail in `specs/011-submission-prep/checklists/e2e-final.md`
- [ ] T-5.4.8e [US3] Write final E2E summary in `specs/011-submission-prep/checklists/e2e-final.md` — include: date verified, environment URLs, known blockers (Redpanda reminders topic), overall pass/fail status — this document is a submission artifact

**Checkpoint**: `e2e-final.md` complete with all Groups A–D recorded. SC-005 (E2E happy path) satisfied.

---

## Phase 6: User Story 4 — Security Verification (Priority: P4)

**Goal**: Confirm zero hardcoded secrets in any tracked file. Maintainer can search the codebase and find no real credentials.

**Independent Test**: All secret-scan commands from plan §1.1 Step S2 return zero matches.

**Maps to**: FR-005 | TG-01 SANITIZE (security layer)

### Implementation for User Story 4

- [ ] T-5.4.2c [US4] Run final comprehensive secret scan — execute all 3 commands from plan §1.1 Step S2: database URL scan, API key scan, YAML password scan → document results (expected: all zero matches) in `specs/011-submission-prep/checklists/e2e-final.md` under "Security Audit" section
- [ ] T-5.4.2d [US4] Verify `todo-web-app/k8s/charts/todoai/secrets.values.yaml` is NOT in git tracked files — `git ls-files | grep secrets.values.yaml | grep -v example` → expect zero output; if found, immediately run `git rm --cached` and add to `.gitignore`
- [ ] T-5.4.2e [US4] Verify `todo-web-app/k8s/charts/todoai/secrets.values.yaml.example` IS tracked and contains only placeholder values — read file and confirm every value is a placeholder string (not a real credential)

**Checkpoint**: Zero real secrets in any tracked file. SC-004 (zero hardcoded secrets) satisfied.

---

## Phase 7: Submission — Final GitHub Sync

**Purpose**: Push the final, clean state of the monorepo to the public GitHub repository.
**Maps to**: FR-004 | TG-03 VERIFY (submission step)

**⚠️ COMPLETE LAST**: All documentation, verification, and audit tasks must pass before pushing.

- [ ] T-5.4.6a [US3] Run `git status` to review all staged and unstaged changes — confirm only documentation files changed (README.md, docs/demo-script.md, CLAUDE.md files, wrap-up-plan.md, wrap-up-tasks.md, e2e-final.md) and no application code modified — repo root
- [ ] T-5.4.6b [US3] Stage all changed documentation files explicitly by name (not `git add .`) — avoid accidentally staging build artifacts or secrets: `git add README.md docs/demo-script.md todo-web-app/specs/phase5/ specs/011-submission-prep/ CLAUDE.md todo-web-app/CLAUDE.md todo-web-app/backend/CLAUDE.md todo-web-app/frontend/CLAUDE.md` — repo root
- [ ] T-5.4.6c [US3] Commit with message referencing Phase 5.4: `git commit -m "docs: Phase 5.4 submission prep — README, demo script, E2E checklist, CLAUDE.md audit"` — repo root
- [ ] T-5.4.6d [US3] Push to `main` branch: `git push origin 011-submission-prep` then create PR, or merge directly to main per project workflow — confirm push succeeds on GitHub
- [ ] T-5.4.6e [US3] Open `https://github.com/Murad-Hasil/Todo-AI-Assistant` and verify: README renders correctly with badges, live links are clickable, architecture diagrams display, phase evolution table is visible — this is the Final GitHub Audit (T-5.4.8)

**Checkpoint**: GitHub public repo displays the final, professional state. All submission artifacts committed.

---

## Dependencies & Execution Order

```
Phase 1 (Sanitization)
  └─► Phase 2 (CLAUDE.md Audit)
        └─► Phase 3 (Documentation — US1)
              ├─► Phase 4 (Demo Script — US2)   ← can run parallel with Phase 5
              └─► Phase 5 (E2E Verification — US3)
                    └─► Phase 6 (Security Audit — US4)
                          └─► Phase 7 (GitHub Sync)
```

### Parallel Opportunities

| Group | Tasks | Can run in parallel |
|-------|-------|---------------------|
| Phase 1 | T-5.4.1b, T-5.4.1c | Yes — different files |
| Phase 2 | T-5.4.5a, T-5.4.5b, T-5.4.5c | Yes — different CLAUDE.md files |
| Phase 3 | T-5.4.3b, T-5.4.3c, T-5.4.3d | Yes — independent README sections |
| Phase 5 | T-5.4.8d | Yes — visual check, no shared state |

---

## Implementation Strategy

### MVP (User Story 1 only — for minimum passing submission)

1. Phase 1: Sanitization (T-5.4.1a → T-5.4.2b)
2. Phase 2: CLAUDE.md audit (T-5.4.5a–5d)
3. Phase 3: README verification (T-5.4.3a → T-5.4.4)
4. Phase 7: Commit + push (T-5.4.6a → T-5.4.6e)

### Full Submission

Complete all phases in order. Estimated execution: 2–3 hours (verification-heavy).

---

## Acceptance Criteria Summary

| Task Group | FR | SC | Done when... |
|------------|----|----|-------------|
| Sanitization (Ph 1+6) | FR-005 | SC-004 | Zero secret scan matches, e2e-final.md security section complete |
| Documentation (Ph 2+3) | FR-001,002,006,008 | SC-001,002 | README 9-item checklist all ticked; all live links load |
| Demo Script (Ph 4) | FR-003 | SC-003 | Script covers 4 segments, all 5 phases visible, pre-recording checklist present |
| E2E Verification (Ph 5) | FR-007,009 | SC-005 | e2e-final.md complete with Groups A–D results |
| GitHub Sync (Ph 7) | FR-004 | — | Public repo shows professional README with working links |

---

## Notes

- No application code changes in any task — only documentation, configuration, and verification
- `# [Task]: T-5.4.x` comment style applies when making file edits (e.g., adding a README section)
- Maintain calm, architectural tone in all documentation additions — no marketing language
- Known blocker: Redpanda `reminders` topic requires manual creation in Redpanda Cloud before Test Group C Option A can pass — fallback is documented and acceptable for submission
- Backend git submodule (`todo-web-app/backend/`) is a separate repo — do NOT commit docs changes there; only the root monorepo is the submission artifact
