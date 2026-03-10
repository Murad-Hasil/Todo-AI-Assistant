// [Task]: T-2.3.3
// Centralized typed API client for the FastAPI backend.
// All task CRUD operations go through this module.
// Automatically attaches the Bearer JWT token from Better Auth to every request.


// ─── TypeScript Types ────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface TaskCreateInput {
  title: string
  description?: string
}

export interface TaskUpdateInput {
  title: string
  description?: string | null
}

export interface TaskListResponse {
  data: Task[]
  meta: { total: number }
}

export interface TaskSingleResponse {
  data: Task
}

export type StatusFilter = "all" | "pending" | "completed"
export type SortOrder = "created" | "title" | "due_date"

export interface TaskListParams {
  status?: StatusFilter
  sort?: SortOrder
}

// ─── Chat Types (Phase 3.3) ──────────────────────────────────────────────────
// [Task]: T-3.3.5

export interface ChatSendRequest {
  message: string
  conversation_id?: string        // UUID string; omit to start new conversation
}

export interface ChatSendResponse {
  conversation_id: string         // UUID string
  response: string
  tool_calls: string[]
}

export interface ChatHistoryMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string              // ISO 8601
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[]
}

// ─── Custom Error Types ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ForbiddenError extends ApiError {
  constructor() {
    super("Forbidden", 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends ApiError {
  constructor(taskId?: string) {
    super(taskId ? `Task ${taskId} not found` : "Not found", 404)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends ApiError {
  constructor(public detail: unknown) {
    super("Validation error", 422)
    this.name = "ValidationError"
  }
}

export class ServerError extends ApiError {
  constructor(status: number) {
    super("Server error", status)
    this.name = "ServerError"
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super("Rate limit exceeded", 429)
    this.name = "RateLimitError"
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("Network error — unable to reach server")
    this.name = "NetworkError"
    this.cause = cause
  }
}

// ─── Core Fetch Wrappers ──────────────────────────────────────────────────────

// Server-side (SSR): use BACKEND_URL (in-cluster); Client-side: use NEXT_PUBLIC_API_URL
const BASE_URL =
  (typeof window === "undefined" ? process.env.BACKEND_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"

function handleErrorStatus(response: Response, taskId?: string): void {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in?reason=session_expired"
    }
    throw new ApiError("Unauthorized", 401)
  }
  if (response.status === 403) throw new ForbiddenError()
  if (response.status === 404) throw new NotFoundError(taskId)
  if (response.status === 422) throw new ValidationError(null)
  if (response.status === 429) throw new RateLimitError()
  if (response.status >= 500) throw new ServerError(response.status)
}

// Client-side: gets an HS256 JWT from the /api/token route.
// authClient.token() issues EdDSA tokens that the FastAPI backend cannot verify.
// /api/token issues HS256 tokens using signServerToken — same as server-side calls.
async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let token: string | null = null
  try {
    const res = await fetch("/api/token")
    if (res.ok) {
      const data = await res.json()
      token = data.token ?? null
    }
  } catch {
    // not signed in — 401 handled below
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch (cause) {
    throw new NetworkError(cause)
  }

  handleErrorStatus(response)
  return response
}

// Server-side: accepts an explicit Bearer token (from auth.api.getToken on server)
export async function fetchWithToken(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch (cause) {
    throw new NetworkError(cause)
  }

  handleErrorStatus(response)
  return response
}

// ─── Typed API Functions ──────────────────────────────────────────────────────

export async function getTasks(
  userId: string,
  params?: TaskListParams,
): Promise<TaskListResponse> {
  const query = new URLSearchParams()
  if (params?.status && params.status !== "all") {
    query.set("status", params.status)
  }
  if (params?.sort) {
    query.set("sort", params.sort)
  }
  const qs = query.toString() ? `?${query.toString()}` : ""
  const res = await fetchWithAuth(`/api/${userId}/tasks${qs}`)
  return res.json()
}

export async function createTask(
  userId: string,
  input: TaskCreateInput,
): Promise<TaskSingleResponse> {
  const res = await fetchWithAuth(`/api/${userId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  return res.json()
}

export async function getTask(
  userId: string,
  taskId: string,
): Promise<TaskSingleResponse> {
  const res = await fetchWithAuth(`/api/${userId}/tasks/${taskId}`)
  return res.json()
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: TaskUpdateInput,
): Promise<TaskSingleResponse> {
  const res = await fetchWithAuth(`/api/${userId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return res.json()
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await fetchWithAuth(`/api/${userId}/tasks/${taskId}`, {
    method: "DELETE",
  })
}

export async function toggleTask(
  userId: string,
  taskId: string,
): Promise<TaskSingleResponse> {
  const res = await fetchWithAuth(`/api/${userId}/tasks/${taskId}/complete`, {
    method: "PATCH",
  })
  return res.json()
}

// ─── Chat API Functions (Phase 3.3) ──────────────────────────────────────────
// [Task]: T-3.3.5

export async function sendChat(
  userId: string,
  message: string,
  conversationId?: string,
): Promise<ChatSendResponse> {
  // [Task]: T-3.3.5
  const body: ChatSendRequest = { message }
  if (conversationId) body.conversation_id = conversationId

  const res = await fetchWithAuth(`/api/${userId}/chat`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  return res.json()
}

// [Task]: T-3.3.4
export async function getChatHistory(
  userId: string,
  conversationId: string,
): Promise<ChatHistoryResponse> {
  const res = await fetchWithAuth(
    `/api/${userId}/conversations/${conversationId}/messages`,
  )
  return res.json()
}
