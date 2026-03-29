#!/usr/bin/env node
/**
 * Pre-restart checkpoint script
 * Run this before restarting the gateway to save session state
 * Usage: node scripts/checkpoint-session.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || '/Users/Jack/.openclaw/workspace';
const TRACKER_FILE = path.join(WORKSPACE_DIR, '.openclaw', 'restart-tracker.md');

async function getSessionInfo() {
  try {
    const output = execSync('openclaw sessions --json', { encoding: 'utf8', cwd: WORKSPACE_DIR });
    const data = JSON.parse(output);
    return data.sessions || [];
  } catch (e) {
    console.error('Failed to get session info:', e.message);
    return [];
  }
}

function formatTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function formatLocalTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CDT';
}

async function main() {
  const sessions = await getSessionInfo();
  const mainSession = sessions.find(s => s.key === 'agent:main:main');
  const activeSession = sessions[0]; // Most recent

  const checkpoint = {
    timestamp: Date.now(),
    isoTimestamp: formatTimestamp(),
    localTimestamp: formatLocalTimestamp(),
    session: mainSession || activeSession,
    allSessions: sessions.slice(0, 5).map(s => ({
      key: s.key,
      sessionId: s.sessionId,
      updatedAt: s.updatedAt,
      ageMs: s.ageMs,
      kind: s.kind,
      agentId: s.agentId
    }))
  };

  const content = `# Gateway Restart Tracker

This file tracks restart events and recovery state for the session.

## Last Session State (Checkpoint)

**Checkpoint time:** ${checkpoint.localTimestamp}
**Timestamp:** ${checkpoint.isoTimestamp}

### Active Session
- **Session key:** \`${checkpoint.session?.key || 'unknown'}\`
- **Session ID:** \`${checkpoint.session?.sessionId || 'unknown'}\`
- **Last updated:** ${checkpoint.session?.updatedAt || 'unknown'}
- **Agent:** ${checkpoint.session?.agentId || 'main'}
- **Kind:** ${checkpoint.session?.kind || 'unknown'}

### Recent Sessions (${sessions.length} total)
${checkpoint.allSessions.map(s => `- \`${s.key}\` (${s.kind}) - ${s.sessionId}`).join('\n')}

## Restart Events

| Timestamp | Event Type | Initiated By | Status |
|-----------|------------|--------------|--------|
| ${checkpoint.localTimestamp} | **RESTART INITIATED** | Control UI | PENDING |

## Recovery Instructions

On restart, the agent should:
1. Check if this file exists and has recent restart markers (< 5 min old)
2. If restart marker found with "PENDING" status, read last session state above
3. Acknowledge restart: "Gateway restarted. Resuming from [last context]."
4. Check for any incomplete tasks from the previous session
5. Mark recovery complete in this file

## In-Progress Tasks at Restart

- Gateway restart initiated from Control UI
- Previous session may have had active tasks

---
Generated: ${checkpoint.localTimestamp}
`;

  // Ensure directory exists
  const trackerDir = path.dirname(TRACKER_FILE);
  if (!fs.existsSync(trackerDir)) {
    fs.mkdirSync(trackerDir, { recursive: true });
  }

  fs.writeFileSync(TRACKER_FILE, content, 'utf8');
  console.log(`✓ Checkpoint saved to ${TRACKER_FILE}`);
  console.log(`  Session: ${checkpoint.session?.key || 'unknown'}`);
  console.log(`  Sessions tracked: ${checkpoint.allSessions.length}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
