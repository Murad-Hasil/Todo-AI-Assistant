# Implementation Plan: Phase 3.3 — Frontend Chat UI

**Branch**: `005-chatbot-db-mcp` | **Date**: 2026-03-04 | **Spec**: `ui-design.md` + `ui-logic.md`
**Input**: Phase 3.3 Frontend Chat UI specification

---

## Summary

Phase 3.3 embeds a dedicated side-panel Chat Window in the Dashboard, allowing users to manage tasks through natural language conversation with the AI agent. The implementation is **frontend-only** except for one required backend addition (history endpoint). All chat state is client-side; API calls route through `api.ts` via `fetchWithAuth`; task list refresh uses `router.refresh()`. No Phase 2 components are modified.

---

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode | Next.js 14 App Router
**Primary Dependencies**: React hooks (`useState`, `useEffect`, `useRef`, `useTransition`), `next/navigation` (`useRouter`, `useSearchParams`)
**Storage**: URL query param (`?conversation_id=<UUID>`) as authoritative store; React state as in-memory mirror
**Testing**: Playwright (E2E), React Testing Library (unit)
**Target Platform**: Browser — desktop (lg+) two-column, mobile single-column stacked
**Performance Goals**: Typing indicator visible within 100ms of send; auto-scroll within one animation frame
**Constraints**: No new CSS frameworks; Tailwind only. No new directories outside `frontend/components/` or `frontend/app/dashboard/`. No Phase 2 code changes beyond additive layout widening.
**Scale/Scope**: Single authenticated user per session; up to 100 messages in history fetch

---

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven | All code references `ui-design.md`/`ui-logic.md` FRs | ✅ PASS |
| II. Read-Before-Write | All existing files read before planning changes | ✅ PASS |
| III. Non-Destructive | Zero Phase 2 component modifications; layout change is additive | ✅ PASS |
| IV. API-First | All chat calls through `api.ts` `sendChat()` — no bare `fetch()` in components | ✅ PASS |
| V. Multi-User Isolation | `userId` from session; backend enforces ownership | ✅ PASS |
| VI. JWT Security | `fetchWithAuth` handles all auth; no token stored in component state | ✅ PASS |
| VII. Monorepo Pattern | New files in `frontend/components/` only — no new top-level dirs | ✅ PASS |
| VIII. Code Quality | TypeScript strict, no `any`, all async error paths handled | ✅ PASS |
| IX. Stateless AI Cycle | Frontend state is conversation UI only; AI cycle is stateless on backend | ✅ PASS |
| X. MCP Tool Enforcement | Frontend never calls MCP tools; only calls the chat HTTP endpoint | ✅ PASS |
| XI. Agent Behavior Contract | Tool status labels map tool names → user-facing strings per behavior.md | ✅ PASS |

---

## Project Structure

### Documentation (this feature)

```text
todo-web-app/specs/chatbot/
├── ui-design.md              # Phase 3.3 UI design spec (approved)
├── ui-logic.md               # Phase 3.3 logic/API spec (approved)
├── phase3-ui-plan.md         # This file
├── checklists/
│   └── phase3.3-requirements.md
└── [existing Phase 3.1/3.2 files unchanged]
```

### Source Code

```text
todo-web-app/frontend/src/
│
├── app/dashboard/
│   ├── layout.tsx             MODIFY — widen <main> max-w-3xl → max-w-5xl
│   └── page.tsx               MODIFY — add two-column grid, mount ChatPanel in <Suspense>
│
├── components/
│   ├── ChatPanel.tsx          NEW — Client Component; owns all chat state and effects
│   ├── ChatMessageBubble.tsx  NEW — Presentational; user/assistant bubble with RTL support
│   └── TypingIndicator.tsx    NEW — Animated dots + tool status label
│
└── lib/
    └── api.ts                 MODIFY — add sendChat() + getChatHistory() + 4 new interfaces

todo-web-app/backend/app/routes/
└── chat.py                    MODIFY — add GET /{user_id}/conversations/{id}/messages
```

---

## 1. Component Architecture: Dedicated Side Panel

### Decision: Two-Column Layout (Not Floating)

