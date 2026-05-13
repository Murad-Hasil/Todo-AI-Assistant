---
id: "0028"
title: Enterprise SEO Metadata Upgrade
stage: green
date: 2026-03-11
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["seo","metadata","openGraph","json-ld","sitemap","robots","vercel"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/frontend/src/app/layout.tsx
  - todo-web-app/frontend/public/robots.txt
  - todo-web-app/frontend/src/app/sitemap.ts
tests:
  - Vercel build: /sitemap.xml route generated (Static)
  - robots.txt served at /robots.txt (public/)
  - JSON-LD SoftwareApplication schema embedded in <head>
---

## Prompt

Enterprise Footprint Upgrade: Professional SEO & Metadata.

MISSION: Optimize the project's digital presence for high-end client discovery without adding personal CTA buttons.

STRICT EXECUTION STEPS:
1. **NEXT.JS METADATA API (app/layout.tsx):**
   - Implement a comprehensive `Metadata` object:
     - **Title:** "TodoAI | Distributed Intelligence & Event-Driven Productivity"
     - **Description:** "An enterprise-grade AI task management system utilizing a distributed architecture with Next.js, FastAPI, Kubernetes, and Kafka. Engineered for high scalability and intelligent automation."
     - **Keywords:** ["AI Software Architecture", "Distributed Systems", "Cloud Native SaaS", "Event Driven Microservices", "Full Stack AI Development"]
     - **Application Name:** "TodoAI Evolution"

2. **SOCIAL GRAPH (OpenGraph & Twitter):**
   - Configure `openGraph` tags for LinkedIn and WhatsApp sharing:
     - Type: "website"
     - Title: "TodoAI: The Architecture of Intelligence"
     - Description: "Explore a fully containerized, Kafka-powered AI Todo system built with Spec-Driven Development."
     - Images: [path: /og-preview.png — placeholder, user should add a 1200×630 PNG to public/]

3. **TECHNICAL SEO (Robots & Sitemap):**
   - Create a `robots.txt` in the `/public` folder to allow search engines to index the landing page.
   - Create a `sitemap.ts` (Next.js dynamic sitemap) to map the Public routes (`/`, `/login`, `/register`).

4. **JSON-LD SCHEMA (Rich Snippets):**
   - Add a "SoftwareApplication" Schema markup (JSON-LD) in the root layout.
   - Include: `operatingSystem: "Web"`, `applicationCategory: "BusinessApplication"`, `offers: { price: "0" }`.

5. **FAVICON & THEME:**
   - Ensure the `themeColor` is set to a professional dark/brand color (e.g., `#0f172a`).
   - If a favicon is missing, instruct the user to provide a professional icon or use a Lucide-react icon as a placeholder.

6. **PRODUCTION SYNC:**
   - Commit and push these metadata changes to GitHub and Vercel.

## Response snapshot

Implemented all 6 steps:

1. **layout.tsx** — Full Metadata object: title, description, keywords, applicationName, metadataBase, openGraph (type/url/siteName/title/description/images), twitter card, themeColor: `#0f172a`, icons.
2. **JSON-LD** — `<script type="application/ld+json">` with SoftwareApplication schema injected in `<head>` via `dangerouslySetInnerHTML`.
3. **robots.txt** — Created at `public/robots.txt`; allows `/`, `/login`, `/register`; disallows `/dashboard`, `/api/`; Sitemap URL included.
4. **sitemap.ts** — Created at `src/app/sitemap.ts`; maps 3 public routes with priorities and changeFrequency.
5. **themeColor** — Set to `#0f172a`. favicon.ico already present in `src/app/`.
6. **Deploy** — Committed to `main` (d15fae8), pushed to GitHub, Vercel deploy completed → `https://murad-hasil-todo-ai.vercel.app`.

**Note for user:** Add a `1200×630px` PNG at `todo-web-app/frontend/public/og-preview.png` for the OpenGraph/Twitter social preview image to display correctly on LinkedIn and WhatsApp.

## Outcome

- ✅ Impact: Enterprise-grade SEO metadata live on production; Google rich snippets enabled; sitemap + robots.txt crawlable.
- 🧪 Tests: Vercel build confirmed `/sitemap.xml` as static route; robots.txt in public/; JSON-LD in layout.
- 📁 Files: layout.tsx (modified), robots.txt (created), sitemap.ts (created)
- 🔁 Next prompts: Add og-preview.png to public/ for full social card support; test Google Search Console indexing
- 🧠 Reflection: `metadataBase` is required for Next.js to resolve relative OG image URLs to absolute — included correctly.

## Evaluation notes (flywheel)

- Failure modes observed: None — Vercel build clean, all routes prerendered
- Graders run and results (PASS/FAIL): Vercel build PASS, GitHub push PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add actual og-preview.png and verify on LinkedIn post inspector
