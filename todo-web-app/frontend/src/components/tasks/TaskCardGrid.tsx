"use client"
// [Task]: T-3.4.22
import { useState, useTransition, useRef, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Trash2, Check, Pencil, X, Save } from "lucide-react"
import type { Task } from "@/lib/api"
import { fadeInUp, staggerContainer, springTransition, reducedVariants } from "@/lib/animations"
import TaskPriorityBadge from "./TaskPriorityBadge"
import { cn } from "@/lib/utils"
import { toggleTaskAction, deleteTaskAction, updateTaskAction } from "@/app/dashboard/actions"

interface TaskCardGridProps {
  tasks: Task[]
  userId: string
}

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
      await updateTaskAction(userId, task.id, fd)
      setEditing(false)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave() }
    if (e.key === "Escape") handleEditCancel()
  }

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
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="mt-2">
              <TaskPriorityBadge priority="Normal" />
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

export default function TaskCardGrid({ tasks, userId }: TaskCardGridProps) {
  const shouldReduceMotion = useReducedMotion()
  const containerVariants = shouldReduceMotion ? {} : staggerContainer
  const cardVariants = shouldReduceMotion ? reducedVariants(fadeInUp) : fadeInUp

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40 text-sm">No tasks yet — add your first one above.</p>
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
