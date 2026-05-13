# Research: Task Search & Filter (015)

**Date**: 2026-04-07
**Status**: Complete — no external unknowns

## Summary

All decisions resolved through analysis of existing codebase and spec. No NEEDS CLARIFICATION items remain.

## Decisions

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| Filter execution location | Client-side (browser) | Tasks already loaded; zero latency | Server-side: adds API params + round-trip for no gain at this scale |
| State ownership | `useState` in `FilterBar` client component | Co-located with UI; simple lift to page if needed | Context/Redux: overkill for single page |
| New npm packages | None | Tailwind + native HTML controls sufficient | Fuse.js (fuzzy search): overkill; headless-ui: not already installed |
| Search fields | title + description | Maximum coverage; both fields are short strings | Title only: misses description-based tasks |
| Sort null handling | `null due_date` → bottom | Matches user expectation (no deadline = less urgent) | Top: counter-intuitive |
| Filter persistence | Session memory only | Simplest acceptable for hackathon | URL params: nice but extra complexity |

## Existing Code Notes

- `TaskCardGrid.tsx` currently receives `tasks: Task[]` prop — already set up to accept a filtered list.
- `FilterBar` or similar may already exist (check before creating). The `SortOrder` enum is already in `schemas.py` on the backend; frontend type may exist in `api.ts`.
- Dashboard `page.tsx` fetches tasks server-side; filter state must live in a Client Component wrapper.
