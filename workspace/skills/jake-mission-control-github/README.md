# Jake Mission Control GitHub Skill

## What I Built

A specialized GitHub automation skill for the **Jake Mission Control** repository. This skill enables automated issue triage, PR creation, and review management specifically tailored to this Next.js dashboard project.

## Files Created

```
/opt/homebrew/lib/node_modules/openclaw/skills/jake-mission-control-github/
└── SKILL.md          # Main skill definition (7.5KB)
```

Plus this documentation in the workspace:
```
/Users/Jack/.openclaw/workspace/skills/jake-mission-control-github/
├── SKILL.md          # Copy of the skill
└── README.md         # This file
```

## Repository Research Summary

### Project Overview

**Jake Mission Control** is a Tron-style modular dashboard for managing tasks, agents, projects, and skills. Built with:

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS (custom Tron theme)
- React (functional components + hooks)

### Current Status: Phase 4 Complete ✅

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | Repository + foundation (Next.js, TS, Tailwind) |
| 2 | ✅ | Core widgets (Tasks, Agents, Kanban, Skills) |
| 3 | ✅ | Dashboard layout + state management |
| 4 | ✅ | GitHub integration + this skill |
| 5 | 📋 | Enhancement ideas (WebSocket, integrations, etc.) |

### Key Components

**Widgets (5 total):**
1. TasksWidget (Jason) — Personal tasks
2. TasksWidget (Jake) — COO delegation queue
3. AgentsWidget — Agent status grid with 2D Tron avatars
4. KanbanWidget — Project pipeline
5. SkillsWidget — Skills inventory

**Design System:**
- Dark theme: `#0A0A0F` background, `#00D4FF` cyan accent
- Monospace typography throughout
- 6-column responsive grid
- Modular widget architecture

### Open Issues (7 total)

Focused on research and feature enhancements:
- Real-time updates (WebSocket/SSE)
- Agent spawn/delegation system
- External integrations (Calendar, Email, Slack)
- Metrics/analytics dashboard
- Command palette + keyboard shortcuts
- Data export/import

## How to Use This Skill

The skill provides a `/jake-mc-issues` command (invocable via chat):

```bash
# Process all open issues interactively
/jake-mc-issues

# Process only bug-labeled issues
/jake-mc-issues --label bug

# Watch mode — poll every 5 minutes
/jake-mc-issues --watch --interval 5

# Review-only mode — check existing PRs for comments
/jake-mc-issues --reviews-only

# Cron mode — fire-and-forget sub-agent spawning
/jake-mc-issues --cron
```

### Features

- **Parallel sub-agents** — Up to 8 concurrent issue fixes
- **Fork mode support** — Contribute from your fork
- **Review handling** — Auto-address PR review comments
- **Watch mode** — Continuous polling for new issues
- **Cron mode** — Safe for scheduled runs
- **Claims system** — Prevents duplicate processing
- **Telegram notifications** — Optional PR summaries

## Token Setup

The skill uses `GH_TOKEN` for GitHub API access. Resolution order:

1. Environment variable `$GH_TOKEN`
2. OpenClaw config: `~/.openclaw/openclaw.json` → `skills.entries["gh-issues"].apiKey`
3. Shared config: `/data/.clawdbot/openclaw.json`

## Next Steps

1. **Test the skill** — Run `/jake-mc-issues` to process open issues
2. **Configure GH_TOKEN** — Ensure GitHub API access is set up
3. **Pick an issue** — Start with a small enhancement (e.g., #5 Command Palette)
4. **Set up notifications** — Add `--notify-channel` for Telegram updates

## Design Decisions

**Why a custom skill instead of using `gh-issues`?**

- Pre-configured defaults for this specific repo
- Embedded project context (structure, patterns, conventions)
- Tailored sub-agent prompts for Next.js/TypeScript codebase
- Documentation of design system and widget architecture
- Easier to extend with project-specific automations

**What's different from `gh-issues`:**

- Same core engine, but with repo-specific knowledge baked in
- Shorter command (`/jake-mc-issues` vs `/gh-issues jaketribe417/jake-mission-control`)
- Better sub-agent guidance for this codebase
- Built-in awareness of Tron theme and component patterns

---

**Created:** 2026-03-29  
**Author:** Jake (COO Agent)  
**Based on:** `gh-issues` skill by OpenClaw
