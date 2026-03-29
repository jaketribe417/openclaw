# Gateway Restart Recovery System

## Problem

When the OpenClaw gateway restarts, active sessions are dropped. The user must manually prompt the agent that a restart occurred, and the agent loses context about what was being done before the restart.

## Solution

A two-part tracking system that saves session state before restart and detects it on startup.

## Components

### 1. Checkpoint Script (`scripts/checkpoint-session.js`)

Run this BEFORE initiating a gateway restart. It:
- Captures current session information from `openclaw sessions --json`
- Writes session key, ID, timestamp, and context to `.openclaw/restart-tracker.md`
- Marks status as "PENDING"

**Usage:**
```bash
# Before restart
node scripts/checkpoint-session.js
# Then restart gateway
openclaw gateway restart
```

### 2. Recovery Detection Script (`scripts/check-restart-recovery.js`)

Run this on startup (or have the agent run it). It:
- Reads `.openclaw/restart-tracker.md`
- Checks if there's a PENDING restart marker < 5 minutes old
- If yes: outputs "RESTART_DETECTED" + session details
- Updates tracker to "COMPLETE"
- If no: outputs "NO_RESTART"

**Usage:**
```bash
node scripts/check-restart-recovery.js
```

**Output examples:**
```
# If restart was recent:
RESTART_DETECTED
Session: agent:main:main
Session ID: edabb87d-38b4-4605-bc75-ba4469b11a96
Kind: direct
Checkpoint: 3/29/2026, 9:48:23 AM CDT

# If no recent restart:
NO_RESTART
```

### 3. Agent Integration

The agent's startup procedure in `AGENTS.md` now includes:
1. Read SOUL.md
2. Read USER.md
3. **Check `.openclaw/restart-tracker.md`** for recent restart markers
4. Read memory files
5. Read MEMORY.md (main session only)

If a restart is detected within 5 minutes:
- Acknowledge: "Gateway restarted. Resuming from [last context]."
- Reference the last session key and any in-progress tasks
- Continue the conversation naturally

## Manual Integration with Control UI

When using the Control UI to restart:

1. **Before clicking restart:** The UI should call `checkpoint-session.js`
2. **After gateway comes back:** The agent runs `check-restart-recovery.js` on startup
3. **If restart detected:** Agent acknowledges and continues

## Files Created

- `.openclaw/restart-tracker.md` — Tracks restart events and session state
- `scripts/checkpoint-session.js` — Saves session checkpoint
- `scripts/check-restart-recovery.js` — Detects restart recovery

## Testing

To test the system:

```bash
# Save a checkpoint
cd ~/.openclaw/workspace
node scripts/checkpoint-session.js

# Simulate restart detection
node scripts/check-restart-recovery.js
# Should output: RESTART_DETECTED + session details

# Run again
node scripts/check-restart-recovery.js
# Should output: NO_RESTART (already recovered)
```

## Future Enhancements

- Integrate checkpoint automatically when Control UI initiates restart
- Extend to track specific tasks in progress, not just session metadata
- Add optional webhook/callback on recovery completion
- Consider adding to OpenClaw core as a native feature

---
Created: 2026-03-29
