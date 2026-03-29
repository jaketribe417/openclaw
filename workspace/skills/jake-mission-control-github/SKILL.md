---
name: jake-mission-control-github
description: "GitHub operations for Jake Mission Control repository — issue triage, PR creation, and review management. Specialized for the Next.js dashboard project."
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["curl", "git", "gh"] },
        "primaryEnv": "GH_TOKEN",
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gh",
              "bins": ["gh"],
              "label": "Install GitHub CLI (brew)",
            },
          ],
      },
  }
---

# Jake Mission Control — GitHub Skill

Specialized GitHub operations for the **Jake Mission Control** repository (`jaketribe417/jake-mission-control`).

## Repository Context

**Repo:** `jaketribe417/jake-mission-control`  
**Description:** Tron-style modular mission control dashboard for Jake (COO Agent)  
**Stack:** Next.js 14, TypeScript, Tailwind CSS, React  
**Branch:** `main`  
**Visibility:** Private

### Project Structure

```
jake-mission-control/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── data/               # Mock data and API responses
├── lib/                # Utility functions and helpers
├── types/              # TypeScript type definitions
├── references/         # Documentation and design refs
├── BACKLOG.md          # Feature backlog
├── TASKS.md            # Active task list
└── README.md           # Project overview
```

### Current Issues (as of 2026-03-29)

| #   | Title                                      | Labels      |
| --- | ------------------------------------------ | ----------- |
| 1   | Research: Real-time Updates and WebSocket  | —           |
| 2   | Research: Agent Spawn and Delegation       | enhancement |
| 3   | Feature: Metrics and Analytics Dashboard   | —           |
| 4   | Feature: External Integrations             | —           |
| 5   | Feature: Command Palette and Shortcuts     | —           |
| 6   | Research: Mission Control Best Practices   | —           |
| 7   | Feature: Data Export and Import            | —           |

## Usage

### Quick Commands

```bash
# Process open issues (interactive)
/jake-mc-issues

# Process only bug-labeled issues
/jake-mc-issues --label bug

# Watch mode — poll every 5 minutes
/jake-mc-issues --watch --interval 5

# Review-only mode — check PRs for comments
/jake-mc-issues --reviews-only

# Cron mode — fire-and-forget sub-agent spawn
/jake-mc-issues --cron
```

### Flags

Same as `gh-issues` skill, but defaults are pre-configured for this repo:

- `--label` — Filter by label (e.g., `bug`, `enhancement`)
- `--limit` — Max issues per poll (default: 10)
- `--milestone` — Filter by milestone title
- `--assignee` — Filter by assignee (`@me` for current user)
- `--fork` — Your fork for PRs (if contributing from fork)
- `--watch` — Continuous polling mode
- `--interval` — Minutes between polls (with `--watch`)
- `--reviews-only` — Skip issues, only handle PR reviews
- `--cron` — Cron-safe fire-and-forget mode
- `--model` — Model for sub-agents (e.g., `glm-5`)
- `--notify-channel` — Telegram channel for PR notifications

## Token Resolution

GH_TOKEN is resolved in this order:

1. Environment variable `$GH_TOKEN`
2. OpenClaw config: `~/.openclaw/openclaw.json` → `skills.entries["gh-issues"].apiKey`
3. Shared config: `/data/.clawdbot/openclaw.json` → same path

Export automatically before API calls:

```bash
export GH_TOKEN=$(cat ~/.openclaw/openclaw.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty')
```

## Implementation Notes

### Code Style

- **TypeScript:** Strict mode, explicit types for component props
- **React:** Functional components with hooks, no class components
- **Tailwind:** Utility-first, use `clsx` or `cn()` for conditional classes
- **Naming:** PascalCase for components, camelCase for utilities, kebab-case for branches

### Branch Naming

```
fix/issue-{N}     # Bug fixes
feature/{name}    # New features
research/{name}   # Research/spike branches
```

### PR Templates

PR bodies should include:

```markdown
## Summary
{one paragraph}

## Changes
- {bullet list}

## Testing
{what was tested}

## Screenshots (if UI changes)
{images or description}

Fixes jaketribe417/jake-mission-control#{N}
```

### Common Patterns

**Component structure:**

```tsx
interface WidgetProps {
  title: string;
  data?: WidgetData;
  className?: string;
}

export function Widget({ title, data, className }: WidgetProps) {
  return (
    <div className={cn("widget-base", className)}>
      <h3>{title}</h3>
      {/* content */}
    </div>
  );
}
```

**API calls (no gh CLI):**

```bash
curl -s \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/jaketribe417/jake-mission-control/issues"
```

## Sub-agent Workflow

### Issue Fix Agent

Spawned for each issue. Steps:

1. **Confidence Check** — Assess if issue is actionable (score 1-10)
2. **Branch** — `git checkout -b fix/issue-{N} main`
3. **Analyze** — Search codebase, locate relevant files
4. **Implement** — Minimal, focused fix
5. **Test** — Run `npm run dev`, check for errors
6. **Commit** — Conventional commit message
7. **Push** — Token-authenticated push
8. **PR** — Create via GitHub API
9. **Notify** — Send summary to Telegram (if configured)

### Review Handler Agent

Spawned for PRs with review comments. Steps:

1. **Fetch Reviews** — Comments, inline feedback, embedded reviews
2. **Analyze** — Determine actionable vs. informational
3. **Implement** — Address requested changes
4. **Push** — Update branch with fixes
5. **Reply** — Respond to each comment thread
6. **Report** — Summary of addressed vs. skipped

## Claims System

Prevents duplicate processing across cron runs and watch mode:

```json
// /data/.clawdbot/gh-issues-claims.json
{
  "jaketribe417/jake-mission-control#42": "2026-03-29T14:30:00Z"
}
```

Claims expire after 2 hours.

## Cron Cursor Tracking

For cron mode, tracks which issue was last processed:

```json
// /data/.clawdbot/gh-issues-cursor-jaketribe417-jake-mission-control.json
{
  "last_processed": 5,
  "in_progress": null
}
```

Ensures sequential processing without gaps or duplicates.

## Error Handling

| Error                          | Response                                          |
| ------------------------------ | ------------------------------------------------- |
| HTTP 401/403 from GitHub       | Stop, report auth failure                         |
| Empty issues list              | Report "No issues found", loop if watch mode      |
| Low confidence (<7/10)         | Skip issue, report reason                         |
| Existing PR for issue          | Skip, report PR URL                               |
| Test failures after fix        | One retry, then report failure                    |
| Sub-agent timeout (>60 min)    | Mark as timed out, report partial progress        |
| Git push fails                 | Retry once with fresh token, then fail            |

## Notifications

When `--notify-channel` is set, sends:

```
✅ PR Created: jaketribe417/jake-mission-control#{N}

{title}

{pr_url}

Files changed: {list}
```

Only final summaries — no intermediate status updates.

## Related Skills

- `gh-issues` — General-purpose GitHub automation
- `github` — GitHub CLI wrapper for ad-hoc ops
- `skill-creator` — For improving this skill itself

---

**Maintained by:** Jake (COO Agent)  
**Last updated:** 2026-03-29
