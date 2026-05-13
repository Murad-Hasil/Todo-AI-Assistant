# Feature Specification: Project Finalization and Submission Prep

**Feature Branch**: `011-submission-prep`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "Generate the final wrap-up specification for Phase 5.4: Project Finalization and Submission Prep."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Evaluator Reviews Project Documentation (Priority: P1)

A Panaversity evaluator opens the monorepo README and, within 3 minutes, understands what the project does, how it evolved across 5 phases, what technologies were used, and where the live demos are. They can navigate directly to the frontend URL or HF Space without searching the codebase.

**Why this priority**: A well-written README is the first thing judges see. Without it, even a technically excellent project will score lower. This is the highest-leverage deliverable for the submission.

**Independent Test**: An evaluator unfamiliar with the codebase can open the root README, click live links, and understand the system architecture without asking any questions.

**Acceptance Scenarios**:

1. **Given** the monorepo root is opened on GitHub, **When** an evaluator reads the README, **Then** they see a project title, 5-phase evolution timeline, complete tech stack, infrastructure overview, and clickable live links within a single scroll.
2. **Given** the README is open, **When** an evaluator clicks the Vercel link, **Then** the production frontend loads and is functional.
3. **Given** the README is open, **When** an evaluator clicks the HF Space link, **Then** the backend API confirms the service is running (allowing for cold-start delay).

---

### User Story 2 — Demo Video Presenter Follows Script (Priority: P2)

The presenter records a 90-second screen-capture demo following a defined script that shows: sign-in, creating a "remind me" task, using the AI chatbot, and (optionally) viewing the notification log. The script covers all key features without exceeding the time limit.

**Why this priority**: The demo video is the primary submission artifact alongside the README. It must showcase all phases compactly. The script prevents ad-hoc recording that misses key features.

**Independent Test**: A team member reads the demo script cold and can produce a coherent 90-second recording without needing additional briefing.

**Acceptance Scenarios**:

1. **Given** the demo script is available, **When** a presenter follows each step, **Then** they demonstrate user auth, task CRUD, AI chatbot, and event-driven notification — all within 90 seconds.
2. **Given** the recording is complete, **When** the evaluator watches it, **Then** every major feature (from each of the 5 phases) is visible at least once.

---

### User Story 3 — Developer Verifies End-to-End Consistency (Priority: P3)

A developer runs through the E2E verification checklist and confirms: the production frontend talks to the HF backend, the AI chatbot creates tasks, and the local K8s cluster reflects the same feature set. Any gaps between environments are documented.

**Why this priority**: Consistency between environments ensures the demo is reproducible and the submission doesn't break during evaluation.

**Independent Test**: A developer can run the E2E checklist against production (Vercel + HF) and mark all items complete or document blockers with workarounds.

**Acceptance Scenarios**:

1. **Given** the production environment is live, **When** a user signs in and creates a task via the frontend, **Then** the task is persisted and visible on refresh.
2. **Given** the production environment, **When** the AI chatbot is asked to add a task, **Then** the task is created and a success response is returned.
3. **Given** the K8s cluster is running, **When** `kubectl get pods` is run, **Then** all pods (backend, frontend, notification) report Running status.

---

### User Story 4 — Maintainer Confirms No Hardcoded Secrets (Priority: P4)

A maintainer or evaluator audits the codebase and finds zero hardcoded credentials, API keys, or tokens in tracked files. All secrets are injected via environment variables or Kubernetes Secrets. `.env.example` files document required variables without real values.

**Why this priority**: Security hygiene is a baseline requirement. Hardcoded secrets are a disqualifier in professional evaluations and create real risk.

**Independent Test**: Searching tracked files for known secret patterns returns no matches; `.env.example` files exist for all services.

**Acceptance Scenarios**:

1. **Given** the monorepo is checked out fresh, **When** tracked Python, YAML, and config files are searched for API key patterns, **Then** zero real credentials are found.
2. **Given** `todo-web-app/backend/.env.example` is opened, **Then** it lists all required environment variables with placeholder values and brief descriptions.

---

### Edge Cases

