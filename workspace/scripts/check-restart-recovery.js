#!/usr/bin/env node
/**
 * Post-restart recovery script
 * Run this on startup to detect and report restart recovery state
 * Usage: node scripts/check-restart-recovery.js
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || '/Users/Jack/.openclaw/workspace';
const TRACKER_FILE = path.join(WORKSPACE_DIR, '.openclaw', 'restart-tracker.md');

const RESTART_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function parseTrackerFile() {
  try {
    const content = fs.readFileSync(TRACKER_FILE, 'utf8');
    
    // Extract timestamp from "Checkpoint time:**" line
    const checkpointMatch = content.match(/\*\*Checkpoint time:\*\* (.+)/);
    const timestampMatch = content.match(/\*\*Timestamp:\*\* (.+)/);
    const statusMatch = content.match(/PENDING|IN PROGRESS|COMPLETE/);
    
    return {
      checkpointTime: checkpointMatch?.[1],
      isoTimestamp: timestampMatch?.[1],
      status: statusMatch?.[0] || 'UNKNOWN',
      content: content
    };
  } catch (e) {
    return null;
  }
}

function extractSessionInfo(content) {
  const sessionKeyMatch = content.match(/\*\*Session key:\*\* `(.+?)`/);
  const sessionIdMatch = content.match(/\*\*Session ID:\*\* `(.+?)`/);
  const updatedAtMatch = content.match(/\*\*Last updated:\*\* (.+)/);
  const kindMatch = content.match(/\*\*Kind:\*\* (.+)/);
  
  return {
    key: sessionKeyMatch?.[1],
    sessionId: sessionIdMatch?.[1],
    updatedAt: updatedAtMatch?.[1],
    kind: kindMatch?.[1]
  };
}

function isRecentRestart(checkpointTime) {
  if (!checkpointTime) return false;
  
  const checkpoint = new Date(checkpointTime.replace(' CDT', ''));
  const now = new Date();
  const diffMs = now - checkpoint;
  
  return diffMs < RESTART_THRESHOLD_MS && diffMs >= 0;
}

async function main() {
  const tracker = parseTrackerFile();
  
  if (!tracker) {
    console.log('NO_RESTART');
    process.exit(0);
  }
  
  if (tracker.status !== 'PENDING' && tracker.status !== 'IN PROGRESS') {
    console.log('NO_RESTART');
    process.exit(0);
  }
  
  const sessionInfo = extractSessionInfo(tracker.content);
  
  if (isRecentRestart(tracker.checkpointTime)) {
    console.log('RESTART_DETECTED');
    console.log(`Session: ${sessionInfo.key || 'unknown'}`);
    console.log(`Session ID: ${sessionInfo.sessionId || 'unknown'}`);
    console.log(`Kind: ${sessionInfo.kind || 'unknown'}`);
    console.log(`Checkpoint: ${tracker.checkpointTime}`);
    
    // Update tracker to mark as complete
    const updatedContent = tracker.content
      .replace(/PENDING/, 'COMPLETE')
      .replace(/IN PROGRESS/, 'COMPLETE');
    
    fs.writeFileSync(TRACKER_FILE, updatedContent, 'utf8');
    
    process.exit(0);
  } else {
    console.log('NO_RESTART');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err);
  console.log('NO_RESTART');
  process.exit(1);
});
