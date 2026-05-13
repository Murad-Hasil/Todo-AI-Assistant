// [Task]: T-2.3.6
// Route protection middleware — Edge Runtime compatible.
//
// Next.js middleware ALWAYS runs in the Edge Runtime, which has no Node.js APIs.
// auth.ts imports `pg` (uses crypto), so it CANNOT be imported here.
//
// Instead, we call the Better Auth session endpoint via betterFetch — this is
// Better Auth's official recommended middleware pattern for Next.js.
// The actual session validation (DB lookup) happens inside the Route Handler
// at /api/auth/[...all], which runs in the Node.js runtime.

import { betterFetch } from "@better-fetch/fetch"
import { NextRequest, NextResponse } from "next/server"

interface Session {
  user: { id: string; email: string; name?: string }
}

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  })

  const path = request.nextUrl.pathname

  // [Task]: T-3.4.5
  if (!session && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (
    session &&
    (path === "/sign-in" ||
      path === "/sign-up" ||
      path === "/login" ||
      path === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/login", "/register"],
}
