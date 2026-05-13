"use client"
// [Task]: T-3.4.6
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function GlassNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-md bg-black/60 border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          TodoAI
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Get Started
          </Link>
        </div>
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-4 flex flex-col gap-4">
          <Link
            href="/#features"
            className="text-sm text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white text-center"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
