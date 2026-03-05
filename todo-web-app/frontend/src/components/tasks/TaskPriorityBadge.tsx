// [Task]: T-3.4.21
import { cn } from "@/lib/utils"

type Priority = "Low" | "Normal" | "High" | "Urgent"

const colors: Record<Priority, string> = {
  Low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Normal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Urgent: "bg-red-500/20 text-red-300 border-red-500/30",
}

export default function TaskPriorityBadge({
  priority = "Normal",
}: {
  priority?: string
}) {
  const p = (
    ["Low", "Normal", "High", "Urgent"].includes(priority) ? priority : "Normal"
  ) as Priority
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        colors[p],
      )}
    >
      {p}
    </span>
  )
}
