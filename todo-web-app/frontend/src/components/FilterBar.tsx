"use client"
// [Task]: T-2.3.8
// FilterBar — Client Component. Provides "All" / "Pending" / "Completed" tab filtering.
// Filters the already-fetched tasks array client-side — no API round-trip on filter change.

import { useState } from "react"
import { Task } from "@/lib/api"
import TaskList from "@/components/TaskList"

type FilterType = "all" | "pending" | "completed"

interface FilterBarProps {
  tasks: Task[]
  userId: string
}

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
]

export default function FilterBar({ tasks, userId }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "pending") return !task.completed
    if (activeFilter === "completed") return task.completed
    return true
  })

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors min-h-[36px] ${
              activeFilter === value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {value !== "all" && (
              <span className="ml-1.5 text-xs text-gray-400">
                (
                {value === "pending"
                  ? tasks.filter((t) => !t.completed).length
                  : tasks.filter((t) => t.completed).length}
                )
              </span>
            )}
          </button>
        ))}
      </div>
      <TaskList tasks={filteredTasks} userId={userId} />
    </div>
  )
}