- What if the HF Space is sleeping (cold-start delay ~30s)? README must document the cold-start behavior so evaluators don't assume the service is broken.
- What if the `reminders` Kafka topic doesn't exist in Redpanda at demo time? Demo script must include a fallback direct-POST test that proves the notification app logic works independently of Kafka.
- What if the K8s cluster is not running at evaluation time? README must clearly distinguish between local K8s (requires setup) and production (always-on Vercel + HF Space).
- What if a live link is broken at submission time? README must include last-verified date and fallback screenshots or video timestamps.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The monorepo root MUST contain a comprehensive `README.md` covering: project overview, 5-phase evolution with dates, tech stack (all major technologies), infrastructure overview, and live links.
- **FR-002**: The README MUST include a phase evolution table or timeline showing what was built in each phase.
- **FR-003**: A written 90-second demo script MUST be committed to the repository (`docs/demo-script.md`) describing each presenter action and expected visible outcome.
- **FR-004**: All live links (Vercel frontend, HF Space backend, GitHub repo) MUST be verified as functional at submission time.
- **FR-005**: All tracked files MUST be free of hardcoded API keys, database URLs, passwords, or tokens; secrets MUST be injected via environment variables or secret management.
- **FR-006**: A `.env.example` file MUST exist in `todo-web-app/backend/` listing all required environment variables with placeholder values and one-line descriptions.
- **FR-007**: The E2E flow — sign in → create task → AI chatbot interaction — MUST be verified working in the production environment at submission time.
- **FR-008**: The README MUST document the Kubernetes local deploy commands so a new evaluator can spin up the cluster from scratch.
- **FR-009**: An E2E verification checklist MUST be committed to `specs/011-submission-prep/checklists/` documenting the final state of each environment at submission time.

### Key Entities

- **Root README**: Primary public-facing documentation. Contains overview, phase evolution, tech stack, infrastructure, live links, and K8s setup guide.
- **Demo Script**: Time-boxed (90s) narrative listing each presenter action and expected screen outcome. Committed to `docs/demo-script.md`.
- **E2E Checklist**: Final verification document confirming production and K8s environments are consistent and functional at submission time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unfamiliar evaluator can understand the project's purpose, 5-phase evolution, and full tech stack by reading the README in under 3 minutes.
- **SC-002**: All live links in the README load within 35 seconds (accounting for HF Space cold-start) and display functioning application pages.
- **SC-003**: A presenter following the demo script completes all feature highlights within 90 seconds without needing to refer to external documentation.
- **SC-004**: Zero hardcoded secrets are present in any tracked file — confirmed by search.
- **SC-005**: The E2E happy path (sign in → create task → AI chatbot response) executes without errors in the production environment.

## Scope

### In Scope

- Root `README.md` creation (project overview, phases, tech stack, live links, K8s guide)
- Demo script committed as `docs/demo-script.md`
- E2E verification checklist execution and documentation
- Audit and confirmation of no hardcoded secrets in tracked files
- Verification that `.env.example` files are present and complete
- Live link validation (Vercel + HF Space + GitHub)
- Final `kubectl get pods` capture confirming K8s state

### Out of Scope

- New feature development (no new endpoints, UI components, or services)
- Fixing the Redpanda `reminders` topic creation in Kafka (infrastructure operator task — documented as known blocker)
- UI redesign or styling changes to the frontend
- Adding automated tests
- Performance benchmarking or load testing

## Assumptions

- The production Vercel frontend and HF Space backend are already deployed and functional from earlier phases.
- The local Minikube cluster is running from Phase 4+; the README will document the setup from scratch for evaluators who need it.
- "5-phase evolution" refers to: Phase 1 (Python CLI), Phase 2 (Full-Stack Web App), Phase 3 (AI Chatbot), Phase 4 (Kubernetes), Phase 5 (Event-Driven with Dapr + Kafka).
- The demo script targets a screen-capture tool (Loom, OBS, or similar); no specific tool is mandated.
- The "PDF Page 4 demo requirement" refers to a short recorded walk-through; the exact format is flexible.
- HF Space cold-start delay (~30s) is an accepted characteristic; the README will note it rather than treat it as a defect.
- The GitHub repository is already public or accessible to evaluators.
