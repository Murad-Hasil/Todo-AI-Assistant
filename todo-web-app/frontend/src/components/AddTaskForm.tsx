"use client"
// [Task]: T-2.3.9
// AddTaskForm — Client Component. Controlled form to create a new task.
// Validates title before submit. Clears form on success. Shows loading state.

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { createTaskAction } from "@/app/dashboard/actions"

interface AddTaskFormProps {
  userId: string
}

export default function AddTaskForm({ userId }: AddTaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set("title", title.trim())
      fd.set("description", description)

      const result = await createTaskAction(userId, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setTitle("")
        setDescription("")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6"
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Add new task</h2>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          placeholder="Task title (required)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="text"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          <Plus size={16} />
          {isPending ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  )
}