The existing `max-w-3xl` centered layout leaves no room for a right-aligned floating overlay without covering task content. The spec's preferred layout is the dedicated side panel (`ui-design.md`: "The preferred layout is a dedicated side panel").

**Implementation:**

- **Dashboard layout.tsx**: `<main>` widens from `max-w-3xl` to `max-w-5xl` (nav stays at `max-w-3xl`)
- **Dashboard page.tsx**: introduces `grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start`
  - Left: task management (AddTaskForm + FilterBar)
  - Right: `<Suspense fallback={null}><ChatPanel userId={userId} /></Suspense>`
- **Mobile** (below `lg`): single column — chat panel stacks below task list, full width
- The `<Suspense>` wrapper is **required** — `ChatPanel` uses `useSearchParams()` which triggers Next.js 14 Suspense boundary requirements

### Component Responsibilities

| Component | Type | Responsibility |
|-----------|------|---------------|
| `ChatPanel` | Client (`"use client"`) | State owner: messages, conversationId, isLoading, error, lastToolCalls. Orchestrates all effects and API calls |
| `ChatMessageBubble` | Client (stateless) | Renders a single message bubble with role-based styling and RTL detection applied |
| `TypingIndicator` | Client (stateless) | Animated three-dot indicator with context-sensitive tool status label |
| `dashboard/page.tsx` | Server | Mounts `ChatPanel` alongside task list; provides `userId` from session |

---

## 2. State Management

### TypeScript Types (defined in `ChatPanel.tsx`, not exported)

```typescript
interface ChatMessage {
  id: string                    // UUID from backend, or `opt-${Date.now()}` for optimistic
  role: "user" | "assistant"
  content: string
  isRTL: boolean                // Computed once on append via detectRTL(); never recomputed
  createdAt: string             // ISO 8601
}

interface ConversationState {
  conversationId: string | null // UUID string; null = no active conversation
  messages: ChatMessage[]
  isLoading: boolean            // true while POST /chat is in-flight
  lastToolCalls: string[]       // tool_calls from most recent response (for TypingIndicator)
  error: string | null          // inline error text; null = no error
}
```

### State Initialization

```typescript
const searchParams = useSearchParams()
const urlConversationId = searchParams.get("conversation_id")

const [state, setState] = useState<ConversationState>({
  conversationId: urlConversationId,  // Read URL on first render
  messages: [],
  isLoading: false,
  lastToolCalls: [],
  error: null,
})
```

### `conversation_id` URL Sync

- **Read**: from `useSearchParams().get("conversation_id")` on mount
- **Write**: `router.replace(`/dashboard?conversation_id=${id}`, { scroll: false })` after first response
- **Clear**: `router.replace("/dashboard", { scroll: false })` on 404 reset
- Uses `router.replace` (not `push`) — avoids polluting browser history per spec

---

## 3. Data Fetching & API Interaction

### 3.1 New `api.ts` Additions

**New interfaces** (append to types section of `api.ts`):

```typescript
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
```

**`sendChat` function** (uses `fetchWithAuth` — auto-attaches JWT):

```typescript
export async function sendChat(
  userId: string,
  message: string,
  conversationId?: string,
): Promise<ChatSendResponse> {
  const body: ChatSendRequest = { message }
  if (conversationId) body.conversation_id = conversationId

  const res = await fetchWithAuth(`/api/${userId}/chat`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  return res.json()
}
```

**`getChatHistory` function** (uses `fetchWithAuth`):

```typescript
export async function getChatHistory(
  userId: string,
  conversationId: string,
): Promise<ChatHistoryResponse> {
  const res = await fetchWithAuth(
    `/api/${userId}/conversations/${conversationId}/messages`,
  )
  return res.json()
}
```

Error mapping inherits from existing `handleErrorStatus`:
- `401` → redirect to `/sign-in?reason=session_expired`
- `403` → `ForbiddenError`
- `404` → `NotFoundError` (conversation not found)
- `422` → `ValidationError`
- `503` → `ServerError(503)` (caught by `status >= 500` branch)
- Network failure → `NetworkError`

### 3.2 History Fetch Strategy (Mount Effect)

