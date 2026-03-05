"use server"
// [Task]: T-2.3.10
// Server Actions for task mutations. Each action:
// 1. Gets the session to identify the user
// 2. Signs an HS256 token with signServerToken (compatible with FastAPI backend)
// 3. Calls the backend using fetchWithToken (explicit Bearer token)
// 4. Calls revalidatePath("/dashboard") so the Server Component refreshes

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { fetchWithToken } from "@/lib/api"
import { signServerToken } from "@/lib/server-token"

async function getToken(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")
  return signServerToken(session.user.id)
}

export async function createTaskAction(userId: string, formData: FormData) {
  const title = formData.get("title") as string
  const description = (formData.get("description") as string) || undefined

  if (!title?.trim()) return { error: "Title is required." }

  try {
    const token = await getToken()
    const res = await fetchWithToken(`/api/${userId}/tasks`, token, {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), description }),
    })
    await res.json()
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message ?? "Failed to create task." }
  }
}

export async function deleteTaskAction(userId: string, taskId: string) {
  try {
    const token = await getToken()
    await fetchWithToken(`/api/${userId}/tasks/${taskId}`, token, {
      method: "DELETE",
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message ?? "Failed to delete task." }
  }
}

export async function toggleTaskAction(userId: string, taskId: string) {
  try {
    const token = await getToken()
    const res = await fetchWithToken(
      `/api/${userId}/tasks/${taskId}/complete`,
      token,
      { method: "PATCH" },
    )
    const data = await res.json()
    revalidatePath("/dashboard")
    return { success: true, data: data.data }
  } catch (err) {
    return { error: (err as Error).message ?? "Failed to toggle task." }
  }
}

export async function updateTaskAction(
  userId: string,
  taskId: string,
  formData: FormData,
) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string | null

  if (!title?.trim()) return { error: "Title is required." }

  try {
    const token = await getToken()
    const res = await fetchWithToken(`/api/${userId}/tasks/${taskId}`, token, {
      method: "PUT",
      body: JSON.stringify({ title: title.trim(), description: description ?? null }),
    })
    const data = await res.json()
    revalidatePath("/dashboard")
    return { success: true, data: data.data }
  } catch (err) {
    return { error: (err as Error).message ?? "Failed to update task." }
  }
}
