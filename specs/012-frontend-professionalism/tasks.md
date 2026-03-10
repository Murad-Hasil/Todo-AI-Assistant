# Tasks: Frontend Professionalism Polish

**Feature**: `012-frontend-professionalism`
**Date**: 2026-03-11
**Total Tasks**: 6

---

## Phase 1 — Setup (no dependencies)

### T001 — Add canonical URL to root metadata
**File**: `src/app/layout.tsx`
**Action**: Add `alternates: { canonical: siteUrl }` to the existing `metadata` export.
**Acceptance**: HTML `<head>` contains `<link rel="canonical" href="https://murad-hasil-todo-ai.vercel.app">`.
- [ ] `alternates.canonical` added to Metadata object in `layout.tsx`

---

## Phase 2 — Core Implementation

### T002 — Create PWA Web App Manifest
**File**: `src/app/manifest.ts`
**Action**: Create file-based manifest using Next.js `MetadataRoute.Manifest` type.
**Fields**: `name`, `short_name`, `description`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, `icons`.
**Acceptance**: `GET /manifest.webmanifest` returns valid JSON.
- [ ] `src/app/manifest.ts` created
- [ ] All required PWA fields present
- [ ] `display: "standalone"` set

### T003 — Create branded 404 page
**File**: `src/app/not-found.tsx`
**Action**: Create Next.js root `not-found.tsx` as a Server Component with dark-themed layout.
**Design**: Dark bg `#0f172a`, robot icon (text/emoji), large "404", subtitle, "Go Home" link button.
**Acceptance**: Navigating to `/xyz` renders branded 404 — not the default Next.js page.
- [ ] `src/app/not-found.tsx` created
- [ ] Page matches dark theme (`bg-[#0f172a]`)
- [ ] "Go Home" link navigates to `/`
- [ ] No `"use client"` directive (Server Component)

---

## Phase 3 — Validation

### T004 — Local build verification
**Action**: Run `npm run build` in `todo-web-app/frontend/` — zero errors, zero warnings.
**Acceptance**: Build completes successfully.
- [ ] `npm run build` exits 0

### T005 — Commit and push to GitHub
**Action**: Stage all 3 changed/created files, commit with descriptive message, push to `main`.
**Acceptance**: `git push origin main` succeeds, commit visible on GitHub.
- [ ] Files staged and committed
- [ ] Pushed to `origin/main`

### T006 — Deploy to Vercel and verify
**Action**: `npx vercel deploy --prod`, then verify:
1. `https://murad-hasil-todo-ai.vercel.app/manifest.webmanifest` → valid JSON
2. `https://murad-hasil-todo-ai.vercel.app/xyz` → branded 404 page
3. View source → `<link rel="canonical">` present in `<head>`
**Acceptance**: All 3 verifications pass.
- [ ] Vercel deploy succeeds
- [ ] `/manifest.webmanifest` returns JSON
- [ ] `/xyz` shows branded 404
- [ ] Canonical tag present in page source

---

## Completion Summary

| Task | File | Status |
|------|------|--------|
| T001 | `layout.tsx` — canonical | [ ] |
| T002 | `manifest.ts` — PWA | [ ] |
| T003 | `not-found.tsx` — 404 | [ ] |
| T004 | Build check | [ ] |
| T005 | Git commit + push | [ ] |
| T006 | Vercel deploy + verify | [ ] |
