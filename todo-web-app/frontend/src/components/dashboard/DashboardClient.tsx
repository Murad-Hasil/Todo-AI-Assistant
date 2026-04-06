"use client"
// [Task]: T007 — Feature 015: Task Search & Filter
// DashboardClient — Client Component wrapper that owns FilterState.
// dashboard/page.tsx (Server Component) fetches tasks → passes raw list here.
// Applies applyFilters() before rendering TaskCardGrid.

import { useState } from "react"
import type { Task } from "@/lib/api"
import { type FilterState, DEFAULT_FILTER, applyFilters } from "@/lib/filters"
import FilterBar from "@/components/FilterBar"
import TaskCardGrid from "@/components/tasks/TaskCardGrid"

interface DashboardClientProps {
  tasks: Task[]
  userId: string
}

export default function DashboardClient({ tasks, userId }: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER)

  const filteredTasks = applyFilters(tasks, filters)

  return (
    <>
      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>
      <TaskCardGrid tasks={filteredTasks} userId={userId} filters={filters} />
    </>
  )
}
