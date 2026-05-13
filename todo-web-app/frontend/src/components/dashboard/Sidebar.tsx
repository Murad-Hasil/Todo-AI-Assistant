"use client"
// [Task]: T-3.4.17
import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { CheckSquare, MessageCircle, Settings, LogOut, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { springTransition } from "@/lib/animations"
import SignOutButton from "@/components/SignOutButton"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onChatOpen: () => void
}

const navItems = [
  { label: "Tasks", href: "/dashboard", icon: CheckSquare },
  { label: "Settings", href: "/settings", icon: Settings },
]

function NavContent({
  onClose,
  onChatOpen,
}: {
  onClose: () => void
  onChatOpen: () => void
}) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-lg font-bold text-white">TodoAI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none",
              pathname === item.href
                ? "bg-indigo-600 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10",
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => {
            onChatOpen()
            onClose()
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
        >
          <MessageCircle className="w-4 h-4 flex-shrink-0" />
          AI Chat
        </button>
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-white/60">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, onChatOpen }: SidebarProps) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:left-0 md:top-0 md:h-full md:bg-[#0d0d1a] md:border-r md:border-white/10 md:z-30">
        <NavContent onClose={onClose} onChatOpen={onChatOpen} />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
              }
              onClick={onClose}
            />
            <motion.div
              className="fixed left-0 top-0 h-full w-72 bg-[#0d0d1a] border-r border-white/10 z-50 md:hidden flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={shouldReduceMotion ? { duration: 0 } : springTransition}
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="text-white/50 hover:text-white p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavContent onClose={onClose} onChatOpen={onChatOpen} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
