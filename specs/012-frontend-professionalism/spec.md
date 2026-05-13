# Feature Specification: Frontend Professionalism Polish

**Feature ID**: `012-frontend-professionalism`
**Feature Branch**: `main` (applied directly)
**Created**: 2026-03-11
**Status**: Active
**Author**: Murad Hasil

---

## Overview

This feature adds three final professional-grade touches to the TodoAI frontend that were not covered in the initial SEO/metadata upgrade (012). These are standard signals that differentiate a real software product from a portfolio project.

**In Scope:**
- PWA Web App Manifest (`app/manifest.ts`)
- Custom branded 404 page (`app/not-found.tsx`)
- `canonical` URL in root metadata (`app/layout.tsx`)

**Out of Scope:**
- `loading.tsx` / `error.tsx` skeletons
- Service worker / offline support
- GitHub repo social preview image

---

## User Scenarios & Testing

### User Story 1 — Mobile User Adds App to Home Screen (Priority: P1)

A user on mobile Chrome visits the TodoAI site. The browser shows an "Add to Home Screen" prompt. After adding, the app launches with the correct name "TodoAI Evolution", branded dark splash screen, and no browser chrome (fullscreen).

**Why this priority**: PWA manifest is the single strongest signal that this is a production app, not a student project. It also improves Google Lighthouse score.

**Acceptance Scenarios:**

1. **Given** a user opens the site on Android Chrome, **When** they tap "Add to Home Screen", **Then** the icon is the branded robot icon and the name shown is "TodoAI Evolution".
2. **Given** the manifest is present, **When** Lighthouse runs, **Then** the PWA installability check passes with no errors.
3. **Given** the manifest is served, **When** `/manifest.webmanifest` is requested, **Then** it returns valid JSON with `name`, `theme_color`, `background_color`, `display`, and `icons`.

---

### User Story 2 — User Hits a Non-Existent Route (Priority: P2)

A user types a wrong URL (e.g. `/about`, `/pricing`). Instead of a generic Next.js 404, they see a branded dark page consistent with the app theme — with the robot icon, a clear "Page not found" message, and a button to return home.

**Why this priority**: A custom 404 is a standard professional product signal. Default framework error pages break the brand experience.

**Acceptance Scenarios:**

1. **Given** a user navigates to `/xyz`, **When** the page renders, **Then** they see the branded 404 page (dark bg, robot icon, message, home link) — not the default Next.js 404.
2. **Given** the 404 page loads, **When** the user clicks "Go Home", **Then** they are redirected to `/`.

---

### User Story 3 — Search Engine Indexes the Correct URL (Priority: P3)

Google's crawler finds the `<link rel="canonical">` tag in the HTML `<head>` pointing to `https://murad-hasil-todo-ai.vercel.app`. This prevents duplicate content penalties if the site is ever mirrored or accessed via Vercel preview URLs.

**Acceptance Scenarios:**

1. **Given** the root layout is rendered, **When** the HTML source is inspected, **Then** `<link rel="canonical" href="https://murad-hasil-todo-ai.vercel.app">` is present in `<head>`.

---

## Constraints

- No new npm dependencies
- Must not touch auth, API, or backend code
- All changes confined to `todo-web-app/frontend/src/app/`
- Dark theme consistent with `#0f172a` background

---

## Acceptance Criteria Checklist

- [ ] `/manifest.webmanifest` returns valid JSON with all required PWA fields
- [ ] Navigating to a non-existent route renders the custom branded 404
- [ ] HTML `<head>` contains `<link rel="canonical" href="https://murad-hasil-todo-ai.vercel.app">`
- [ ] Vercel build passes with zero errors
- [ ] Production deployed and verified
