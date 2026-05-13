// Server-only utility — signs an HS256 JWT compatible with the FastAPI backend.
//
// Better Auth's jwt() plugin issues EdDSA tokens (not HS256).
// The FastAPI backend verifies HS256 tokens signed with BETTER_AUTH_SECRET.
// This utility bridges the two by signing HS256 tokens with the same secret.

import { SignJWT } from "jose"

export async function signServerToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET!)
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)
}