```typescript
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

      const hydrated = data.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        isRTL: detectRTL(m.content),
        createdAt: m.created_at,
      }))

      setState((prev) => ({ ...prev, messages: hydrated }))
    } catch (err) {
      if (cancelled) return

      if (err instanceof NotFoundError) {
        // Conversation deleted — clear and start fresh
        setState((prev) => ({ ...prev, conversationId: null, messages: [] }))
        router.replace("/dashboard", { scroll: false })
      }
      // ServerError / NetworkError / endpoint-missing: fall through silently
      // Keep conversationId so subsequent sends still thread via backend DB
    } finally {
      if (!cancelled) setHistoryLoaded(true)
    }
  }

  fetchHistory()
  return () => { cancelled = true }
}, []) // empty deps — mount only; cancelled flag prevents stale updates
```

**Graceful degradation when history endpoint is absent**: The frontend renders an empty chat window. The `conversationId` is retained — new messages still thread because the backend fetches its own history from PostgreSQL on every `POST /chat`.

### 3.3 Revalidation: `router.refresh()` After Write Tool Calls

```typescript
const WRITE_TOOLS = new Set(["add_task", "complete_task", "delete_task", "update_task"])

// After successful sendChat response:
if (data.tool_calls.some((t) => WRITE_TOOLS.has(t))) {
  router.refresh()  // Re-runs DashboardPage Server Component (re-fetches tasks)
}
```

**Why `router.refresh()` over `revalidatePath`:** The send flow executes in a Client Component — `revalidatePath` requires `"use server"` context. `router.refresh()` is the correct App Router primitive for client-triggered Server Component re-fetches. It does not navigate or scroll.

---

## 4. UI/UX Enhancements

### 4.1 Auto-Scroll Implementation

Three effects, each serving a distinct scroll trigger:

```typescript
const bottomRef = useRef<HTMLDivElement>(null)

// After messages array changes (new message appended)
useEffect(() => {
  if (!historyLoaded) return
  bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [state.messages, historyLoaded])

// After history load completes — jump to bottom instantly (no distracting scroll)
useEffect(() => {
  if (historyLoaded) {
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }
}, [historyLoaded])

// When typing indicator appears
useEffect(() => {
  if (state.isLoading) {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }
}, [state.isLoading])
```

**JSX scroll anchor** (placed at the end of the message list):
```tsx
<div ref={bottomRef} aria-hidden="true" />
```

### 4.2 Tailwind Styling — "Modern AI" Aesthetic

The design follows Phase 2's established token palette (`blue-600`, `gray-100`, `white`, `gray-50`) with rounded bubble corners:

```tsx
// ChatMessageBubble: User bubble (right-aligned)
className="bg-blue-600 text-white rounded-2xl rounded-br-sm max-w-[75%] px-4 py-2.5 text-sm"

// ChatMessageBubble: Assistant bubble (left-aligned)
className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm max-w-[75%] px-4 py-2.5 text-sm"

// ChatPanel container
className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-8rem)] lg:sticky lg:top-8 min-h-[400px]"
```

`lg:sticky lg:top-8` keeps the chat panel in the viewport as the user scrolls the task list — a zero-JS sidebar pattern.

### 4.3 Urdu RTL Support

**Detection function** (defined once in `ChatPanel.tsx`):

```typescript
const ARABIC_REGEX = /[\u0600-\u06FF]/g

function detectRTL(text: string): boolean {
  if (!text) return false
  const matches = text.match(ARABIC_REGEX)
  if (!matches) return false
  return matches.length / text.length > 0.1  // >10% Arabic chars → RTL
}
```

**Applied in `ChatMessageBubble`:**

```tsx
<div
  dir={message.isRTL ? "rtl" : "ltr"}
  className={`... ${message.isRTL ? "text-right" : "text-left"} ...`}
>
  {message.content}
</div>
```

Using the `dir` HTML attribute (not just CSS `direction`) ensures the browser's bidirectional text algorithm applies correctly, including punctuation placement and mixed-script text.

**Roman Urdu** (Latin script) is always LTR — `detectRTL` returns `false` for ASCII-only text.

### 4.4 Input Accessibility

