// Migration script — creates Better Auth tables in Neon PostgreSQL
// Run: node scripts/migrate.mjs
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = join(__dirname, "../.env.local")
const envContent = readFileSync(envPath, "utf-8")
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const [key, ...rest] = trimmed.split("=")
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim()
}

const { betterAuth } = await import("better-auth")
const { jwt } = await import("better-auth/plugins")
const { Pool } = await import("pg")
const { getMigrations } = await import("better-auth/db/migration")

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  plugins: [jwt()],
  emailAndPassword: { enabled: true },
})

console.log("Running Better Auth migrations…")
const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options)

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("✓ Database is up to date — no migrations needed.")
  process.exit(0)
}

console.log("Tables to create:", toBeCreated.map(t => t.table))
console.log("Fields to add:", toBeAdded.map(t => `${t.table}: ${Object.keys(t.fields).join(", ")}`))

await runMigrations()
console.log("✓ Migrations complete.")
process.exit(0)
