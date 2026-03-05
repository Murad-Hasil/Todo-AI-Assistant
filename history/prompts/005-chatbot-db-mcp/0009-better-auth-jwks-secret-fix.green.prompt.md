---
id: "0009"
title: Better Auth JWKS Secret Fix
stage: green
date: 2026-03-03
surface: agent
model: claude-sonnet-4-6
feature: 005-chatbot-db-mcp
branch: 005-chatbot-db-mcp
user: brownie
command: fix better-auth secret key JWKS error
labels: ["better-auth","jwks","debugging","secret","database"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - (no files changed — database fix only)
tests:
  - curl http://localhost:8000/health → {"status":"ok","version":"3.2.0"}
  - curl http://localhost:3000/ → HTTP 307 (redirect, no BetterAuthError)
---

## Prompt

Mujhe frontend terminal pe error mil rahe hai better uth secret key mai ne change kar dia tha warning mil rahe the our login main masla ho raha tha. mai ne apne pas se dono terminal close kar diye hai ap fronetend backend run kar ke sai kar do ye masla our pir terminal close kar do mai local pe apne pas run kar ke test karoga.

[BetterAuthError: Failed to decrypt private key. Make sure the secret currently in use is the same as the one used to encrypt the private key. If you are using a different secret, either clean up your JWKS or disable private key encryption.]

## Response snapshot

Root cause: Better Auth's `jwt()` plugin stores private keys encrypted with `BETTER_AUTH_SECRET` in the `jwks` table. When secret was changed, the old encrypted record could no longer be decrypted.

Fix:
1. Verified both frontend `.env.local` and backend `.env` have same secret (`mR9v2KzL5xN8pQ4wS7hJ1fG6tB3dM0cX`)
2. Used Python + psycopg2 to connect to Neon PostgreSQL and `DELETE FROM jwks;` (1 record removed)
3. Started backend → HTTP 200 `{"status":"ok","version":"3.2.0"}`
4. Started frontend → HTTP 307 redirect, **no BetterAuthError**
5. Stopped both servers

Better Auth auto-generates new JWKS on next startup, encrypted with current secret.

## Outcome

- ✅ Impact: BetterAuthError eliminated; login flow restored
- 🧪 Tests: Backend health check 200 OK, Frontend 307 redirect (expected)
- 📁 Files: No files changed — pure database fix (DELETE FROM jwks)
- 🔁 Next prompts: User to test login locally
- 🧠 Reflection: When BETTER_AUTH_SECRET changes, always run `DELETE FROM jwks;` — Better Auth regenerates keys on startup

## Evaluation notes (flywheel)

- Failure modes observed: Secret rotation without JWKS cleanup causes 500 on every page load
- Graders run and results (PASS/FAIL): Manual — PASS
- Prompt variant (if applicable): null
- Next experiment: Could add a migration script or README note about secret rotation procedure
