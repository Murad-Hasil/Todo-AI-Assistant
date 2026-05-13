// [Task]: T-2.3.4
// Better Auth catch-all route handler for Next.js App Router.
// Handles all /api/auth/* requests (sign-in, sign-up, token, etc.)

import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth.handler)
