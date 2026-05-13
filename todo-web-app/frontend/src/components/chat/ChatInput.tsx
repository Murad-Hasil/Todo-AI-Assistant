"use client"
// [Task]: T-3.3.1
// [Task]: T-3.3.2
// ChatInput — Form component for message input and send action.
// Disables send when input is empty or when isLoading is true (T-3.3.5).
// Enter to send; Shift+Enter for newline.

import { Send } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  disabled: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  disabled,
}: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled

  return (
    // [Task]: T-3.3.2 — Tailwind styling consistent with Phase 2 form inputs
    <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
      <div className="flex gap-2 items-end">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={2000}
          disabled={disabled}
          aria-label="Message the AI assistant"
          placeholder="Ask me anything about your tasks…"
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px]"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">
        {value.length}/2000 · Enter to send, Shift+Enter for newline
      </p>
    </div>
  )
}
