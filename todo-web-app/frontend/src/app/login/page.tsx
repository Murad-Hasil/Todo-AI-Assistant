"use client"
// [Task]: T-3.4.12
// LoginPage wraps LoginForm in Suspense because LoginForm uses useSearchParams().
// This satisfies Next.js requirement for CSR bailout boundaries.
import { Suspense } from "react"
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mesh-bg-auth min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-8 mx-auto w-24" />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-64" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
