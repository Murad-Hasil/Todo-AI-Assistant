# Tasks: Task Search & Filter (015)

**Input**: Design documents from `/specs/015-task-search-filter/`
**Prerequisites**: spec.md ✅ plan.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Frontend-only feature. All filtering is client-side. No backend changes needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Read Existing Code)

**Purpose**: Understand current component structure before any modification.

- [x] T001 Read `todo-web-app/frontend/src/app/dashboard/page.tsx` to understand how tasks are fetched and passed to components
- [x] T002 [P] Read `todo-web-app/frontend/src/components/tasks/TaskCardGrid.tsx` to understand current props and task rendering
- [x] T003 [P] Read `todo-web-app/frontend/src/lib/api.ts` to confirm Task interface has priority, tags, due_date fields (from feature 014)

**Checkpoint**: Current structure understood — component boundaries clear before modification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the `FilterBar` component and `applyFilters` utility — shared by all user stories.

**⚠️ CRITICAL**: All user story phases depend on this foundation.

- [x] T004 Create `FilterState` type and `DEFAULT_FILTER` constant in `todo-web-app/frontend/src/lib/filters.ts`:
  ```typescript
  export interface FilterState {
    search: string;
    priority: '' | 'low' | 'medium' | 'high';
    status: '' | 'pending' | 'completed';
    sort: 'created' | 'due_date' | 'priority';
  }
  export const DEFAULT_FILTER: FilterState = { search: '', priority: '', status: '', sort: 'created' };
  ```

- [x] T005 Create `applyFilters(tasks: Task[], filters: FilterState): Task[]` pure function in `todo-web-app/frontend/src/lib/filters.ts` — implements AND logic for search + priority + status + sort (see plan.md for logic)

- [x] T006 Create `FilterBar` client component at `todo-web-app/frontend/src/components/FilterBar.tsx`:
  - Props: `filters: FilterState`, `onChange: (f: FilterState) => void`
  - Renders: search `<input>`, priority `<select>`, status `<select>`, sort `<select>`, Clear button
  - Clear button only visible when `filters !== DEFAULT_FILTER`
  - Tailwind styling: `flex flex-wrap gap-2 items-center`
  - `"use client"` directive

- [x] T007 Update `todo-web-app/frontend/src/app/dashboard/page.tsx` to:
  - Import `FilterBar`, `FilterState`, `DEFAULT_FILTER`, `applyFilters`
  - Add `useState<FilterState>(DEFAULT_FILTER)` (requires making dashboard a client component OR extracting a `DashboardClient.tsx` wrapper)
  - Apply `applyFilters(tasks, filters)` before passing tasks to `TaskCardGrid`
  - Render `<FilterBar filters={filters} onChange={setFilters} />` above `TaskCardGrid`

**Checkpoint**: FilterBar renders, applyFilters runs — all 4 user stories now implementable

---

## Phase 3: User Story 1 — Keyword Search (Priority: P1) 🎯 MVP

**Goal**: User types in search box → task list instantly narrows by title/description match.

**Independent Test**: Type "meeting" → only matching tasks shown. Clear → all tasks return. Type "zzz" → empty state message shown.

- [x] T008 [US1] Verify `applyFilters` search logic in `todo-web-app/frontend/src/lib/filters.ts` correctly implements case-insensitive substring match on `title` and `description`

- [x] T009 [US1] Verify `FilterBar.tsx` search `<input>` is wired: `value={filters.search}` + `onChange={e => onChange({...filters, search: e.target.value})}` with placeholder "Search tasks..."

- [x] T010 [US1] Add empty state to `todo-web-app/frontend/src/components/tasks/TaskCardGrid.tsx`: when `tasks.length === 0` and filters are active, show "No tasks match your filters" message with a hint to clear filters

**Checkpoint**: US1 complete — keyword search works end-to-end

---

## Phase 4: User Story 2 — Filter by Priority (Priority: P2)

**Goal**: User selects "High" from priority dropdown → only high-priority tasks shown.

**Independent Test**: Select "High" → only `priority="high"` tasks visible. Select "All" → full list returns.

- [x] T011 [US2] Verify `applyFilters` priority logic in `todo-web-app/frontend/src/lib/filters.ts`: `filters.priority !== ''` → `task.priority === filters.priority`

- [x] T012 [US2] Verify `FilterBar.tsx` priority `<select>` is wired with options: All (`""`), High (`"high"`), Medium (`"medium"`), Low (`"low"`)

