// [Task]: T-3.4.21
// Supports both legacy display values ("Low","Normal","High","Urgent")
// and backend API values ("low","medium","high").
import { cn } from "@/lib/utils"

type PriorityDisplay = "Low" | "Normal" | "High" | "Urgent"

const colors: Record<PriorityDisplay, string> = {
  Low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Normal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Urgent: "bg-red-500/20 text-red-300 border-red-500/30",
}

// Map backend API values → display labels
const apiToDisplay: Record<string, PriorityDisplay> = {
  low: "Low",
  medium: "Normal",
  high: "High",
}

function resolveDisplay(priority: string): PriorityDisplay {
  // Already a display value
  if (["Low", "Normal", "High", "Urgent"].includes(priority)) {
    return priority as PriorityDisplay
  }
  // Backend API value
  return apiToDisplay[priority] ?? "Normal"
}

export default function TaskPriorityBadge({
  priority = "Normal",
}: {
  priority?: string
}) {
  const display = resolveDisplay(priority)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        colors[display],
      )}
    >
      {display}
    </span>
  )
}
