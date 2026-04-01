#!/usr/bin/env node
/**
 * Monitor Cursor build progress for Mission Control TRON dashboard
 * Updates PROJECTS.md with status and sends Telegram notifications for major milestones
 * 
 * Usage: node scripts/monitor-cursor-build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS_FILE = '/Users/Jack/.openclaw/workspace/PROJECTS.md';
const BUILD_LOG = '/Users/Jack/.openclaw/workspace/jake-mission-control/cursor-build.log';
const PUBLIC_DIR = '/Users/Jack/.openclaw/workspace/jake-mission-control/public';
const STATUS_FILE = '/Users/Jack/.openclaw/workspace/.cursor-build-status.json';
const TELEGRAM_SESSION = 'telegram:main';

// Telegram message helper
function sendTelegram(message) {
  try {
    execSync(`openclaw sessions send --session-key "${TELEGRAM_SESSION}" --message "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
      timeout: 30000
    });
    console.log('Telegram notification sent');
  } catch (e) {
    console.error('Failed to send Telegram:', e.message);
  }
}

// Check if Cursor process is running
function isCursorRunning() {
  try {
    const output = execSync('ps aux | grep -i "cursor-agent" | grep -v grep', { encoding: 'utf8' });
    return output.includes('cursor-agent') || output.includes('agent-exec');
  } catch {
    return false;
  }
}

// Check if deliverable exists
function checkDeliverable() {
  const expectedFile = path.join(PUBLIC_DIR, 'mission-control-tron.html');
  if (fs.existsSync(expectedFile)) {
    const stats = fs.statSync(expectedFile);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString()
    };
  }
  return { exists: false };
}

// Load previous status
function loadStatus() {
  if (fs.existsSync(STATUS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Save current status
function saveStatus(status) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

// Update PROJECTS.md with current status
function updateProjectsMd(status) {
  let content = fs.readFileSync(PROJECTS_FILE, 'utf8');
  
  // Find Mission Control section and update status
  const mcSection = content.match(/### 3\. Jake Mission Control Dashboard[\s\S]*?(?=### |## |\n---|$)/);
  if (mcSection) {
    const oldSection = mcSection[0];
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });
    
    // Determine status color
    let statusColor = 'Yellow';
    let statusNote = `Cursor build in progress - checked at ${time} CDT`;
    
    if (status.complete) {
      statusColor = 'Green';
      statusNote = `Build complete - ${status.deliverable.size} bytes delivered`;
    } else if (status.cursorRunning) {
      statusNote = `Cursor agent running - build in progress (checked ${time} CDT)`;
    } else if (!status.cursorRunning && !status.complete) {
      statusColor = 'Red';
      statusNote = `Cursor agent not running - build may have failed (checked ${time} CDT)`;
    }
    
    // Update the section
    let newSection = oldSection
      .replace(/\*\*Status\*\* \| .* \|/, `**Status** | ${statusColor} |`)
      .replace(/\*\*Last Update\*\* \| .{10}/, `**Last Update** | ${now}`)
      .replace(/\*\*Open Tasks\*\* \| .*?\|/, `**Open Tasks** | ${statusNote} |`);
    
    // Add milestone to notes if complete
    if (status.complete && !status.notifiedComplete) {
      newSection = newSection.replace(
        /(\*\*Notes\*\* \| .*?)( \|)?$/m,
        `**Notes** | Build complete! ${status.deliverable.size} bytes |`
      );
    }
    
    content = content.replace(oldSection, newSection);
    fs.writeFileSync(PROJECTS_FILE, content);
    console.log('PROJECTS.md updated');
  }
}

// Main monitoring logic
function monitor() {
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  console.log(`\n[${now}] Checking Cursor build status...`);
  
  const status = loadStatus();
  const cursorRunning = isCursorRunning();
  const deliverable = checkDeliverable();
  
  console.log(`  Cursor running: ${cursorRunning}`);
  console.log(`  Deliverable exists: ${deliverable.exists}`);
  if (deliverable.exists) {
    console.log(`  File size: ${deliverable.size} bytes`);
  }
  
  const currentStatus = {
    lastCheck: now,
    cursorRunning,
    complete: deliverable.exists,
    deliverable: deliverable.exists ? deliverable : null
  };
  
  // Check for state changes and send notifications
  if (deliverable.exists && !status.complete) {
    // Build just completed
    sendTelegram(`✅ Mission Control TRON Dashboard BUILD COMPLETE\n\nFile: mission-control-tron.html\nSize: ${deliverable.size} bytes\nLocation: /jake-mission-control/public/\n\nStatus updated in PROJECTS.md`);
    currentStatus.notifiedComplete = true;
  } else if (!cursorRunning && status.cursorRunning && !deliverable.exists) {
    // Cursor stopped without delivering
    sendTelegram(`⚠️ Cursor build stopped unexpectedly\n\nAgent process ended but no deliverable found.\nCheck workspace for errors.`);
  } else if (cursorRunning && !status.cursorRunning) {
    // Cursor just started (first check)
    sendTelegram(`🚀 Cursor build STARTED\n\nMission Control TRON dashboard build in progress...\nMonitoring every 10 minutes.`);
  }
  
  // Update PROJECTS.md
  updateProjectsMd(currentStatus);
  
  // Save status for next run
  saveStatus(currentStatus);
  
  // Also log to console for cron output
  console.log('Status saved');
}

// Run
monitor();
