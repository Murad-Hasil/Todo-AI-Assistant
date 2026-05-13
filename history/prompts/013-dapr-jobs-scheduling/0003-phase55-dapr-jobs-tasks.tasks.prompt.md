---
id: "0003"
title: Phase 5.5 Dapr Jobs Scheduling Tasks
stage: tasks
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: 013-dapr-jobs-scheduling
branch: 013-dapr-jobs-scheduling
user: Murad Hasil
command: /sp.tasks
labels: ["tasks","phase5","dapr-jobs","scheduling","statestore","mcp","callback","dateparser"]
links:
  spec: specs/013-dapr-jobs-scheduling/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/013-dapr-jobs-scheduling/tasks.md
tests:
  - T-5.5.11 E2E: AI schedules reminder → Notification Service logs after 120s
  - T-5.5.11b Security gate: external /api/jobs/trigger → HTTP 403
---

## Prompt

Generate a task list for Phase 5.5: Intelligent Scheduling with Dapr Jobs API in `/todo-web-app/specs/phase5/scheduling-tasks.md` based strictly on the approved plan `@/todo-web-app/specs/phase5/scheduling-plan.md`.

The task list must include:
1. **INFRASTRUCTURE RECOVERY:** T-5.5.1 (statestore.yaml update), T-5.5.2 (secret verification)
2. **DEPENDENCIES & SETUP:** T-5.5.3 (dateparser + httpx in pyproject.toml)
3. **CORE SCHEDULING LOGIC:** T-5.5.4 (scheduler.py schedule_job), T-5.5.5 (time parsing)
4. **CALLBACK & INTEGRATION:** T-5.5.6 (jobs.py callback route), T-5.5.7 (main.py registration), T-5.5.8 (event bridge)
5. **AI AGENT UPGRADE:** T-5.5.9 (MCP tool), T-5.5.10 (prompt update)
6. **VERIFICATION:** T-5.5.11 (E2E 120s test)
7. **STYLISTIC RULES:** Task ID comments, non-blocking scheduling

## Response snapshot

13 atomic tasks generated across 7 phases, organized by user story priority (US1–US4).

Phase 1 (Setup/Verify): T-5.5.2, T-5.5.0 — verify secrets + dapr-scheduler-server
Phase 2 (Foundational): T-5.5.1/1b, T-5.5.3, T-5.5.5 — statestore YAML, dateparser, schemas
Phase 3 (US1 P1 MVP): T-5.5.5a, T-5.5.4, T-5.5.6a, T-5.5.7 — scheduler.py + /api/jobs/schedule
Phase 4 (US2 P2): T-5.5.1c/1d — statestore persistence verification
Phase 5 (US3 P3): T-5.5.6b/6c, T-5.5.7b, T-5.5.8 — callback routes + event bridge
Phase 6 (US4 P4): T-5.5.9, T-5.5.10 — MCP tool + system prompt
Phase 7 (Verification): T-5.5.11, T-5.5.11b — E2E + security gate

Key notes encoded in tasks:
- Non-blocking: asyncio.to_thread() wraps publish_reminder_event in callback
- Router split warning: /job/{name} needs no /api prefix (Dapr native path)
- MCP auth token: schedule_reminder self-calls localhost:8000; fallback internal secret documented
- keyPrefix: name verification in Phase 4 explicitly validates Dapr Scheduler persistence

## Outcome

- ✅ Impact: 13 atomic, immediately-executable tasks with exact file paths and code guidance
- 🧪 Tests: T-5.5.11 (E2E 120s), T-5.5.11b (security gate 403)
- 📁 Files: specs/013-dapr-jobs-scheduling/tasks.md
- 🔁 Next prompts: /sp.implement or start with T-5.5.2 (secret verification) manually
- 🧠 Reflection: US2 (statestore) is split — YAML change is foundational (Phase 2) but persistence verification is its own phase (Phase 4) after US1 proves the scheduling path works. This prevents blocking US1 on a kubectl wait cycle.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual format validation PASS (all tasks have ID, checkbox, file path)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run T-5.5.2 verification first to unblock entire chain
