# Implementation Plan: Frontend Professionalism Polish

**Feature**: `012-frontend-professionalism`
**Date**: 2026-03-11
**Stack**: Next.js 16.1.6 (App Router), TypeScript, Tailwind CSS
**Scope**: Frontend only — `todo-web-app/frontend/`

---

## Architecture Overview

Three independent, zero-dependency changes to the Next.js App Router frontend. No backend changes. No new packages. Each change is a single file.

```
src/app/
├── layout.tsx          ← ADD: alternates.canonical
├── manifest.ts         ← CREATE: PWA Web App Manifest
└── not-found.tsx       ← CREATE: Branded 404 page
```

---

## Change 1 — PWA Manifest (`app/manifest.ts`)

**File**: `src/app/manifest.ts`
**Next.js convention**: File-based manifest — Next.js auto-serves at `/manifest.webmanifest` and injects `<link rel="manifest">` into `<head>`.

**Required fields:**
```ts
{
  name: "TodoAI Evolution",
  short_name: "TodoAI",
  description: "Enterprise AI task management — Event-Driven & Cloud Native",
  start_url: "/",
  display: "standalone",       // hides browser chrome on launch
  background_color: "#0f172a", // splash screen bg
  theme_color: "#0f172a",      // matches metadata themeColor
  icons: [
    { src: "/icon", sizes: "32x32", type: "image/png" },
    { src: "/apple-icon", sizes: "180x180", type: "image/png" }
  ]
}
```

**Why `standalone`**: Removes browser address bar when launched from home screen — feels like a native app.

---

## Change 2 — Custom 404 (`app/not-found.tsx`)

**File**: `src/app/not-found.tsx`
**Next.js convention**: `not-found.tsx` in `app/` root is automatically used for all unmatched routes.

**Design spec:**
- Background: `#0f172a` (matches dark theme)
- Centered layout: robot emoji or ASCII robot icon, "404" large text, "Page not found" subtitle, "Go Home" button
- "Go Home" button: styled as a Tailwind primary button → links to `/`
- No new components — self-contained Server Component
- Must NOT be a Client Component (no `"use client"`) — it's a pure Server Component

**Visual layout:**
```
[full viewport, dark bg #0f172a]

        🤖
       404
  Page not found
  The route you're looking for doesn't exist.

  [ ← Go Home ]
```

---

## Change 3 — Canonical URL (`app/layout.tsx`)

**File**: `src/app/layout.tsx`
**Change**: Add `alternates.canonical` to the existing Metadata object.

```ts
alternates: {
  canonical: siteUrl,  // "https://murad-hasil-todo-ai.vercel.app"
}
```

**Why**: Next.js renders this as `<link rel="canonical" href="...">` in every page's `<head>`. Single line change.

---

## File Summary

| File | Action | Lines changed |
|------|--------|---------------|
| `src/app/manifest.ts` | Create | ~20 |
| `src/app/not-found.tsx` | Create | ~50 |
| `src/app/layout.tsx` | Edit — add `alternates.canonical` | +3 |

---

## Deployment

- Commit to `main`
- Push to GitHub
- `npx vercel deploy --prod`
- Verify `/manifest.webmanifest`, `/xyz` (404), and page source `<link rel="canonical">`
