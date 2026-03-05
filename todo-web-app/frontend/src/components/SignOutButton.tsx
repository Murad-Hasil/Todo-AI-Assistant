"use client"
// [Task]: T-2.3.7
// SignOutButton — signs out the current user via Better Auth and redirects to /sign-in.

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors min-h-[44px]"
    >
      Sign out
    </button>
  )
}