- `<textarea>` (not `<input>`) — supports Shift+Enter for newline
- `aria-label="Message the AI assistant"` on textarea
- `aria-label="Send message"` on icon-only Send button
- `role="log"` + `aria-live="polite"` on message list — screen readers announce new messages
- `{inputText.length}/2000` character count feedback
- `Enter` sends; `Shift+Enter` inserts newline

---

## 5. Tool Call Visualization

### `TypingIndicator` Component

```typescript
// Tool → status label mapping
const WRITE_TOOLS = new Set(["add_task", "update_task", "delete_task", "complete_task"])
const READ_TOOLS  = new Set(["list_tasks"])

function getStatusLabel(toolCalls: string[]): string {
  if (toolCalls.length === 0)                            return "Thinking…"
  if (toolCalls.some((t) => WRITE_TOOLS.has(t)))         return "Updating Tasks…"
  if (toolCalls.some((t) => READ_TOOLS.has(t)))          return "Fetching Tasks…"
  return "Thinking…"
}
```

**Animated dots** (pure Tailwind — no CSS additions):

```tsx
<div className="flex items-start gap-2">
  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
    <span className="flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
    </span>
    <span className="text-xs text-gray-500">{getStatusLabel(lastToolCalls)}</span>
  </div>
</div>
```

**Timing**: `lastToolCalls` reflects the **previous** response's tools. While in-flight, the label predicts what the next call will likely do based on what the last call did. This is accurate for conversational flows and requires no backend streaming.

---

## 6. Required Backend Addition

**File**: `todo-web-app/backend/app/routes/chat.py`
**Action**: Add one new route

```python
@router.get("/{user_id}/conversations/{conversation_id}/messages")
def get_conversation_messages(
    user_id: str,
    conversation_id: uuid.UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """Fetch message history for a conversation. JWT-protected."""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    conv = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    return {
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }
```

**Scope**: ~25 lines. Uses existing `Message`, `Conversation` models, `get_current_user_id` dependency, and `get_session` dependency — zero new imports beyond what `chat.py` already has.

---

## 7. Implementation Sequencing

```
Step 1: api.ts additions (independent — no component deps)
        Add ChatSendRequest, ChatSendResponse, ChatHistoryMessage, ChatHistoryResponse types
        Add sendChat(), getChatHistory() functions

Step 2: ChatMessageBubble.tsx (depends on ChatMessage type from Step 1)
        Pure presentational; no state

Step 3: TypingIndicator.tsx (depends on nothing)
        Pure presentational; receives lastToolCalls: string[]

Step 4: ChatPanel.tsx (depends on Steps 1, 2, 3)
        Full state management, effects, send flow, error handling

Step 5: dashboard/page.tsx modification (depends on Step 4)
        Add grid layout, import ChatPanel in Suspense

Step 6: dashboard/layout.tsx modification (depends on Step 5)
        max-w-3xl → max-w-5xl in <main> only

Step 7: Backend GET /conversations/{id}/messages (parallel to Steps 1-6)
        Frontend degrades gracefully without this; add for full history support
```

---

## 8. Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `router.refresh()` task re-fetch latency perceptible | Medium | Backend Neon latency is ~50ms; acceptable for Phase 3.3. Optimistic local task update available as Phase 3.4 enhancement if needed |
| `useSearchParams()` Suspense boundary required | Low | Accounted for — `ChatPanel` wrapped in `<Suspense fallback={null}>` in `page.tsx` |
| Backend history endpoint absent | Medium | Frontend degrades gracefully (empty window, thread continues via backend DB). Backend addition is tracked as Step 7 |
| `animate-bounce [animation-delay:...]` arbitrary Tailwind values require JIT | Low | Next.js 14 uses Tailwind JIT by default; arbitrary values work out of the box |

---

## 9. Acceptance Criteria Mapping

| Spec Criterion | Implementation |
|---------------|---------------|
| AC-1: NL command → task in list after AI confirms | `sendChat()` → `router.refresh()` on write `tool_calls` |
| AC-2: Chat history persists after page refresh | `conversation_id` in URL; `getChatHistory()` on mount |
| AC-3: UI follows Phase 2 Tailwind patterns | Same `blue-600`, `gray-100`, `rounded-xl`, `shadow-sm` tokens throughout |
