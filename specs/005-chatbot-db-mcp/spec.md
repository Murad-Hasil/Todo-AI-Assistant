# Feature Specification: Phase 3.1 — Database Evolution & MCP Server

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft

> **Note**: Per the project constitution (Monorepo Pattern — Principle VII),
> detailed specification artifacts for Phase 3 chatbot features reside under
> `todo-web-app/specs/chatbot/`. This file is the SDD root index for the branch.

## Artifact Index

| Artifact       | Path                                           | Purpose                              |
|----------------|------------------------------------------------|--------------------------------------|
| Main Spec      | `todo-web-app/specs/chatbot/spec.md`           | User stories, requirements, success criteria |
| Database Spec  | `todo-web-app/specs/chatbot/database.md`       | Schema, migrations, SQLModel models  |
| MCP Tools Spec | `todo-web-app/specs/chatbot/mcp-tools.md`      | Tool contracts, params, return types |
| Agent Behavior | `todo-web-app/specs/chatbot/behavior.md`       | Trigger rules, error UX, Roman Urdu  |

## Summary

Phase 3.1 adds the data layer and AI tool boundary for the Phase 3 AI-Powered
Todo Chatbot. It consists of:

1. **Database Evolution** — Two new Neon PostgreSQL tables (`conversations`,
   `messages`) for stateless conversation history storage, added via Alembic
   migration without touching Phase 2 tables.

2. **MCP Server** — An Official MCP SDK (Python) server exposing five typed,
   stateless tools: `add_task`, `list_tasks`, `complete_task`, `delete_task`,
   `update_task`. All tools enforce user-data isolation via `user_id`.

3. **Agent Behavior Contract** — Tool-trigger definitions, Roman Urdu language
   support, graceful error handling, and confirmation-before-delete rules.

## Constitution Check

- [x] I. Spec-Driven Development — all Phase 3.1 code must reference this spec.
- [x] II. Read-Before-Write — Phase 2 schema verified before designing Phase 3 tables.
- [x] III. Non-Destructive Integration — new tables only; Phase 2 tables untouched.
- [x] IV. API-First Architecture — MCP tools are the only interface for AI→DB access.
- [x] V. Multi-User Data Isolation — all MCP tools accept and enforce `user_id`.
- [x] VI. JWT Security Contract — chat endpoint will reuse Phase 2 JWT dependency.
- [x] VII. Monorepo Pattern — specs reside in `todo-web-app/specs/chatbot/`.
- [x] VIII. Code Quality Standards — SQLModel ORM, type hints, PEP8 required.
- [x] IX. Stateless AI Request Cycle — conversation history fetched from DB per request.
- [x] X. MCP Tool Enforcement — agent uses MCP tools exclusively (no direct DB calls).
- [x] XI. Agent Behavior Contract — triggers, Roman Urdu, errors, confirmations defined.
