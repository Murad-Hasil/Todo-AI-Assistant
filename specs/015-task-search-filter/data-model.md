# Data Model: Task Search & Filter (015)

**Date**: 2026-04-07

## Client-Side FilterState

No database changes. No new API endpoints. Purely client-side state.

```typescript
// FilterState — lives in FilterBar component
interface FilterState {
  search: string;                              // '' = no filter
  priority: '' | 'low' | 'medium' | 'high';  // '' = All priorities
  status: '' | 'pending' | 'completed';       // '' = All statuses
  sort: 'created' | 'due_date' | 'priority'; // default: 'created' (newest first)
}
```

## Existing Task Entity (no changes)

```typescript
// Already defined in src/lib/api.ts (updated in feature 014)
interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}
```

## State Transitions

```
Initial: DEFAULT_FILTER = { search: '', priority: '', status: '', sort: 'created' }
  ↓ user types in search box
Active search: { search: 'meeting', ... }
  ↓ user selects priority
Active search + priority: { search: 'meeting', priority: 'high', ... }
  ↓ user clicks Clear
Reset: DEFAULT_FILTER (all filters cleared)
```

## Filter Logic Contract

- Filters are applied in sequence: search → priority → status → sort
- All active filters use AND logic (task must pass ALL filters)
- Sort is always applied last on the filtered result
