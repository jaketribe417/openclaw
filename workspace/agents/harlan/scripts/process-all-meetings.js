#!/usr/bin/env node
/**
 * Process all Bee meetings from full data export
 * Imports all 42 conversations into memory system
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const WORKSPACE_DIR = path.resolve(__dirname, '../../../..');
const HARLAN_DIR = path.join(WORKSPACE_DIR, 'agents', 'harlan');
const MEETINGS_DIR = path.join(HARLAN_DIR, 'meetings');
const MEMORY_DIR = path.join(HARLAN_DIR, 'memory');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'harlan-actions.log');

const FULL_DATA_FILE = path.join(MEETINGS_DIR, 'full-bee-data.json');
const STATE_FILE = path.join(WORKSPACE_DIR, '.harlan-bee-state.json');

// Load existing state
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return { knownMeetingIds: [], processedMeetings: [] };
    }
  }
  return { knownMeetingIds: [], processedMeetings: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function logAction(entry) {
  const logEntry = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(logEntry.trim());
}

function getTimestamp() {
  return new Date().toISOString();
}

function getLocalTimestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
}

function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Get full transcript for a meeting
async function getMeetingTranscript(conversationId) {
  if (!conversationId) {
    return { success: false, transcript: null, error: 'No conversation ID' };
  }
  
  try {
    const output = execSync(`bee transcript ${conversationId}`, { 
      cwd: WORKSPACE_DIR,
      encoding: 'utf8',
      timeout: 60000
    });
    
    return { success: true, transcript: output.trim(), error: null };
  } catch (err) {
    return { success: false, transcript: null, error: err.message };
  }
}

// Process all meetings
async function processAllMeetings() {
  logAction('═══════════════════════════════════════');
  logAction('PROCESSING ALL BEE MEETINGS');
  logAction('═══════════════════════════════════════');
  
  // Load full data
  if (!fs.existsSync(FULL_DATA_FILE)) {
    logAction('ERROR: full-bee-data.json not found');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(FULL_DATA_FILE, 'utf8'));
  const conversations = data.conversations || [];
  
  logAction(`Loaded ${conversations.length} conversations from full data`);
  
  const state = loadState();
  const processedThisRun = [];
  const failedThisRun = [];
  
  for (let i = 0; i < conversations.length; i++) {
    const meeting = conversations[i];
    const meetingId = meeting.id;
    
    if (!meetingId) {
      logAction(`SKIP: No ID for meeting ${i}`);
      continue;
    }
    
    // Check if already processed
    if (state.processedMeetings.includes(meetingId)) {
      logAction(`SKIP: Already processed ${meetingId}`);
      continue;
    }
    
    logAction(`PROCESSING: ${meetingId} (${i + 1}/${conversations.length})`);
    
    try {
      // Get transcript
      const transcript = await getMeetingTranscript(meetingId);
      
      // Save meeting file
      const title = meeting.title || meeting.name || meeting.short_summary || 'untitled';
      const timestamp = meeting.start_time || meeting.created_at || Date.now();
      const meetingDate = new Date(timestamp);
      const dateStr = meetingDate.toISOString().split('T')[0];
      const timeStr = meetingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const safeTitle = sanitizeFilename(title);
      const filename = `${dateStr}_${timeStr}_${safeTitle}.md`;
      const filepath = path.join(MEETINGS_DIR, filename);
      
      // Generate meeting content
      let content = `---\n`;
      content += `title: "${title}"\n`;
      content += `date: ${meetingDate.toISOString()}\n`;
      content += `local_date: ${meetingDate.toLocaleString('en-US', { timeZone: 'America/Chicago' })}\n`;
      content += `meeting_id: ${meetingId}\n`;
      content += `duration: ${meeting.duration || meeting.length || 'Unknown'}\n`;
      content += `utterances: ${meeting.utterances_count || 'Unknown'}\n`;
      content += `state: ${meeting.state || 'Unknown'}\n`;
      content += `---\n\n`;
      
      content += `# ${title}\n\n`;
      content += `**Date:** ${meetingDate.toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
      content += `**Duration:** ${meeting.duration || meeting.length || 'Unknown'}\n`;
      content += `**Utterances:** ${meeting.utterances_count || 'Unknown'}\n`;
      content += `**State:** ${meeting.state || 'Unknown'}\n\n`;
      
      // Summary
      if (meeting.summary || meeting.short_summary) {
        content += `## Summary\n\n`;
        content += `${meeting.summary || meeting.short_summary}\n\n`;
      }
      
      // Transcript
      if (transcript.success) {
        content += `## Full Transcript\n\n`;
        content += `\`\`\`\n`;
        content += transcript.transcript;
        content += `\n\`\`\`\n\n`;
      }
      
      fs.writeFileSync(filepath, content);
      logAction(`SAVED: ${filepath}`);
      
      // Mark as processed
      state.processedMeetings.push(meetingId);
      processedThisRun.push(meetingId);
      
    } catch (err) {
      logAction(`ERROR: Failed to process ${meetingId}: ${err.message}`);
      failedThisRun.push(meetingId);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Update known IDs
  state.knownMeetingIds = [...new Set([...(state.knownMeetingIds || []), ...conversations.map(c => c.id).filter(Boolean)])];
  state.totalMeetingsKnown = state.knownMeetingIds.length;
  
  saveState(state);
  
  logAction('');
  logAction('SUMMARY:');
  logAction(`  Total conversations: ${conversations.length}`);
  logAction(`  Processed this run: ${processedThisRun.length}`);
  logAction(`  Failed: ${failedThisRun.length}`);
  logAction(`  Total known: ${state.knownMeetingIds.length}`);
  logAction(`  Total processed: ${state.processedMeetings.length}`);
  logAction('');
  logAction('COMPLETE');
  logAction('═══════════════════════════════════════');
}

processAllMeetings().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
