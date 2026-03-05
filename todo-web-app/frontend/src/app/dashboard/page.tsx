// [Task]: T-3.4.23
import { redirect } from "next/navigation"
import { getSession } from "@/lib/get-session"
import { fetchWithToken, type Task } from "@/lib/api"
import { signServerToken } from "@/lib/server-token"
import AddTaskForm from "@/components/AddTaskForm"
import TaskCardGrid from "@/components/tasks/TaskCardGrid"

export default async function DashboardPage() {
  // getSession() is deduplicated via React cache — shares the result already
  // fetched by dashboard/layout.tsx in the same request; no second DB round-trip.
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = session.user.id
  let tasks: Task[] = []
  let fetchError: string | null = null

  try {
    const token = await signServerToken(userId)
    const res = await fetchWithToken(`/api/${userId}/tasks`, token)
    const data = await res.json()
    tasks = data.data ?? []
  } catch {
    fetchError = "Unable to reach server. Please try again later."
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user.name ?? session.user.email}
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {tasks.length === 0 && !fetchError
            ? "No tasks yet — add your first one below."
            : `${tasks.filter((t) => !t.completed).length} of ${tasks.length} tasks pending`}
        </p>
      </div>

      <div className="mb-6">
        <AddTaskForm userId={userId} />
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
          {fetchError}
        </div>
      ) : (
        <TaskCardGrid tasks={tasks} userId={userId} />
      )}
    </div>
  )
}
