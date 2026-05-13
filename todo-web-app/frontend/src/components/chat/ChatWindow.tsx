"use client"
// [Task]: T-3.3.1 — Component structure
// [Task]: T-3.3.2 — Styling & layout (side panel, sticky, Tailwind)
// [Task]: T-3.3.3 — Message state management (messages, conversationId, isProcessing)
// [Task]: T-3.3.4 — Message history loader (fetch on mount via getChatHistory)
// [Task]: T-3.3.5 — Chat API integration (sendChat from api.ts)
// [Task]: T-3.3.6 — Auto-scroll (useRef + three useEffect hooks)
// [Task]: T-3.3.7 — Multi-language / RTL rendering (detectRTL utility)
// [Task]: T-3.3.8 — Task list revalidation (router.refresh() on write tool_calls)
//
// ChatWindow — Main chat Client Component.
// Owns all conversation state: messages, conversationId, isLoading, error.
// Fetches history on mount. Sends messages via api.ts. Triggers task list
// refresh when the AI performs a write tool call (add/complete/delete/update).
// Syncs conversationId to URL query param for persistence across reloads.

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  sendChat,
  getChatHistory,
  NotFoundError,
  ServerError,
  NetworkError,
  ForbiddenError,
  RateLimitError,
} from "@/lib/api"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isRTL: boolean         // Computed once at creation; never recomputed on render
  createdAt: string      // ISO 8601
}

interface ConversationState {
  conversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  lastToolCalls: string[]  // Tool calls from PREVIOUS response — used for status label
  error: string | null
}

// ─── RTL Detection ────────────────────────────────────────────────────────────
// [Task]: T-3.3.7

const ARABIC_REGEX = /[\u0600-\u06FF]/g

/**
 * Returns true if >10% of characters are Arabic/Urdu script (U+0600–U+06FF).
 * Roman Urdu (Latin script) correctly returns false.
 * Spec reference: ui-design.md "RTL Detection Heuristic"
 */
function detectRTL(text: string): boolean {
  if (!text || text.length === 0) return false
  const matches = text.match(ARABIC_REGEX)
  if (!matches) return false
  return matches.length / text.length > 0.1
}

// ─── Tool Status Label ────────────────────────────────────────────────────────
// [Task]: T-3.3.6

const WRITE_TOOLS = new Set(["add_task", "complete_task", "delete_task", "update_task"])
const READ_TOOLS = new Set(["list_tasks"])

function getStatusLabel(toolCalls: string[]): string {
  if (toolCalls.length === 0) return "Thinking…"
  if (toolCalls.some((t) => WRITE_TOOLS.has(t))) return "Updating Tasks…"
  if (toolCalls.some((t) => READ_TOOLS.has(t))) return "Fetching Tasks…"
  return "Thinking…"
}

// ─── Error Mapping ────────────────────────────────────────────────────────────

