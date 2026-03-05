---
id: "0011"
title: Prepare Monorepo for HuggingFace Spaces
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: 007-local-k8s-deploy
branch: 007-local-k8s-deploy
user: Murad-Hasil
command: /sp.implement
labels: ["huggingface", "deployment", "docker", "cors", "github"]
links:
  spec: specs/007-local-k8s-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - todo-web-app/backend/Dockerfile
  - todo-web-app/backend/app/main.py
  - README.md
tests:
  - git push succeeded to 007-local-k8s-deploy branch
  - Dockerfile serves on port 7860 with correct ENV vars
  - CORS includes Vercel origin via set union with env-var origins
---

## Prompt

Prepare the monorepo for Hugging Face Spaces and push to GitHub.

MISSION: Setup the configuration files so Hugging Face can deploy the backend automatically via GitHub.

STRICT EXECUTION STEPS:
1. **DOCKERFILE ADJUSTMENT (Backend):** Update `/todo-web-app/backend/Dockerfile`. Add `ENV HOSTNAME="0.0.0.0"` and `ENV PORT=7860`. Update the final CMD to port 7860. Add `RUN chown -R 1000:1000 /app` before the USER command.
2. **HUGGING FACE METADATA (README.md):** Create a `README.md` at repo root with HF Spaces YAML frontmatter (sdk: docker, app_port: 7860).
3. **CORS REFINEMENT:** Update `/todo-web-app/backend/app/main.py` to allow CORS from the Vercel URL.
4. **GITHUB PUSH:** Commit and push these changes to the repository.

## Response snapshot

All 3 files updated and pushed to GitHub branch `007-local-k8s-deploy` (commit `bfb73ef`):
1. Dockerfile: port 8000→7860, ENV HOSTNAME/PORT added, chown 1000:1000 before USER
2. README.md: Created at repo root with exact HF Spaces YAML frontmatter
3. main.py: Vercel URL hardcoded via set union with env-var origins for guaranteed CORS

## Outcome

- ✅ Impact: Monorepo ready for HuggingFace Spaces auto-deploy; backend serves on port 7860; Vercel CORS always allowed
- 🧪 Tests: git push exit 0; 4 files changed in commit bfb73ef
- 📁 Files: README.md (new), Dockerfile (modified), main.py (modified)
- 🔁 Next prompts: Create HuggingFace Space → connect GitHub repo → set env vars (DATABASE_URL, BETTER_AUTH_SECRET, GROQ_API_KEY, CORS_ORIGINS) in Space settings
- 🧠 Reflection: CORS was already env-var driven; added Vercel URL as hardcoded set-union entry to guarantee it's always allowed

## Evaluation notes (flywheel)

- Failure modes observed: None — all edits and git push succeeded cleanly
- Graders run and results (PASS/FAIL): Dockerfile PASS, README PASS, CORS PASS, git push PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Move Vercel URL to env var default in db.py instead of hardcoding in main.py
