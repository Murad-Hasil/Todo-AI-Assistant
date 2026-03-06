#!/bin/bash
# deploy-backend.sh — Backend changes ko HF Space + GitHub dono pe push karo
# Usage: ./deploy-backend.sh "commit message"

set -e  # koi bhi error aye to script ruk jaye

COMMIT_MSG="${1:-chore: update backend}"
BACKEND_DIR="$(dirname "$0")/todo-web-app/backend"
ROOT_DIR="$(dirname "$0")"

echo "==> Backend deploy shuru ho raha hai..."
echo "    Commit message: $COMMIT_MSG"
echo ""

# ── Step 1: HF Space pe push ──────────────────────────────────────────────
echo "[1/2] HF Space pe push kar raha hai..."
cd "$BACKEND_DIR"

if [[ -z $(git status --porcelain) ]]; then
    echo "      Koi change nahi mila backend mein, HF push skip."
else
    git add .
    git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push origin main
    echo "      HF Space update ho gaya ✓"
fi

# ── Step 2: GitHub (main project) pe push ─────────────────────────────────
echo "[2/2] GitHub pe push kar raha hai..."
cd "$ROOT_DIR"

git add todo-web-app/backend
if [[ -z $(git diff --cached --name-only) ]]; then
    echo "      Submodule already up to date, GitHub push skip."
else
    git commit -m "chore: update backend submodule

$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push origin main
    echo "      GitHub update ho gaya ✓"
fi

echo ""
echo "==> Deploy complete! Dono jagah push ho gaya ✓"
echo "    HF Space : https://huggingface.co/spaces/Mb-Murad/todo-ai-assistant"
echo "    GitHub   : https://github.com/Murad-Hasil/Todo-AI-Assistant"
