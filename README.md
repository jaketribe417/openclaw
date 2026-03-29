# OpenClaw home backup

Private backup of this machine’s OpenClaw state: workspace bootstrap files, agent layouts, cron job definitions, and local skills.

## What is not in git

- **`openclaw.json`** — contains gateway and channel secrets; keep a separate encrypted or offline backup if you need the raw file.
- **`credentials/`**, **`identity/`**, **`telegram/`** — tokens and pairing state.
- **Session transcripts** under `agents/*/sessions/`.
- **`workspace/jake-mission-control/`** — tracked in its own repository (Next.js app).

## Restore

1. Clone this repo to `~/.openclaw` (or merge into an existing tree).
2. Restore `openclaw.json` and secret dirs from your secure backup.
3. Run `openclaw doctor` and restart the gateway.

## History note

If `workspace/.git.backup-before-monorepo` exists, it holds the previous standalone Git history for `workspace/` before this monorepo was created. That directory is **not** tracked in this repo (see `.gitignore`).

## GitHub (private remote)

Use a **private** repository only.

```bash
cd ~/.openclaw
gh auth login
gh repo create openclaw-home-backup --private --source=. --remote=origin --push
```

Or create an empty private repo in the GitHub UI, then:

```bash
git remote add origin https://github.com/<you>/openclaw-home-backup.git
git push -u origin main
```
