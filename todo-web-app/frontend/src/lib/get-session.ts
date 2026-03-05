// Deduplicated session getter using React's cache().
// Multiple calls within the same server request return the same Promise —
// the database is only queried once per page load regardless of how many
// Server Components call this function.
import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
