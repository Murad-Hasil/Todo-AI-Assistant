"use client"
// [Task]: T-2.3.4
// Client-side Better Auth instance with JWT client plugin.
// Use this in Client Components to sign in, sign up, sign out, and get the JWT token.

import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "",
  plugins: [jwtClient()],
})
