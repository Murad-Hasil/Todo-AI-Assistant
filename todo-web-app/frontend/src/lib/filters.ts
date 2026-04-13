// [Task]: T004 — Feature 015: Task Search & Filter
// Pure client-side filter + sort logic. No API calls.

import type { Task } from "@/lib/api"

export interface FilterState {
  search: string
  priority: '' | 'low' | 'medium' | 'high'
  status: '' | 'pending' | 'completed'
  sort: 'created' | 'due_date' | 'priority'
}

export const DEFAULT_FILTER: FilterState = {
  search: '',
  priority: '',
  status: '',
  sort: 'created',
}

export function isDefaultFilter(filters: FilterState): boolean {
  return (
    filters.search === DEFAULT_FILTER.search &&
    filters.priority === DEFAULT_FILTER.priority &&
    filters.status === DEFAULT_FILTER.status &&
    filters.sort === DEFAULT_FILTER.sort
  )
}

// [Task]: T005 — applyFilters pure function
// Applies search → priority → status filters (AND logic), then sorts.
export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = tasks

  // 1. Keyword search — case-insensitive substring match on title + description + tags
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? '').toLowerCase().includes(q),
    )
  }

  // 2. Priority filter
  if (filters.priority) {
    result = result.filter((t) => t.priority === filters.priority)
  }

  // 3. Status filter
  if (filters.status === 'pending') result = result.filter((t) => !t.completed)
  if (filters.status === 'completed') result = result.filter((t) => t.completed)

  // 4. Sort (always applied last on the filtered result)
  result = [...result].sort((a, b) => {
    if (filters.sort === 'due_date') {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (filters.sort === 'priority') {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
    }
    // default: created desc (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return result
}
