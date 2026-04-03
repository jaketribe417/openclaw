#!/bin/zsh
# git-auto-push.sh - Auto-commit and push changes to GitHub
# Created: 2026-04-03
# Schedule: Run via OpenClaw cron

set -e

REPO_DIR="/Users/Jack/.openclaw"
SCRIPT_NAME="git-auto-push"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$SCRIPT_NAME] Starting auto-push at $TIMESTAMP"

# Change to repo directory
cd "$REPO_DIR" || {
    echo "[$SCRIPT_NAME] ERROR: Cannot access $REPO_DIR"
    exit 1
}

# Check if this is a git repo
if [ ! -d .git ]; then
    echo "[$SCRIPT_NAME] ERROR: Not a git repository"
    exit 1
fi

# Check git status for changes
STATUS_OUTPUT=$(git status --porcelain 2>/dev/null)

if [ -z "$STATUS_OUTPUT" ]; then
    echo "[$SCRIPT_NAME] No changes to commit"
    exit 0
fi

# Count changes
CHANGES_COUNT=$(echo "$STATUS_OUTPUT" | wc -l | tr -d ' ')
echo "[$SCRIPT_NAME] Found $CHANGES_COUNT file(s) with changes"

# First, reset any partial staging
git reset HEAD > /dev/null 2>&1 || true

# Stage all changes
echo "[$SCRIPT_NAME] Staging all changes..."
git add -A

# Create a temporary file to track excluded files
EXCLUDED_FILES=()

# Check for excluded files and unstage them
# Exclusions:
# - openclaw-config-setup-discord.md (Discord config)
# - *.env files
# - secrets.* files  
# - config/*.local files

# Unstage excluded files if they exist
while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
        openclaw-config-setup-discord.md|*.env|secrets.*|config/*.local)
            git reset HEAD "$file" > /dev/null 2>&1
            EXCLUDED_FILES+=("$file")
            ;;
    esac
done <<< "$(git diff --cached --name-only)"

if [ ${#EXCLUDED_FILES[@]} -gt 0 ]; then
    echo "[$SCRIPT_NAME] Excluded ${#EXCLUDED_FILES[@]} file(s) from commit"
fi

# Check if anything was actually staged
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')

if [ "$STAGED" -eq 0 ]; then
    echo "[$SCRIPT_NAME] No changes to commit (all files excluded)"
    exit 0
fi

echo "[$SCRIPT_NAME] Staged $STAGED file(s) for commit"

# Show what will be committed
echo "[$SCRIPT_NAME] Files to be committed:"
git diff --cached --name-only | sed 's/^/  - /'

# Commit with timestamp
COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
echo "[$SCRIPT_NAME] Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || {
    echo "[$SCRIPT_NAME] ERROR: Commit failed"
    exit 1
}

# Push to origin main
echo "[$SCRIPT_NAME] Pushing to origin main..."
if git push origin main 2>&1; then
    echo "[$SCRIPT_NAME] SUCCESS: Pushed to origin main"
else
    echo "[$SCRIPT_NAME] ERROR: Push failed"
    exit 1
fi

echo "[$SCRIPT_NAME] Auto-push complete at $(date '+%Y-%m-%d %H:%M:%S')"
exit 0
