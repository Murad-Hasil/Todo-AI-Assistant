// Server-side API route — issues an HS256 JWT for client-side backend calls.
//
// Better Auth's jwt() plugin issues EdDSA tokens which the FastAPI backend
// cannot verify (backend expects HS256 signed with BETTER_AUTH_SECRET).
// This route bridges the gap: gets the Better Auth session, then signs
// a fresh HS256 token using the same signServerToken utility used by
// Server Components and Server Actions.

import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { signServerToken } from "@/lib/server-token"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const token = await signServerToken(session.user.id)
  return NextResponse.json({ token })
}
