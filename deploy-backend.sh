#!/bin/bash
# deploy-backend.sh — Push backend changes to HF Space + GitHub
# Usage: ./deploy-backend.sh "commit message"

set -e  # exit immediately if any command fails

COMMIT_MSG="${1:-chore: update backend}"
BACKEND_DIR="$(dirname "$0")/todo-web-app/backend"
ROOT_DIR="$(dirname "$0")"

echo "==> Starting backend deploy..."
echo "    Commit message: $COMMIT_MSG"
echo ""

# ── Step 1: Push to HF Space ──────────────────────────────────────────────
echo "[1/2] Pushing to HF Space..."
cd "$BACKEND_DIR"

if [[ -z $(git status --porcelain) ]]; then
    echo "      No changes detected in backend, skipping HF push."
else
    git add .
    git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push origin main
    echo "      HF Space updated ✓"
fi

# ── Step 2: Push to GitHub (main project) ─────────────────────────────────
echo "[2/2] Pushing to GitHub..."
cd "$ROOT_DIR"

git add todo-web-app/backend
if [[ -z $(git diff --cached --name-only) ]]; then
    echo "      Submodule already up to date, skipping GitHub push."
else
    git commit -m "chore: update backend submodule

$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push origin main
    echo "      GitHub updated ✓"
fi

echo ""
echo "==> Deploy complete! Pushed to both remotes ✓"
echo "    HF Space : https://huggingface.co/spaces/Mb-Murad/todo-ai-assistant"
echo "    GitHub   : https://github.com/Murad-Hasil/Todo-AI-Assistant"
