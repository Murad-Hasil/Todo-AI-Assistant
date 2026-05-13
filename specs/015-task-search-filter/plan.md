# Implementation Plan: Task Search & Filter (015)

**Branch**: `015-task-search-filter` | **Date**: 2026-04-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-task-search-filter/spec.md`

## Summary

Add client-side search (keyword) and filter (priority, status) + sort (due_date, priority, created) to the dashboard task list. All filtering is performed in the browser on the already-fetched task array — no new backend endpoints required. A `FilterBar` component holds filter state; `TaskCardGrid` receives the filtered/sorted list.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 14+ (App Router)
**Primary Dependencies**: React `useState`, Tailwind CSS — no new packages
**Storage**: N/A (client-side state only; tasks fetched once on page load)
**Testing**: TypeScript `tsc --noEmit` (type check); manual E2E via browser
**Target Platform**: Web — desktop + mobile responsive
**Project Type**: Web application (frontend only change)
**Performance Goals**: Instant filtering (<16ms render frame, no API call)
**Constraints**: Must not break existing task CRUD; no new API endpoints; no new npm packages
**Scale/Scope**: Operates on single user's task list (typically <100 tasks)

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven | spec.md + plan.md + tasks.md exist before code | ✅ Following now |
| II. Read-Before-Write | Agent reads all target files before modifying | ✅ Enforced |
| III. Non-Destructive | Client-side only — no backend routes touched | ✅ Safe |
| V. User Isolation | No data access change — read-only filter on existing list | ✅ N/A |
| VIII. PEP8/TS Strict | TypeScript strict, Tailwind only | ✅ Required |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/015-task-search-filter/
├── spec.md              ✅ Done
├── plan.md              ✅ This file
├── research.md          ✅ Phase 0 (below — simple, no unknowns)
├── data-model.md        ✅ Phase 1 (below — client FilterState only)
├── contracts/           ✅ Phase 1 (no new API; existing GET /tasks documented)
└── tasks.md             🔜 /sp.tasks next
```

### Source Code (relevant paths)

```text
todo-web-app/frontend/src/
├── components/
│   ├── FilterBar.tsx            # NEW — search input + filter dropdowns + clear btn
│   └── tasks/
│       └── TaskCardGrid.tsx     # MODIFY — accept filteredTasks prop or apply filter internally
└── app/
    └── dashboard/
        └── page.tsx             # MODIFY — render FilterBar, pass filtered list to TaskCardGrid
```

## Phase 0: Research

*No external unknowns — feature is pure client-side React state. Decisions recorded below.*

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Filter location | Client-side (browser) | Tasks already loaded; no API round-trip needed; instant UX |
| State management | React `useState` in dashboard `page.tsx` or a new `FilterBar` client component | Simple; no Redux/Zustand needed for this scope |
| Search scope | Title + description (case-insensitive substring) | Covers most user intents; description adds useful coverage |
| Sort null handling | `due_date=null` → sort to bottom | Consistent with date-picker UX expectations |
| New packages | None | Tailwind + native `<input>`/`<select>` sufficient |
| Filter persistence | Session-only (no URL/localStorage) | Simplest; acceptable for hackathon scope |

## Phase 1: Design & Contracts

### Data Model — FilterState (client-side only)

```typescript
interface FilterState {
  search: string;           // keyword — matches title OR description
  priority: '' | 'low' | 'medium' | 'high';  // '' = All
  status: '' | 'pending' | 'completed';       // '' = All
  sort: 'created' | 'due_date' | 'priority'; // default: 'created'
}

const DEFAULT_FILTER: FilterState = {
  search: '',
  priority: '',
  status: '',
  sort: 'created',
};
```

### Filter Logic (pure function)

```typescript
function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = tasks;

  // 1. Keyword search (AND with other filters)
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    );
  }

  // 2. Priority filter
  if (filters.priority) {
    result = result.filter(t => t.priority === filters.priority);
  }

  // 3. Status filter
  if (filters.status === 'pending') result = result.filter(t => !t.completed);
  if (filters.status === 'completed') result = result.filter(t => t.completed);

  // 4. Sort
  result = [...result].sort((a, b) => {
    if (filters.sort === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (filters.sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    }
    // default: created desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return result;
}
```

### API Contracts

No new API endpoints. Existing endpoint unchanged:

```
GET /api/{user_id}/tasks
→ Returns Task[] (all tasks for user)
   Each Task now includes: priority, tags, due_date (from feature 014)
```

### Component Architecture

```
dashboard/page.tsx  (Server Component or Client wrapper)
  └── FilterBar.tsx  [NEW — Client Component]
        props: filters: FilterState, onChange: (f: FilterState) => void
        renders: search <input>, priority <select>, status <select>, sort <select>, Clear btn
  └── TaskCardGrid.tsx  [MODIFY — receives already-filtered tasks]
        props: tasks: Task[]  (filtered list passed in, not raw list)
```

### FilterBar UI Design

```
[ 🔍 Search tasks...      ] [Priority ▼] [Status ▼] [Sort ▼] [Clear ×]
```

- Single row on desktop; wraps on mobile
- Tailwind: `flex flex-wrap gap-2 items-center`
- Clear button only visible when any filter is active (`filters !== DEFAULT_FILTER`)

## Complexity Tracking

No constitution violations. Feature is additive, frontend-only, zero new dependencies.

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| FilterBar state in Server Component | High | Make dashboard page or FilterBar a Client Component |
| TypeScript strict mode errors | Medium | Use proper type guards for priority/status unions |
| TaskCardGrid currently receives raw tasks from server | Low | Pass filtered list from parent; preserve existing props |
