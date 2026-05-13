# Production Audit Requirements Checklist

**Purpose:** Validate the quality, completeness, and clarity of production readiness requirements for the Phase 3.2 AI Backend (HF Space deployment).
**Created:** 2026-03-07
**Feature:** 005-chatbot-db-mcp
**Audit Date:** 2026-03-07
**Auditor:** Claude Sonnet 4.6 (agent)

---

## Requirement Completeness

- [ ] CHK001 - Are CORS configuration requirements explicitly specified in the spec, including which origins are allowed and whether credentials are supported? [Completeness, Gap] — `main.py` hardcodes `allow_origins=["*"]` but `settings.cors_origins_list` exists unused; the spec does not define the expected behavior.

- [ ] CHK002 - Are environment variable requirements documented with their effect on runtime behavior (not just their names)? [Completeness, Gap] — `CORS_ORIGINS` is listed in the env var table (CLAUDE.md) but is never wired to the middleware; its runtime effect is undefined.

- [ ] CHK003 - Are fallback behavior requirements defined for the case when the AI model returns an empty or null response? [Completeness, Gap] — No spec requirement covers what the API should return when `result.final_output` is empty/None.

- [ ] CHK004 - Are rate limiting requirements specified for the chat endpoint? [Completeness, Gap] — No rate limit spec exists for `POST /api/{user_id}/chat` despite it triggering Groq API calls per request.

- [ ] CHK005 - Are pagination requirements defined for all list/history endpoints? [Completeness, Gap] — `GET /api/{user_id}/conversations/{id}/messages` has no documented limit/offset requirements; spec does not address unbounded payload size.

- [ ] CHK006 - Are observability requirements defined (log sinks, metrics, alerting thresholds)? [Completeness, Gap] — Loggers are named (`agent.runner`, `auth.audit`) but no spec requirement covers log export, retention, or alerting.

---

## Requirement Clarity

- [ ] CHK007 - Is "stateless" defined with measurable criteria in the spec? [Clarity, Spec §Phase3.2] — "Stateless by design" appears in code comments but the spec does not define what state is prohibited (e.g., module-level agent instances, shared DB sessions).

- [ ] CHK008 - Is the `BETTER_AUTH_SECRET` synchronization requirement quantified with a rotation policy? [Clarity, Gap] — The shared secret mechanism is described but no spec defines the rotation procedure or the blast radius when secrets drift between Vercel and HF Space.

- [ ] CHK009 - Is the `max_turns=5` limit documented as a requirement with justification, or is it an undocumented implementation constant? [Clarity, Gap] — The value is hardcoded in `runner.py` without a corresponding spec requirement explaining the reasoning or acceptable range.

- [ ] CHK010 - Is `max_history_messages=10` specified as a requirement with rationale, or is it an arbitrary constant? [Clarity, Gap] — Configurable via `Settings` but no spec requirement defines the expected value or trade-off (context window vs. cost).

- [ ] CHK011 - Is the `complete_task` tool's divergence from the REST PATCH behavior (`/complete` toggles vs. MCP tool only sets `True`) explicitly documented as a requirement? [Clarity, Spec §MCP Tools] — The docstring notes the difference but no spec requirement mandates this asymmetry or explains the agent-safety rationale.

---

## Requirement Consistency

- [ ] CHK012 - Are CORS requirements consistent between the env var documentation (CLAUDE.md) and the actual middleware configuration (main.py)? [Consistency, Conflict] — CLAUDE.md documents `CORS_ORIGINS` as a runtime env var, but `main.py` hardcodes `allow_origins=["*"]`, ignoring the setting.

- [ ] CHK013 - Is the `allow_credentials` setting consistent between the FastAPI application code (`False`) and the observed HF proxy behavior (`access-control-allow-credentials: true`)? [Consistency, Conflict] — These two values differ; the spec does not acknowledge or account for HF proxy CORS header injection.

- [ ] CHK014 - Are error response formats consistent across REST routes and the chat endpoint? [Consistency] — REST routes raise HTTPException (FastAPI standard format); the chat endpoint also raises HTTPException. Verify the spec defines a unified error envelope for all endpoints.

---

## Acceptance Criteria Quality

