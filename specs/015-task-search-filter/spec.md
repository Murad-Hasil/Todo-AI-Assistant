# Feature Specification: Task Search & Filter

**Feature Branch**: `015-task-search-filter`
**Created**: 2026-04-07
**Status**: Draft
**Input**: User description: "Search and Filter tasks by keyword, priority, status, and due date — Intermediate Level feature for Phase V Part A"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Keyword Search (Priority: P1)

A user has many tasks and wants to quickly find a specific one by typing part of its title or description. They type in a search box and the task list instantly narrows to matching tasks.

**Why this priority**: Most immediate productivity gain — users with 10+ tasks need this before anything else.

**Independent Test**: Type "meeting" in the search box → only tasks containing "meeting" in title or description appear. Delivers value as a standalone feature.

**Acceptance Scenarios**:

1. **Given** a user has tasks "Team meeting", "Buy groceries", "Prepare meeting notes", **When** they type "meeting" in the search box, **Then** only "Team meeting" and "Prepare meeting notes" are shown.
2. **Given** a search term is active, **When** the user clears the search box, **Then** all tasks reappear.
3. **Given** a search term matches nothing, **When** the user types "zzz", **Then** an empty state message "No tasks found" is shown.

---

### User Story 2 — Filter by Priority (Priority: P2)

A user wants to see only their high-priority tasks so they can focus on urgent work. They select "High" from a priority filter and the list updates immediately.

**Why this priority**: Directly builds on the priority field added in feature 014. High value with low implementation cost.

**Independent Test**: Select "High" from priority filter → only tasks with priority="high" appear. Can be demonstrated independently.

**Acceptance Scenarios**:

1. **Given** tasks with mixed priorities, **When** user selects "High" filter, **Then** only high-priority tasks are shown.
2. **Given** priority filter is active, **When** user selects "All" / clears filter, **Then** all tasks reappear.
3. **Given** no tasks match the selected priority, **Then** empty state "No tasks found" is shown.

---

### User Story 3 — Filter by Status (Priority: P2)

A user wants to see only pending tasks or only completed tasks. They use a status filter to toggle between views.

**Why this priority**: Status filtering already exists at the API level — this is a UI enhancement with near-zero backend cost.

**Independent Test**: Select "Pending" → only incomplete tasks shown. Select "Completed" → only done tasks shown.

**Acceptance Scenarios**:

1. **Given** mixed tasks, **When** user selects "Pending", **Then** only incomplete tasks show.
2. **Given** mixed tasks, **When** user selects "Completed", **Then** only completed tasks show.
3. **Given** "All" selected, **Then** all tasks regardless of status are shown.

---

### User Story 4 — Sort by Due Date / Priority (Priority: P3)

A user wants to sort their task list so the most urgent tasks appear at the top.

**Why this priority**: Useful but lower urgency than search/filter. Read-only operation, no data changes.

**Independent Test**: Select "Sort by Due Date" → tasks with earliest due_date appear first; tasks without due_date appear last.

**Acceptance Scenarios**:

1. **Given** tasks with varying due_dates, **When** user sorts by "Due Date", **Then** tasks are ordered earliest-first; null due_dates go last.
2. **Given** user sorts by "Priority", **Then** high → medium → low order is applied.
3. **Given** user sorts by "Created", **Then** newest tasks appear first (default behavior restored).

---

### Edge Cases

- Search with special characters (apostrophe, hyphen) must not crash.
- Combining search + priority filter + status filter simultaneously must work (AND logic).
- Empty task list with active filters shows a clear "No tasks match your filters" message.
- Filters are ephemeral — reset on page refresh (no URL persistence needed).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a text input that filters tasks by keyword match in title or description (case-insensitive, client-side).
- **FR-002**: System MUST provide a priority dropdown filter with options: All, High, Medium, Low.
- **FR-003**: System MUST provide a status dropdown filter with options: All, Pending, Completed.
- **FR-004**: System MUST provide a sort selector with options: Created (default), Due Date, Priority.
- **FR-005**: All filters and sort MUST work together simultaneously (AND logic for filters).
- **FR-006**: Keyword search MUST be performed client-side for instant response (no additional API calls).
- **FR-007**: Filter/sort state MUST be applied reactively — task list updates without page reload.
- **FR-008**: An empty state message MUST be shown when no tasks match active filters.
- **FR-009**: A "Clear filters" reset mechanism MUST be provided to return to default view.

### Key Entities

- **Task**: Existing entity — search/filter operates on the already-fetched task list (client-side filtering).
- **FilterState**: Client-side state `{ search: string, priority: string, status: string, sort: string }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find a task by keyword instantly (client-side, no loading state visible).
- **SC-002**: Combining all 3 filters simultaneously produces correct AND-logic results with no visible lag.
- **SC-003**: Empty state is clearly communicated — user never sees a blank list without explanation.
- **SC-004**: Filter controls are visible without scrolling on standard desktop viewports.
- **SC-005**: TypeScript type check passes with 0 errors after implementation.

## Assumptions

- Filtering is client-side only (tasks already loaded in dashboard). No new API endpoints needed for basic search/filter.
- Filter state is ephemeral — page refresh resets all filters.
- Search matches title AND description (case-insensitive substring).
- Sort "Due Date": tasks without due_date appear last.
- Sort "Priority" order: high → medium → low.
- The existing API status filter is already functional; this adds the missing UI controls.
