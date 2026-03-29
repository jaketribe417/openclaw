# PROJECTS.md - Active Projects Tracker

## Active Projects

### 1. Memory System Enhancement
- **Status:** Yellow - Research phase complete, implementation pending
- **Description:** Evaluate and implement better memory plugin for cross-session persistence
- **Key Decisions:** 
  - Mem0 plugin (`@mem0/openclaw-mem0`) recommended as best option
  - Requires fixing Ollama embedding configuration
- **Open Tasks:**
  - [ ] Fix Mem0 OSS setup with nomic-embed-text
  - [ ] Install and configure `@mem0/openclaw-mem0` plugin
  - [ ] Test automatic memory capture
- **Next Steps:** Decide on implementation timeline

### 2. Joy Email Automation
- **Status:** Green - Cron configured, email manager skill created
- **Description:** Automate Joy's email checking with scheduled runs
- **Key Decisions:**
  - Use OpenClaw scheduled job (not system cron)
  - Run every 10 minutes
  - Use local Qwen 0.8B model (ollama/qwen3.5:0.8b)
  - New email-manager skill created with full AgentMail API support
- **Completed:**
  - [x] Added cron job to `~/.openclaw/openclaw.json`
  - [x] Created `skills/email-manager/` with complete email client
  - [x] Implemented local "seen" tracking (logs/email-seen.json)
  - [x] Tested mark-all-seen functionality
- **Pending:**
  - [ ] Gateway restart to activate cron (user action required)
- **Next Steps:** User to run `openclaw gateway restart`

### 3. Jake Mission Control Dashboard
- **Status:** 🟢 PHASE 6 IN PROGRESS
- **Description:** Next.js dashboard for Jake (COO Agent) with real-time OpenClaw integration
- **Implementer:** HEP (Divine Forge-Master)

**Phase 5: Enhancement Implementation ✅ COMPLETE**
1. ✅ Command Palette (Cmd+K)
2. ✅ Dark/Light Theme Toggle
3. ✅ Agent Spawn/Delegation System

**Phase 6: Real-Time WebSocket Integration 🟢 IN PROGRESS**
- WebSocket sync with OpenClaw Gateway (port 18789)
- All widgets display live agent/task data
- Color contrast fixed (WCAG AA compliant)
- Connection status indicator

**Deliverables (Phase 6):**
- [ ] `lib/useOpenClawWS.ts` — WebSocket hook
- [ ] `lib/openclaw-api.ts` — REST API client
- [ ] `lib/store.ts` — Zustand global state
- [ ] All widgets wired to live data
- [ ] Connection status in Header
- [ ] Color contrast audit complete

**GitHub:** 
- Repo: https://github.com/jaketribe417/jake-mission-control
- Milestone #1: Phase 5 complete
- Issue #11: Phase 6 (in progress)

**Live URL:** http://localhost:3000

**Location:** `/Users/Jack/.openclaw/workspace/jake-mission-control/`

## Recently Completed

### Gateway Restart Tracker System
- **Completed:** March 29, 2026
- **Description:** Implemented automated restart recovery for all agents
- **Deliverables:**
  - `.openclaw/restart-tracker.md` — Central tracking file
  - `scripts/checkpoint-session.js` — Pre-restart checkpoint
  - `scripts/check-restart-recovery.js` — Post-restart detection
  - Updated `AGENTS.md` — Automatic recovery protocol for all agents
- **Status:** ✅ Active and ready for first restart

## Ideas / Backlog
- Bidding website for government/envelope/statement work procurement
- Envelope-focused website for Lineage
- "Big and Lyttle" children's book series publishing
- Real Estate Leasing Academy publishing

_Last updated: 2026-03-29