- [ ] CHK015 - Can the user isolation requirement ("every query scoped to user_id") be objectively verified with a specific test case? [Measurability, Spec §Principle V] — The requirement exists but no acceptance test is defined that attempts cross-user data access and verifies a 403/empty result.

- [ ] CHK016 - Is the JWT expiry behavior requirement testable with a defined token TTL? [Measurability] — Auth correctly rejects expired tokens, but no spec defines the expected token lifetime or the test scenario for expiry edge cases.

- [ ] CHK017 - Are the MCP tool success/failure response contracts defined as testable acceptance criteria? [Measurability, Spec §MCP Tools] — Tools return `{"success": bool, ...}` but no spec defines the complete schema for each tool's success and error response.

---

## Scenario Coverage

- [ ] CHK018 - Are requirements defined for the Groq API rate limit scenario (HTTP 429 response from Groq)? [Coverage, Exception Flow, Gap] — `runner.py` catches `APITimeoutError` and `APIConnectionError` but not `RateLimitError`. The spec does not define behavior on Groq 429.

- [ ] CHK019 - Are requirements defined for the MCP subprocess crash scenario (subprocess exits unexpectedly)? [Coverage, Exception Flow, Gap] — The broad `except Exception` in `runner.py` handles this, but the spec does not define expected behavior or recovery when the MCP subprocess fails to start.

- [ ] CHK020 - Are requirements defined for concurrent chat requests from the same user? [Coverage, Edge Case] — No spec addresses what happens when two simultaneous requests attempt to create a conversation for the same user.

- [ ] CHK021 - Are requirements defined for the HF Space cold start scenario (first request after idle)? [Coverage, Non-Functional] — MCP subprocess startup latency on cold start is known (30s timeout configured) but not documented as an NFR with an acceptable p95 latency budget.

---

## Non-Functional Requirements

- [ ] CHK022 - Are performance SLOs (latency targets, throughput) defined for the chat endpoint? [Coverage, NFR, Gap] — No p95 latency or throughput requirements are specified for `POST /api/{user_id}/chat`, which is the highest-cost endpoint.

- [ ] CHK023 - Are Neon PostgreSQL connection requirements documented (pool strategy, max connections, timeout behavior)? [Completeness, NFR] — `NullPool` is used but no spec requirement documents the connection budget or reconnection behavior for Neon serverless.

- [ ] CHK024 - Are security requirements for the chat endpoint's abuse prevention documented? [Coverage, NFR, Gap] — Rate limiting is absent and undocumented as an explicit out-of-scope exclusion. The spec should either require rate limiting or explicitly exclude it with justification.

---

## Dependencies & Assumptions

- [ ] CHK025 - Is the assumption that the HF proxy handles CORS correctly documented as a system dependency? [Assumption, Gap] — The production CORS behavior relies on HF proxy header injection. This infrastructure assumption is not documented in the spec or architecture plan.

- [ ] CHK026 - Is the Groq `llama-3.3-70b-versatile` model's known malformed JSON limitation documented as a system constraint? [Assumption, Gap] — Known behavior is captured in MEMORY.md but not in any spec, plan, or architecture decision record.

- [ ] CHK027 - Is the `BETTER_AUTH_SECRET` shared-secret architecture documented as an ADR? [Traceability, Gap] — This is an architecturally significant decision (cross-service shared secret, no key rotation mechanism) that warrants an ADR but none exists.

---

## Ambiguities & Conflicts

- [ ] CHK028 - Does the spec clarify whether `CORS_ORIGINS` env var should be used or whether wildcard is the intended production behavior? [Ambiguity] — The env var exists in config but is ignored; intent is ambiguous.

- [ ] CHK029 - Does the spec define whether "stateless" applies to the MCP subprocess lifecycle (spawned per request vs. long-lived)? [Ambiguity, Spec §Phase3.2] — The current implementation spawns a new subprocess per chat request (via async context manager). This is a significant performance decision that may or may not be intentional.

- [ ] CHK030 - Is it specified whether `conversation_id=null` in a chat request always creates a new conversation or can resume the latest existing one? [Ambiguity, Spec §ChatEndpoint] — Current behavior: always creates new. The spec should explicitly state this to prevent future regressions.