function toErrorMessage(err: unknown): string {
  if (err instanceof ForbiddenError) return "Access denied."
  if (err instanceof NetworkError)
    return "Unable to reach server. Check your connection."
  if (err instanceof RateLimitError)
    return "Too many requests. Please wait a moment and try again."
  if (err instanceof ServerError && (err as ServerError).status === 503)
    return "AI service unavailable. Please try again."
  if (err instanceof ServerError) return "Something went wrong. Please try again."
  return "Something went wrong. Please try again."
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
// [Task]: T-3.3.6

function TypingIndicator({ lastToolCalls }: { lastToolCalls: string[] }) {
  return (
    <div className="flex items-start gap-2">
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
        </span>
        <span className="text-xs text-slate-500">{getStatusLabel(lastToolCalls)}</span>
      </div>
    </div>
  )
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────

interface ChatWindowProps {
  userId: string
}

export default function ChatWindow({ userId }: ChatWindowProps) {
  // [Task]: T-3.3.3 — State management
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlConversationId = searchParams.get("conversation_id")

  const [inputText, setInputText] = useState("")
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [state, setState] = useState<ConversationState>({
    conversationId: urlConversationId,  // Authoritative store is URL; this mirrors it
    messages: [],
    isLoading: false,
    lastToolCalls: [],
    error: null,
  })

  // [Task]: T-3.3.6 — Auto-scroll sentinel ref
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── T014: History fetch on mount ─────────────────────────────────────────
  // [Task]: T-3.3.4
  useEffect(() => {
    if (!urlConversationId) {
      setHistoryLoaded(true)
      return
    }

    let cancelled = false

    async function fetchHistory() {
      try {
        const data = await getChatHistory(userId, urlConversationId!)
        if (cancelled) return

        const hydrated: ChatMessage[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          isRTL: detectRTL(m.content), // [Task]: T-3.3.7
          createdAt: m.created_at,
        }))

        setState((prev) => ({ ...prev, messages: hydrated }))
      } catch (err) {
        if (cancelled) return

        if (err instanceof NotFoundError) {
          // Conversation deleted or invalid — reset to fresh state
          setState((prev) => ({ ...prev, conversationId: null, messages: [] }))
          router.replace("/dashboard", { scroll: false })
          return
        }
        // ServerError / NetworkError / endpoint-missing: fall through silently.
        // Keep conversationId so thread continues via backend DB history.
      } finally {
        if (!cancelled) setHistoryLoaded(true)
      }
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — mount-only

  // ── T017: Auto-scroll effects ─────────────────────────────────────────────
  // [Task]: T-3.3.6

  // After history loads — jump to bottom instantly (no distracting scroll animation)
  useEffect(() => {
    if (historyLoaded) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior })
    }
  }, [historyLoaded])

  // After new messages append — smooth scroll
  useEffect(() => {
    if (!historyLoaded) return
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.messages, historyLoaded])

  // When typing indicator appears — scroll to show it
  useEffect(() => {
    if (state.isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [state.isLoading])

  // ── T010: Send message handler ────────────────────────────────────────────
  // [Task]: T-3.3.5

  async function handleSend() {
    const text = inputText.trim()
    if (!text || state.isLoading) return

    // Optimistic: append user bubble immediately
    // [Task]: T-3.3.7 — isRTL computed at creation
    const optimisticUserMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      role: "user",
      content: text,
      isRTL: detectRTL(text),
      createdAt: new Date().toISOString(),
    }

    setInputText("")
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticUserMsg],
      isLoading: true,
      error: null,
    }))

    try {
      const data = await sendChat(userId, text, state.conversationId ?? undefined)

      // [Task]: T-3.3.7 — isRTL computed on assistant response
      const assistantMsg: ChatMessage = {
        id: `${data.conversation_id}-${Date.now()}`,
        role: "assistant",
        content: data.response,
        isRTL: detectRTL(data.response),
        createdAt: new Date().toISOString(),
      }

      // [Task]: T-3.3.3 / T016: Sync conversationId to URL on first response
      const isFirstMessage = !state.conversationId
      const newConvId = data.conversation_id

      setState((prev) => ({
        ...prev,
        conversationId: newConvId,
        messages: [...prev.messages, assistantMsg],
        isLoading: false,
        lastToolCalls: data.tool_calls,
        error: null,
      }))

      if (isFirstMessage) {
        router.replace(`/dashboard?conversation_id=${newConvId}`, { scroll: false })
      }

      // [Task]: T-3.3.8 — Refresh task list when AI performs a write operation
      if (Array.isArray(data.tool_calls) && data.tool_calls.some((t) => WRITE_TOOLS.has(t))) {
        router.refresh()
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        // Conversation became stale — reset and prompt user to resend
        setState((prev) => ({
          ...prev,
          conversationId: null,
          isLoading: false,
          error: "Conversation expired. Please resend your message.",
        }))
        router.replace("/dashboard", { scroll: false })
        return
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: toErrorMessage(err),
      }))
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    // [Task]: T-3.3.2 — Side panel styling; sticky on desktop
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-8rem)] lg:sticky lg:top-8 min-h-[400px]">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">AI Assistant</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Ask me to add, view, or manage your tasks
        </p>
      </div>

      {/* Message list */}
      {/* [Task]: T-3.3.6 / T023 — ARIA: role="log" + aria-live="polite" */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {/* Empty state */}
        {state.messages.length === 0 && !state.isLoading && historyLoaded && (
          <p className="text-center text-gray-400 text-sm py-8 px-4">
            Ask me anything — &quot;Add buy milk&quot;, &quot;Show pending tasks&quot;, and more.
          </p>
        )}

        {/* T007 / T021: Message bubbles */}
        {state.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* T008 / T018: Typing indicator while in-flight */}
        {state.isLoading && (
          <TypingIndicator lastToolCalls={state.lastToolCalls} />
        )}

        {/* T017: Auto-scroll sentinel */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* T022: Inline error banner */}
      {state.error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex-shrink-0">
          {state.error}
        </div>
      )}

      {/* T011: Chat input */}
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        isLoading={state.isLoading}
        disabled={!historyLoaded}
      />
    </div>
  )
}
