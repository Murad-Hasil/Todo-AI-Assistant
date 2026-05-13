"use client"
// [Task]: T-3.4.20
import { Suspense } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import { springTransition } from "@/lib/animations"
import ChatWindow from "./ChatWindow"

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function ChatDrawer({ isOpen, onClose, userId }: ChatDrawerProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop backdrop (subtle) */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40 hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
            }
            onClick={onClose}
          />
          {/* Mobile backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
            }
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 bg-[#0d0d1a] border-l border-white/10 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={shouldReduceMotion ? { duration: 0 } : springTransition}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Ask me to manage your tasks
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/*
              ChatWindow has its own h-[calc(100vh-8rem)] styling.
              We use [&>div] Tailwind variant to override ChatWindow's outer div
              without touching ChatWindow.tsx (READ-ONLY).
            */}
            <div className="flex-1 overflow-hidden [&>div]:h-full [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
              <Suspense
                fallback={
                  <div className="p-4 text-white/40 text-sm">Loading chat…</div>
                }
              >
                <ChatWindow userId={userId} />
              </Suspense>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
