// [Task]: T-2.3.4
// Server-side Better Auth instance with JWT plugin and PostgreSQL adapter.
// This file is server-only — never import from Client Components.

import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  plugins: [jwt()],
  emailAndPassword: { enabled: true },
})
