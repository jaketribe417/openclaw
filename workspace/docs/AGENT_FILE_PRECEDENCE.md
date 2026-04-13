# Agent file precedence (OpenClaw)

OpenClaw does not use a single folder for agent identity. Per [system_prompt_injection_guide.md](../ShareFile/system_prompt_injection_guide.md), context can come from:

1. **Workspace files** — Paths set in `openclaw.json` under `agents.list[].workspace` (e.g. [`workspace/agents/harlan/`](../agents/harlan/) for Harlan, [`workspace/`](../) for Jake). Treat these as the **canonical home** for day-to-day data: `SOUL.md`, `AGENTS.md`, `USER.md`, `memory/`, `meetings/`, scripts, and projects.
2. **Dot-agent overlay** — `~/.openclaw/agents/<id>/agent/` (e.g. `models.json`, `auth-state.json`, optional copies of `SOUL.md` / `AGENTS.md`).

**Recommendation:** Keep **operational data** only under the configured workspace. Keep `~/.openclaw/agents/<id>/agent/` aligned with workspace copies of persona files when both exist, or maintain persona **only** in the workspace to avoid drift. **`models.json` in dot `agent/`** should match [`openclaw.json`](../../openclaw.json) `models.providers` (or be regenerated from it) so per-agent catalogs do not list removed models.

**This repo:** Harlan meetings, memory, tasks, and todo summaries live under `workspace/agents/harlan/`. Harlan scripts use `WORKSPACE_ROOT` = the OpenClaw workspace folder (`workspace/`) and `HARLAN_DIR` = `workspace/agents/harlan`. Bee state is `workspace/.harlan-bee-state.json`; if only the legacy file `~/.openclaw/.harlan-bee-state.json` exists, `bee-meeting-check.js` / `process-all-meetings.js` copy it on first run.
