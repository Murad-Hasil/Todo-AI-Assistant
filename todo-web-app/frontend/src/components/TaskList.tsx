// [Task]: T-2.3.8
// TaskList — Server Component. Renders a list of TaskItem components from props.
// Shows an empty state message when there are no tasks.

import { Task } from "@/lib/api"
import TaskItem from "@/components/TaskItem"

interface TaskListProps {
  tasks: Task[]
  userId: string
}

export default function TaskList({ tasks, userId }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        No tasks yet. Add one above.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} userId={userId} />
        </li>
      ))}
    </ul>
  )
}
