"use client"
// [Task]: T-2.3.8
// TaskItem — Client Component. Displays a single task with toggle, delete, and inline edit.
// Uses lucide-react icons (Pencil, Trash2, Check, X) for action buttons.

import { useState, useTransition } from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Task } from "@/lib/api"
import {
  toggleTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/app/dashboard/actions"

interface TaskItemProps {
  task: Task
  userId: string
}

export default function TaskItem({ task, userId }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description ?? "")
  const [isPendingToggle, startToggle] = useTransition()
  const [isPendingDelete, startDelete] = useTransition()
  const [isPendingSave, startSave] = useTransition()

  const createdDate = new Date(task.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

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

  function handleSave() {
    if (!editTitle.trim()) return
    startSave(async () => {
      const fd = new FormData()
      fd.set("title", editTitle.trim())
      fd.set("description", editDescription)
      await updateTaskAction(userId, task.id, fd)
      setEditing(false)
    })
  }

  function handleCancelEdit() {
    setEditTitle(task.title)
    setEditDescription(task.description ?? "")
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="Task title"
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          placeholder="Description (optional)"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPendingSave || !editTitle.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            <Check size={14} />
            {isPendingSave ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isPendingSave}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm flex items-start gap-3 transition-opacity ${
        isPendingDelete ? "opacity-50" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isPendingToggle || isPendingDelete}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors min-h-[20px] min-w-[20px] ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-green-400"
        } disabled:cursor-not-allowed`}
      >
        {task.completed && <Check size={11} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            task.completed ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{task.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{createdDate}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          disabled={isPendingToggle || isPendingDelete}
          aria-label="Edit task"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPendingDelete || isPendingToggle}
          aria-label="Delete task"
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
