---
id: "0007"
title: Submodule Deploy Script Commands Note
stage: green
date: 2026-03-06
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: brownie
command: /sp.implement
labels: ["git","submodule","deploy","huggingface","github","script","devops"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - deploy-backend.sh
  - COMMANDS.md
  - .gitignore
  - .gitmodules
  - todo-web-app/backend (submodule)
tests:
  - "git submodule status → 4512c8f todo-web-app/backend (heads/main)"
  - "deploy-backend.sh executable → chmod +x confirmed"
  - "COMMANDS.md in .gitignore → will not push to GitHub"
---

## Prompt

Multiple steps across conversation:
1. HF Space backend alag folder mein tha (New folder/todo-ai-assistant) — har baar manually copy karna padta tha
2. User ne pucha: dono backends ko sync kaise rakhen bina copy ke?
3. Git submodule setup karo — HF repo ko main project ke backend/ folder ki jagah attach karo
4. Deploy script banao — ek command se HF + GitHub dono push ho jayein
5. COMMANDS.md banao — sab commands ek jagah note ho jayein, .gitignore mein add karo

## Response snapshot

**Git Submodule setup:**
- `git rm -r --cached todo-web-app/backend/` — purana backend git tracking se hataya
- `git submodule add https://huggingface.co/spaces/Mb-Murad/todo-ai-assistant todo-web-app/backend` — HF repo submodule ki tarah attach kiya
- `todo-web-app/backend/` ab directly HF Space repo hai — ek hi git, dono jagah

**deploy-backend.sh:**
- Usage: `./deploy-backend.sh "commit message"`
- Step 1: `todo-web-app/backend/` mein commit + `git push origin main` (HF update)
- Step 2: root mein `git add todo-web-app/backend` + push (GitHub submodule update)
- Auto-skip karta hai agar koi change nahi

**COMMANDS.md:**
- Project root mein rakha — saari commands, live URLs, submodule clone instructions
- `.gitignore` mein add kiya — GitHub pe nahi jayega (sirf local reference)

**"New folder/todo-ai-assistant" delete kar diya** — ab duplicate nahi.

## Outcome

- Impact: Single source of truth — `todo-web-app/backend/` hi HF repo hai. Koi manual copy nahi.
- Tests: Submodule verified, script executable, COMMANDS.md gitignored confirmed.
- Files: deploy-backend.sh, COMMANDS.md, .gitignore, .gitmodules, todo-web-app/backend (submodule)
- Next prompts: Koi bhi backend change karo → `./deploy-backend.sh "message"` chalao → done.
- Reflection: Git submodule is the cleanest solution for same code in two deployment targets. deploy-backend.sh wraps the two-step push into one command.

## Evaluation notes (flywheel)

- Submodule clone instruction critical: `git submodule update --init --recursive` — new machine pe zaruri.
- COMMANDS.md ko .gitignore mein daalna chahiye — secrets nahi hain lekin personal reference file hai.
- deploy-backend.sh mein `set -e` important — koi bhi step fail ho to script ruk jaye.
