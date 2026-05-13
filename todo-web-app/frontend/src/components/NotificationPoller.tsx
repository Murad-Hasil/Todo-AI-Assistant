"use client"
// [Task]: T012, T013, T014, T015, T016 (016-browser-notifications)
/**
 * NotificationPoller — polls GET /api/{userId}/notifications every 10 s.
 * On new notifications:
 *   1. Fires a native OS browser notification (Web Notifications API — no new packages).
 *   2. Shows an in-app toast strip at the top of the viewport.
 * Marks all notifications as read after displaying them.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import {
  getNotifications,
  markNotificationsRead,
  type Notification,
} from "@/lib/api"

const POLL_INTERVAL_MS = 10_000

interface Props {
  userId: string
}

export default function NotificationPoller({ userId }: Props) {
  const [toasts, setToasts] = useState<Notification[]>([])
  const permissionRef = useRef<NotificationPermission>("default")

  // Request browser notification permission once on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "granted") {
      permissionRef.current = "granted"
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm
      })
    } else {
      permissionRef.current = "denied"
    }
  }, [])

  const fireNotifications = useCallback(
    async (notifications: Notification[]) => {
      if (notifications.length === 0) return

      // 1. Native OS browser notifications
      if (permissionRef.current === "granted") {
        for (const n of notifications) {
          new window.Notification("TodoAI Reminder", {
            body: n.message,
            icon: "/favicon.ico",
          })
        }
      }

      // 2. In-app toast strip — show newest first, auto-dismiss after 8 s
      setToasts((prev) => [...notifications, ...prev])
      setTimeout(() => {
        setToasts((prev) => prev.slice(notifications.length))
      }, 8_000)

      // 3. Mark as read so they don't repeat on next poll
      try {
        await markNotificationsRead(userId)
      } catch {
        // fire-and-forget: ignore mark-read errors
      }
    },
    [userId],
  )

  // Polling effect
  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const data = await getNotifications(userId)
        if (!cancelled && data.length > 0) {
          await fireNotifications(data)
        }
      } catch {
        // polling errors are silent — network hiccups should not break the UI
      }
    }

    poll() // immediate first poll on mount
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [userId, fireNotifications])

  if (toasts.length === 0) return null

  return (
    // [Task]: T014 — in-app toast strip (glass-style, top of viewport)
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-full"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#1a1a2e]/90 backdrop-blur-md px-4 py-3 shadow-lg text-white animate-in slide-in-from-right-4 duration-300"
        >
          {/* Bell icon */}
          <span className="mt-0.5 text-purple-400 shrink-0" aria-hidden>
            🔔
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-semibold truncate">TodoAI Reminder</p>
            <p className="text-xs text-white/70 line-clamp-2">{toast.message}</p>
          </div>
          {/* [Task]: T016 — dismiss button */}
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="ml-auto shrink-0 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
