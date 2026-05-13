"use client"
// [Task]: T-3.4.22
import { useState, useTransition, useRef, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Trash2, Check, Pencil, X, Save } from "lucide-react"
import type { Task, TaskPriority } from "@/lib/api"
import { type FilterState, isDefaultFilter } from "@/lib/filters"
import { fadeInUp, staggerContainer, springTransition, reducedVariants } from "@/lib/animations"
import TaskPriorityBadge from "./TaskPriorityBadge"
import { cn } from "@/lib/utils"
import { toggleTaskAction, deleteTaskAction, updateTaskAction } from "@/app/dashboard/actions"

interface TaskCardGridProps {
  tasks: Task[]
  userId: string
  filters?: FilterState
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function DueDateLabel({ dueDate, completed }: { dueDate: string | null | undefined; completed: boolean }) {
  if (!dueDate) return null
  const date = new Date(dueDate)
  const overdue = !completed && date < new Date()
  return (
    <span className={cn("text-xs", overdue ? "text-red-400" : "text-white/40")}>
      Due: {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </span>
  )
}

function TagPills({ tags }: { tags: string | null | undefined }) {
  if (!tags) return null
  const list = tags.split(",").map((t) => t.trim()).filter(Boolean)
  if (list.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/50"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  userId,
  shouldReduceMotion,
  cardVariants,
}: {
  task: Task
  userId: string
  shouldReduceMotion: boolean | null
  cardVariants: typeof fadeInUp
}) {
  const [isPendingToggle, startToggle] = useTransition()
  const [isPendingDelete, startDelete] = useTransition()
  const [isPendingUpdate, startUpdate] = useTransition()

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description ?? "")
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority ?? "medium")
  const [editTags, setEditTags] = useState(task.tags ?? "")
  const [editDueDate, setEditDueDate] = useState(
    task.due_date ? task.due_date.slice(0, 16) : "", // trim to "YYYY-MM-DDTHH:MM"
  )
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Focus the title input when edit mode opens
  useEffect(() => {
    if (editing) titleInputRef.current?.focus()
  }, [editing])

  function handleToggle() {
    startToggle(async () => {
      await toggleTaskAction(userId, task.id)
    })
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteTaskAction(userId, task.id)
    })
  }

  function handleEditOpen() {
    setEditTitle(task.title)
    setEditDescription(task.description ?? "")
    setEditPriority(task.priority ?? "medium")
    setEditTags(task.tags ?? "")
    setEditDueDate(task.due_date ? task.due_date.slice(0, 16) : "")
    setEditing(true)
  }

  function handleEditCancel() {
    setEditing(false)
  }

  function handleEditSave() {
    if (!editTitle.trim()) return
    startUpdate(async () => {
      const fd = new FormData()
      fd.set("title", editTitle.trim())
      fd.set("description", editDescription.trim())
      fd.set("priority", editPriority)
      fd.set("tags", editTags.trim())
      fd.set("due_date", editDueDate)
      await updateTaskAction(userId, task.id, fd)
      setEditing(false)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave() }
    if (e.key === "Escape") handleEditCancel()
  }

  const sharedInputClass =
    "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const smallInputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"

  const isBusy = isPendingToggle || isPendingDelete || isPendingUpdate

  return (
    <motion.div
      variants={cardVariants}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      layout
      transition={shouldReduceMotion ? { duration: 0 } : springTransition}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 transition-colors",
        !editing && "hover:bg-white/[0.07]",
        isBusy && "opacity-60",
        task.completed && !editing && "opacity-50",
      )}
    >
      {/* Completion toggle — hidden while editing */}
      {!editing && (
        <button
          onClick={handleToggle}
          disabled={isBusy}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
          className={cn(
            "mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none disabled:cursor-not-allowed",
            task.completed
              ? "bg-indigo-600 border-indigo-600"
              : "border-white/30 hover:border-indigo-400",
          )}
        >
          {task.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
      )}

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {editing ? (
          /* ── Edit mode ── */
          <div className="space-y-2">
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title"
              className={sharedInputClass}
            />
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Description (optional)"
              className={smallInputClass}
            />
            {/* Priority + Tags row */}
            <div className="flex gap-2">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Priority"
              >
                <option value="low" className="text-gray-900">Low</option>
                <option value="medium" className="text-gray-900">Medium</option>
                <option value="high" className="text-gray-900">High</option>
              </select>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags: work, home"
                className={cn(smallInputClass, "flex-1")}
                aria-label="Tags"
              />
            </div>
            {/* Due date */}
            <input
              type="datetime-local"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className={smallInputClass}
              aria-label="Due date"
            />
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleEditSave}
                disabled={!editTitle.trim() || isPendingUpdate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
              >
                <Save className="w-3 h-3" />
                {isPendingUpdate ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleEditCancel}
                disabled={isPendingUpdate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/10 px-3 py-1 text-xs font-medium text-white/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            <p className={cn(
              "text-sm font-medium text-white truncate",
              task.completed && "line-through text-white/40",
            )}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{task.description}</p>
            )}
            <TagPills tags={task.tags} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TaskPriorityBadge priority={task.priority} />
              <DueDateLabel dueDate={task.due_date} completed={task.completed} />
            </div>
          </>
        )}
      </div>

      {/* Action buttons — view mode only */}
      {!editing && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleEditOpen}
            disabled={isBusy || task.completed}
            aria-label="Edit task"
            className="text-white/30 hover:text-indigo-400 transition-colors p-1 rounded focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isBusy}
            aria-label="Delete task"
            className="text-white/30 hover:text-red-400 transition-colors p-1 rounded focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── TaskCardGrid ──────────────────────────────────────────────────────────────

export default function TaskCardGrid({ tasks, userId, filters }: TaskCardGridProps) {
  const shouldReduceMotion = useReducedMotion()
  const containerVariants = shouldReduceMotion ? {} : staggerContainer
  const cardVariants = shouldReduceMotion ? reducedVariants(fadeInUp) : fadeInUp

  if (tasks.length === 0) {
    const filtersActive = filters && !isDefaultFilter(filters)
    return (
      <div className="text-center py-16">
        {filtersActive ? (
          <>
            <p className="text-white/40 text-sm">No tasks match your filters.</p>
            <p className="text-white/25 text-xs mt-1">Try adjusting or clearing your filters.</p>
          </>
        ) : (
          <p className="text-white/40 text-sm">No tasks yet — add your first one above.</p>
        )}
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            userId={userId}
            shouldReduceMotion={shouldReduceMotion}
            cardVariants={cardVariants}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
