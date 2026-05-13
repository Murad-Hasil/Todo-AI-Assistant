"use client"
// [Task]: T-3.3.1
// [Task]: T-3.3.7
// MessageBubble — Presentational component for a single chat message.
// Renders User and Assistant bubbles with distinct styles.
// Applies dir="rtl" and text-right when message.isRTL is true (Urdu/Arabic script).

import type { ChatMessage } from "./ChatWindow"

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    // [Task]: T-3.3.1 — Role-based alignment
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        // [Task]: T-3.3.7 — RTL support: dir attribute for bidirectional text algorithm
        dir={message.isRTL ? "rtl" : "ltr"}
        className={[
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
          message.isRTL ? "text-right" : "text-left",
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  )
}