**Checkpoint**: US2 complete — priority filter works, combinable with keyword search

---

## Phase 5: User Story 3 — Filter by Status (Priority: P2)

**Goal**: User selects "Pending" → only incomplete tasks shown. "Completed" → only done tasks.

**Independent Test**: Select "Pending" → no completed tasks visible. Select "Completed" → no incomplete tasks visible.

- [x] T013 [US3] Verify `applyFilters` status logic in `todo-web-app/frontend/src/lib/filters.ts`: `pending` → `!task.completed`; `completed` → `task.completed`

- [x] T014 [US3] Verify `FilterBar.tsx` status `<select>` has options: All (`""`), Pending (`"pending"`), Completed (`"completed"`)

**Checkpoint**: US3 complete — status filter works, all 3 filters combinable with AND logic

---

## Phase 6: User Story 4 — Sort by Due Date / Priority (Priority: P3)

**Goal**: User sorts by "Due Date" → tasks ordered earliest-first (nulls last); "Priority" → high→medium→low.

**Independent Test**: Sort "Due Date" → tasks with due_date appear before tasks without. Sort "Priority" → high tasks first.

- [x] T015 [US4] Verify `applyFilters` sort logic in `todo-web-app/frontend/src/lib/filters.ts`:
  - `due_date`: sort by `new Date(due_date).getTime()`, nulls last
  - `priority`: `{ high: 0, medium: 1, low: 2 }` order
  - `created`: `new Date(created_at)` desc (newest first, default)

- [x] T016 [US4] Verify `FilterBar.tsx` sort `<select>` has options: Newest First (`"created"`), Due Date (`"due_date"`), Priority (`"priority"`)

**Checkpoint**: US4 complete — all 4 user stories functional and combinable

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T017 [P] Run `npx tsc --noEmit` in `todo-web-app/frontend/` — fix any TypeScript errors (strict mode, 0 errors required)
- [x] T018 [P] Verify Clear button in `FilterBar.tsx` resets all filters to `DEFAULT_FILTER` and is hidden when no filters active
- [x] T019 [P] Verify `FilterBar` is responsive — wraps cleanly on mobile viewport (`flex-wrap`)
- [ ] T020 Run E2E smoke test: create 3 tasks with different priorities/titles → search + filter + sort all work in combination

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Read existing code)
  └─► Phase 2 (Create FilterState + FilterBar + applyFilters + wire dashboard)
        └─► Phase 3 (US1: keyword search) ─┐
        └─► Phase 4 (US2: priority filter)  ├─ All can run in parallel after Phase 2
        └─► Phase 5 (US3: status filter)   ─┤
        └─► Phase 6 (US4: sort)            ─┘
              └─► Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depends On | Independently Testable |
|-------|-----------|------------------------|
| US1 (Keyword Search) | Phase 2 complete | ✅ Search box works alone |
| US2 (Priority Filter) | Phase 2 complete | ✅ Priority dropdown works alone |
| US3 (Status Filter) | Phase 2 complete | ✅ Status dropdown works alone |
| US4 (Sort) | Phase 2 complete | ✅ Sort select works alone |

### Parallel Opportunities

- **Phase 1**: T002 + T003 can run in parallel (different files)
- **Phase 2**: T004 + T005 (filters.ts) → T006 (FilterBar.tsx) → T007 (dashboard)
- **Phase 3–6**: All user story phases can be implemented in parallel after Phase 2
- **Phase 7**: T017 + T018 + T019 can run in parallel

---

## Implementation Strategy

### MVP First (US1 Only — Keyword Search)
1. Complete Phase 1 (read existing code)
2. Complete Phase 2 (create FilterState + FilterBar + applyFilters + wire dashboard)
3. Complete Phase 3 (US1 — keyword search)
4. **STOP and VALIDATE**: Search "meeting" → correct tasks shown
5. Deploy/demo

### Incremental Delivery
1. Phase 2 → FilterBar visible with search only → US1 works
2. Phase 4 → Priority dropdown wired → US2 works
3. Phase 5 → Status dropdown wired → US3 works
4. Phase 6 → Sort selector wired → US4 works
5. Phase 7 → Polish + deploy

---

## Notes

- All filtering is client-side — no API changes required
- `applyFilters` is a pure function — easy to verify in isolation
- If dashboard `page.tsx` is currently a Server Component, extract a `DashboardClient.tsx` wrapper to hold `useState` — common Next.js App Router pattern
- Commit after each phase checkpoint
