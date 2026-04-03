# Git Auto-Push Agent

## Overview
Automatically pushes uncommitted changes to GitHub on a scheduled basis using OpenClaw cron jobs.

## Location
- **Script:** `/Users/Jack/.openclaw/agents/git-auto-push/git-auto-push.sh`
- **Agent Directory:** `/Users/Jack/.openclaw/agents/git-auto-push/`

## How It Works

### Steps
1. Change to `/Users/Jack/.openclaw` directory
2. Check git status for uncommitted changes
3. If no changes: exit cleanly
4. If changes exist: stage all files (with exclusions), commit, and push to origin main
5. Report success or failure concisely

### Excluded Files
The following patterns are excluded from commits:
- `openclaw-config-setup-discord.md` (Discord configuration)
- `*.env` files (environment variables)
- `secrets.*` files (secrets)
- `config/*.local` files (local configs)

## Cron Configuration

- **Job ID:** `344e25ad-82d2-49b4-a483-474c52983bd3`
- **Schedule:** Every hour (`0 * * * *`) with 5-minute stagger
- **Target:** Isolated session
- **Status:** Running

## Usage

### Manual Execution
```bash
/Users/Jack/.openclaw/agents/git-auto-push/git-auto-push.sh
```

### Output Examples

**No changes:**
```
[git-auto-push] Starting auto-push at 2026-04-03 14:05:39
[git-auto-push] No changes to commit
```

**Changes detected:**
```
[git-auto-push] Starting auto-push at 2026-04-03 14:06:05
[git-auto-push] Found 11 file(s) with changes
[git-auto-push] Staging all changes...
[git-auto-push] Staged 11 file(s) for commit
[git-auto-push] Files to be committed:
  - agents/git-auto-push/git-auto-push.sh
  - workspace/todo.md
  ...
[git-auto-push] Committing with message: Auto-commit: 2026-04-03 14:06:05
[git-auto-push] Pushing to origin main...
[git-auto-push] SUCCESS: Pushed to origin main
[git-auto-push] Auto-push complete at 2026-04-03 14:06:07
```

## Logs
Check cron run history:
```bash
openclaw cron runs 344e25ad-82d2-49b4-a483-474c52983bd3
```

## Troubleshooting

### Git Identity Warning
If you see "Your name and email address were configured automatically":
```bash
cd /Users/Jack/.openclaw
git config user.name "Your Name"
git config user.email "your@email.com"
```

### Push Fails Due to Secrets
GitHub may block pushes containing secrets in commit history. The script itself handles exclusions, but historical commits may contain secrets. Options:
1. Use GitHub's unblock URLs to allow historical secrets
2. Rewrite git history to remove secrets (destructive)
3. Rotate tokens if they are active

## Maintenance
- No regular maintenance required
- Script is idempotent - safe to run multiple times
- Automatically skips if no changes detected

---
*Created: April 3, 2026*
