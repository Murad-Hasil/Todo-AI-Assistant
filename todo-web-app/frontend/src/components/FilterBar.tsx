"use client"
// [Task]: T006 — Feature 015: Task Search & Filter
// FilterBar — renders search input + 3 filter dropdowns + Clear button.
// Props-driven: parent owns FilterState; this component is purely presentational.

import { type FilterState, DEFAULT_FILTER, isDefaultFilter } from "@/lib/filters"

interface FilterBarProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasActiveFilter = !isDefaultFilter(filters)

  function handleClear() {
    onChange({ ...DEFAULT_FILTER })
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search input — US1 */}
      <input
        type="search"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search by title, description, or tags..."
        aria-label="Search by title, description, or tags"
        className="flex-1 min-w-[180px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Priority filter — US2 */}
      <select
        value={filters.priority}
        onChange={(e) =>
          onChange({ ...filters, priority: e.target.value as FilterState['priority'] })
        }
        aria-label="Filter by priority"
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:text-gray-900"
      >
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status filter — US3 */}
      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as FilterState['status'] })
        }
        aria-label="Filter by status"
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:text-gray-900"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      {/* Sort — US4 */}
      <select
        value={filters.sort}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value as FilterState['sort'] })
        }
        aria-label="Sort tasks"
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:text-gray-900"
      >
        <option value="created">Newest First</option>
        <option value="due_date">Due Date</option>
        <option value="priority">Priority</option>
      </select>

      {/* Clear button — only shown when any filter is active */}
      {hasActiveFilter && (
        <button
          onClick={handleClear}
          aria-label="Clear all filters"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Clear ×
        </button>
      )}
    </div>
  )
}
