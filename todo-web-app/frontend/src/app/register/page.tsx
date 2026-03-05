"use client"
// [Task]: T-3.4.13
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { authClient } from "@/lib/auth-client"
import { fadeInUp, easeTransition, reducedVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const variants = shouldReduceMotion ? reducedVariants(fadeInUp) : fadeInUp

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    general?: string
  }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!email) errs.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Password is required"
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters"
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await authClient.signUp.email({ name, email, password })
      if (result.error) {
        setErrors({
          general:
            result.error.message ?? "Could not create account. Please try again.",
        })
      } else {
        router.push("/dashboard")
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg-auth min-h-screen flex items-center justify-center px-4">
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={shouldReduceMotion ? { duration: 0 } : easeTransition}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            TodoAI
          </Link>
          <p className="text-white/50 text-sm mt-2">Create your account</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white/80 mb-1.5"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                  errors.name ? "border-red-500/50" : "border-white/10",
                )}
                placeholder="Your name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                  errors.email ? "border-red-500/50" : "border-white/10",
                )}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                  errors.password ? "border-red-500/50" : "border-white/10",
                )}
                placeholder="Minimum 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
