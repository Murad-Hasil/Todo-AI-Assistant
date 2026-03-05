"use client"
// [Task]: T-3.4.18
import { useState, Suspense } from "react"
import { Menu } from "lucide-react"
import Sidebar from "./Sidebar"
import ChatDrawer from "@/components/chat/ChatDrawer"

interface DashboardShellProps {
  userId: string
  children: React.ReactNode
}

export default function DashboardShell({ userId, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onChatOpen={() => setChatOpen(true)}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-4 px-4 h-14 bg-[#0d0d1a] border-b border-white/10 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold">TodoAI</span>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Chat Drawer — rendered at shell level, above content */}
      <Suspense fallback={null}>
        <ChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userId={userId}
        />
      </Suspense>
    </div>
  )
}
