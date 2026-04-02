#!/usr/bin/env node
/**
 * Harlan Quill — Bee Meeting Check with Memory Integration
 * Checks Bee system for meetings/todos/facts, sends Telegram notification,
 * and saves meeting notes to memory system
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const TodoManager = require('./todo-manager.js');

const WORKSPACE_DIR = path.resolve(__dirname, '../../../..');
const HARLAN_DIR = path.join(WORKSPACE_DIR, 'agents', 'harlan');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'harlan-actions.log');
const MEMORY_DIR = path.join(HARLAN_DIR, 'memory');
const MEETINGS_DIR = path.join(HARLAN_DIR, 'meetings');
const STATE_FILE = path.join(WORKSPACE_DIR, '.harlan-bee-state.json');
const MEETINGS_INDEX_FILE = path.join(HARLAN_DIR, 'meetings', 'index.json');

const TELEGRAM_BOT_TOKEN = '8701730324:AAEDj_-Vk6gMpf3NzhLLT6Y19vfu_ZjsQtQ';
const TELEGRAM_CHAT_ID = '8382558273';

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}
if (!fs.existsSync(MEETINGS_DIR)) {
  fs.mkdirSync(MEETINGS_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function getLocalTimestamp() {
  return new Date().toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getLocalDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(logEntry.trim());
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      // Ensure all required fields exist
      return {
        lastCheck: state.lastCheck || null,
        lastTodoCount: state.lastTodoCount || 0,
        notifiedIds: state.notifiedIds || [],
        processedMeetings: state.processedMeetings || [],
        knownMeetingIds: state.knownMeetingIds || [],
        totalMeetingsKnown: state.totalMeetingsKnown || 0,
        fullSyncCompleted: state.fullSyncCompleted || false
      };
    } catch {
      return { lastCheck: null, lastTodoCount: 0, notifiedIds: [], processedMeetings: [], knownMeetingIds: [], totalMeetingsKnown: 0, fullSyncCompleted: false };
    }
  }
  return { lastCheck: null, lastTodoCount: 0, notifiedIds: [], processedMeetings: [], knownMeetingIds: [], totalMeetingsKnown: 0, fullSyncCompleted: false };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function execBee(command, timeout = 30000) {
  try {
    const output = execSync(`bee ${command} --json`, { 
      cwd: WORKSPACE_DIR,
      encoding: 'utf8',
      timeout: timeout
    });
    return JSON.parse(output);
  } catch (err) {
    logAction(`BEE_ERROR: ${err.message}`);
    return null;
  }
}

// Get ALL meetings from Bee with extended history
async function getAllBeeMeetings(fullSync = false, historyDays = 60) {
  logAction(fullSync ? `BEE_SYNC: Full sync - fetching ${historyDays} days of meetings` : 'BEE_CHECK: Fetching recent meetings');
  
  const state = loadState();
  const knownIds = new Set(state.knownMeetingIds || []);
  const processedIds = new Set(state.processedMeetings || []);
  
  // Try multiple commands to get comprehensive history
  let allConversations = [];
  const commands = ['changed', 'now', 'list'];
  
  for (const cmd of commands) {
    try {
      logAction(`BEE_SYNC: Trying command '${cmd}'`);
      const result = execBee(cmd, 60000);
      if (result && result.conversations && result.conversations.length > 0) {
        allConversations = result.conversations;
        logAction(`BEE_SYNC: '${cmd}' returned ${result.conversations.length} conversations`);
        break;
      }
    } catch (err) {
      logAction(`BEE_SYNC: '${cmd}' failed: ${err.message}`);
    }
  }
  
  // Also try to get extended history
  try {
    logAction('BEE_SYNC: Attempting extended history fetch');
    // Try with different time ranges
    const timeRanges = ['--days 60', '--days 30', '--days 7'];
    for (const range of timeRanges) {
      try {
        const output = execSync(`bee conversations ${range} --json 2>/dev/null || echo "[]"`, {
          cwd: WORKSPACE_DIR,
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 50 * 1024 * 1024 // 50MB buffer
        });
        const result = JSON.parse(output);
        if (result && result.length > allConversations.length) {
          allConversations = result;
          logAction(`BEE_SYNC: 'conversations ${range}' returned ${result.length} conversations`);
          break;
        }
      } catch (e) {
        // Continue to next range
      }
    }
  } catch (err) {
    logAction(`BEE_SYNC: Extended history fetch failed: ${err.message}`);
  }
  
  if (allConversations.length === 0) {
    logAction('BEE_CHECK: No conversations retrieved from any command');
    return { 
      available: false, 
      meetings: [], 
      newMeetings: [], 
      missingMeetings: [],
      error: 'Bee CLI error - no data retrieved',
      totalKnown: knownIds.size 
    };
  }
  
  logAction(`BEE_SYNC: Total ${allConversations.length} conversations available from Bee`);
  
  // Filter to specified history range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - historyDays);
  const cutoffMs = cutoffDate.getTime();
  
  const recentConversations = allConversations.filter(c => {
    if (!c) return false;
    const timestamp = c.start_time || c.created_at || c.timestamp;
    if (!timestamp) return true; // Include if no timestamp
    const convTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    return convTime >= cutoffMs;
  });
  
  logAction(`BEE_SYNC: ${recentConversations.length} conversations within ${historyDays} days`);
  
  // Find new meetings we haven't seen
  const newMeetings = recentConversations.filter(c => {
    if (!c) return false;
    const meetingId = c.id || c.conversation_id || c.meeting_id;
    if (!meetingId) return false;
    return !knownIds.has(meetingId);
  });
  
  // Find meetings that are known but not processed (missing from memory)
  const missingMeetings = recentConversations.filter(c => {
    if (!c) return false;
    const meetingId = c.id || c.conversation_id || c.meeting_id;
    if (!meetingId) return false;
    return knownIds.has(meetingId) && !processedIds.has(meetingId);
  });
  
  logAction(`BEE_SYNC: ${newMeetings.length} new meetings, ${missingMeetings.length} known but unprocessed`);
  
  // Update known IDs with ALL meetings seen
  const allIds = recentConversations.map(c => c.id || c.conversation_id || c.meeting_id).filter(Boolean);
  const updatedKnownIds = [...new Set([...knownIds, ...allIds])];
  
  // Save updated state
  try {
    state.knownMeetingIds = updatedKnownIds;
    state.totalMeetingsKnown = updatedKnownIds.length;
    state.lastFullSync = fullSync ? getTimestamp() : state.lastFullSync;
    if (fullSync) state.fullSyncCompleted = true;
    saveState(state);
    logAction(`BEE_STATE: Updated with ${updatedKnownIds.length} known meeting IDs`);
  } catch (err) {
    logAction(`BEE_STATE_ERROR: Failed to save state: ${err.message}`);
  }
  
  // Save comprehensive meetings index
  saveMeetingsIndex(recentConversations, newMeetings, missingMeetings);
  
  // Filter meetings to process (new + missing)
  const meetingsToProcess = fullSync 
    ? [...newMeetings, ...missingMeetings]
    : newMeetings.filter(c => {
        const timestamp = c.start_time || c.created_at || c.timestamp;
        if (!timestamp) return false;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const convTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
        return convTime >= todayStart.getTime();
      });
  
  return { 
    available: true, 
    meetings: meetingsToProcess,
    newMeetings: newMeetings,
    missingMeetings: missingMeetings,
    totalAvailable: recentConversations.length,
    totalNew: newMeetings.length,
    totalMissing: missingMeetings.length,
    totalKnown: updatedKnownIds.length,
    error: null 
  };
}

// Save meetings index for reference
function saveMeetingsIndex(allMeetings, newMeetings, missingMeetings = []) {
  const index = {
    lastUpdated: getTimestamp(),
    totalMeetings: allMeetings.length,
    newMeetingsCount: newMeetings.length,
    missingMeetingsCount: missingMeetings.length,
    allMeetings: allMeetings.map(m => ({
      id: m.id || m.conversation_id || m.meeting_id,
      title: m.title || m.name || 'Untitled',
      date: m.start_time || m.created_at || m.timestamp,
      duration: m.duration || m.length || 'Unknown',
      status: m.status || 'unknown'
    })),
    newMeetings: newMeetings.map(m => ({
      id: m.id || m.conversation_id || m.meeting_id,
      title: m.title || m.name || 'Untitled',
      date: m.start_time || m.created_at || m.timestamp
    })),
    missingMeetings: missingMeetings.map(m => ({
      id: m.id || m.conversation_id || m.meeting_id,
      title: m.title || m.name || 'Untitled',
      date: m.start_time || m.created_at || m.timestamp
    }))
  };
  
  fs.writeFileSync(MEETINGS_INDEX_FILE, JSON.stringify(index, null, 2));
  logAction(`BEE_INDEX: Saved ${index.allMeetings.length} meetings to index (${index.newMeetingsCount} new, ${index.missingMeetingsCount} missing)`);
}

// Legacy function for backward compatibility
async function getBeeMeetings() {
  return getAllBeeMeetings(false);
}

async function checkBeeTodos() {
  logAction('BEE_CHECK: Checking for new todos');
  
  const todos = execBee('todos list');
  if (!todos) {
    return { available: false, newTodos: [], error: 'Bee CLI error' };
  }
  
  const state = loadState();
  const allTodos = todos.todos || [];
  const incompleteTodos = allTodos.filter(t => !t.completed);
  
  // Find new todos (not in notified list)
  const newTodos = incompleteTodos.filter(t => !state.notifiedIds.includes(t.id));
  
  logAction(`BEE_CHECK: ${allTodos.length} total, ${incompleteTodos.length} incomplete, ${newTodos.length} new`);
  
  // Update state with newly seen todos
  state.lastCheck = getTimestamp();
  state.lastTodoCount = incompleteTodos.length;
  state.notifiedIds = [...new Set([...state.notifiedIds, ...newTodos.map(t => t.id)])];
  saveState(state);
  
  return { 
    available: true, 
    newTodos,
    totalIncomplete: incompleteTodos.length,
    error: null 
  };
}

async function checkBeeFacts() {
  logAction('BEE_CHECK: Checking for new facts');
  
  const facts = execBee('facts list --limit 10');
  if (!facts) {
    return { available: false, newFacts: [], error: 'Bee CLI error' };
  }
  
  const allFacts = facts.facts || [];
  const recentFacts = allFacts.filter(f => {
    const factDate = new Date(f.updated_at || f.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return factDate > oneDayAgo;
  });
  
  logAction(`BEE_CHECK: ${allFacts.length} facts, ${recentFacts.length} recent`);
  
  return { available: true, recentFacts, error: null };
}

// Get full transcript for a meeting using bee transcript command
async function getMeetingTranscript(conversationId) {
  if (!conversationId) {
    return { success: false, transcript: null, error: 'No conversation ID' };
  }
  
  logAction(`TRANSCRIPT: Fetching for conversation ${conversationId}`);
  
  try {
    const output = execSync(`bee transcript ${conversationId}`, { 
      cwd: WORKSPACE_DIR,
      encoding: 'utf8',
      timeout: 30000
    });
    
    if (!output || output.trim() === '') {
      return { success: false, transcript: null, error: 'Empty transcript' };
    }
    
    logAction(`TRANSCRIPT: Retrieved ${output.length} characters`);
    return { success: true, transcript: output.trim(), error: null };
  } catch (err) {
    logAction(`TRANSCRIPT_ERROR: ${err.message}`);
    return { success: false, transcript: null, error: err.message };
  }
}

// Generate safe filename from title
function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Save individual meeting to meetings folder
function saveMeetingToFile(meeting, transcript) {
  const meetingId = meeting.id || meeting.conversation_id || meeting.meeting_id;
  if (!meetingId) {
    logAction(`MEETING_FILE: No ID for meeting`);
    return { saved: false, file: null };
  }
  
  const title = meeting.title || meeting.name || meeting.short_summary || 'untitled-meeting';
  const timestamp = meeting.start_time || meeting.created_at || meeting.timestamp || Date.now();
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
  content += `participants: ${JSON.stringify(meeting.participants || [])}\n`;
  content += `tags: ${JSON.stringify(meeting.tags || [])}\n`;
  content += `---\n\n`;
  
  content += `# ${title}\n\n`;
  content += `**Date:** ${meetingDate.toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
  content += `**Duration:** ${meeting.duration || meeting.length || 'Unknown'}\n`;
  content += `**Meeting ID:** \`${meetingId}\`\n\n`;
  
  // Summary if available
  if (meeting.summary || meeting.short_summary) {
    content += `## Summary\n\n`;
    content += `${meeting.summary || meeting.short_summary}\n\n`;
  }
  
  // Action items
  if (meeting.todos && meeting.todos.length > 0) {
    content += `## Action Items\n\n`;
    meeting.todos.forEach(todo => {
      const todoText = todo.text || todo.content || todo;
      const assignee = todo.assignee || todo.assigned_to || '';
      const due = todo.due_date || todo.due || '';
      content += `- [ ] ${todoText}${assignee ? ` (assigned: ${assignee})` : ''}${due ? ` (due: ${due})` : ''}\n`;
    });
    content += `\n`;
  }
  
  // Key facts
  if (meeting.facts && meeting.facts.length > 0) {
    content += `## Key Facts\n\n`;
    meeting.facts.forEach(fact => {
      const factText = fact.text || fact.content || fact;
      content += `- ${factText}\n`;
    });
    content += `\n`;
  }
  
  // Full transcript
  if (transcript && transcript.success) {
    content += `## Full Transcript\n\n`;
    content += `\`\`\`\n`;
    content += transcript.transcript;
    content += `\n\`\`\`\n\n`;
  } else if (meeting.transcript || meeting.full_transcript) {
    content += `## Full Transcript\n\n`;
    content += `\`\`\`\n`;
    content += meeting.transcript || meeting.full_transcript;
    content += `\n\`\`\`\n\n`;
  }
  
  // Raw data for debugging
  content += `---\n\n`;
  content += `## Metadata\n\n`;
  content += `\`\`\`json\n`;
  content += JSON.stringify(meeting, null, 2);
  content += `\n\`\`\`\n`;
  
  fs.writeFileSync(filepath, content);
  logAction(`MEETING_FILE: Saved to ${filepath}`);
  
  return { saved: true, file: filename, filepath };
}

// Save meeting summary to general memory
function saveMeetingSummaryToMemory(meeting, meetingFile) {
  const memoryFile = path.join(MEMORY_DIR, 'meetings-index.md');
  
  const meetingId = meeting.id || meeting.conversation_id || meeting.meeting_id;
  const title = meeting.title || meeting.name || meeting.short_summary || 'Untitled Meeting';
  const timestamp = meeting.start_time || meeting.created_at || meeting.timestamp || Date.now();
  const meetingDate = new Date(timestamp);
  const localDateTime = meetingDate.toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create memory entry
  const summary = meeting.summary || meeting.short_summary || 'No summary available';
  const entry = `## Meeting: ${title}\n\n`;
  const entryContent = `- **Date:** ${localDateTime}\n` +
    `- **Meeting ID:** ${meetingId}\n` +
    `- **Summary:** ${summary.substring(0, 200)}${summary.length > 200 ? '...' : ''}\n` +
    `- **Meeting Notes:** [View full notes](meetings/${meetingFile})\n` +
    `- **Added to memory:** ${getLocalTimestamp()}\n\n`;
  
  // Read existing content or create header
  let memoryContent = '';
  if (fs.existsSync(memoryFile)) {
    memoryContent = fs.readFileSync(memoryFile, 'utf8');
  } else {
    memoryContent = `# Harlan's Meeting Memory Index\n\n`;
    memoryContent += `A searchable index of all Bee meetings with links to full transcripts.\n\n`;
    memoryContent += `---\n\n`;
  }
  
  // Add new entry at the top (after header)
  const headerEnd = memoryContent.indexOf('---\n\n') + 5;
  memoryContent = memoryContent.slice(0, headerEnd) + 
    `## ${localDateTime.split(',')[0]} — ${title}\n\n` +
    entryContent +
    `---\n\n` +
    memoryContent.slice(headerEnd);
  
  fs.writeFileSync(memoryFile, memoryContent);
  logAction(`MEMORY_INDEX: Updated ${memoryFile}`);
  
  return { updated: true, file: memoryFile };
}

// Save meeting notes to memory
async function saveMeetingsToMemory(meetings) {
  if (!meetings || meetings.length === 0) {
    logAction('MEMORY: No meetings to save');
    return { saved: 0, files: [], memoryUpdated: false };
  }
  
  const state = loadState();
  let newMeetingsCount = 0;
  const savedFiles = [];
  
  for (const meeting of meetings) {
    const meetingId = meeting.id || meeting.conversation_id || `meeting-${newMeetingsCount}`;
    
    // Skip if already processed
    if (state.processedMeetings.includes(meetingId)) {
      logAction(`MEMORY: Skipping already processed meeting ${meetingId}`);
      continue;
    }
    
    // Get full transcript
    const transcript = await getMeetingTranscript(meetingId);
    
    // Save individual meeting file
    const fileResult = saveMeetingToFile(meeting, transcript);
    if (fileResult.saved) {
      savedFiles.push(fileResult.file);
      
      // Update memory index with summary and link
      saveMeetingSummaryToMemory(meeting, fileResult.file);
    }
    
    // Mark as processed
    state.processedMeetings.push(meetingId);
    newMeetingsCount++;
  }
  
  saveState(state);
  
  logAction(`MEMORY: Saved ${newMeetingsCount} new meetings, ${savedFiles.length} files created`);
  
  return { saved: newMeetingsCount, files: savedFiles, memoryUpdated: true };
}

async function sendTelegramNotification(meetings, todos, facts, reviewResult, todoSummary) {
  const date = getLocalTimestamp();
  
  let text = `📋 **Harlan's Check-in — ${date}**\n\n`;
  
  // Meetings section
  if (meetings.available && meetings.meetings.length > 0) {
    text += `🎙️ **Today's Meetings:** ${meetings.meetings.length}\n`;
    meetings.meetings.slice(0, 5).forEach((m, i) => {
      const title = m.title || m.name || 'Untitled';
      text += `${i + 1}. ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}\n`;
    });
    if (meetings.meetings.length > 5) {
      text += `...and ${meetings.meetings.length - 5} more\n`;
    }
    text += `\n`;
    text += `💾 Saved to:\n`;
    text += `  • agents/harlan/meetings/\n`;
    text += `  • agents/harlan/memory/meetings-index.md\n\n`;
  }
  
  // New todos from meetings section
  if (reviewResult.created && reviewResult.count > 0) {
    text += `📝 **New Todos for Approval:** ${reviewResult.count}\n\n`;
    reviewResult.newTodos.slice(0, 3).forEach((todo, i) => {
      const shortText = todo.text.substring(0, 80) + (todo.text.length > 80 ? '...' : '');
      text += `${i + 1}. ${shortText}\n`;
    });
    if (reviewResult.count > 3) {
      text += `...and ${reviewResult.count - 3} more\n`;
    }
    text += `\n`;
    text += `📁 Review: agents/harlan/todos/pending-review-*.md\n`;
    text += `Reply: approve 1 | reject 1 | modify 1 new text\n\n`;
  }
  
  // Todo summary
  if (todoSummary.counts.total > 0) {
    text += `📊 **Todo Status:**\n`;
    text += `  • Pending: ${todoSummary.counts.pending}\n`;
    text += `  • Approved: ${todoSummary.counts.approved}\n`;
    text += `  • Completed: ${todoSummary.counts.completed}\n\n`;
  }
  
  if (!todos.available) {
    text += `⚠️ **Bee System Issue**\n`;
    text += `${todos.error}\n\n`;
    text += `Please check Bee CLI status.`;
  } else {
    // New todos section (from Bee system)
    if (todos.newTodos.length > 0) {
      text += `🎯 **New Bee Action Items:** ${todos.newTodos.length}\n\n`;
      todos.newTodos.forEach((todo, i) => {
        const todoText = todo.text || todo.content || '(No text)';
        text += `${i + 1}. ${todoText.substring(0, 150)}${todoText.length > 150 ? '...' : ''}\n`;
      });
      text += `\n`;
    }
    
    // Total incomplete todos
    if (todos.totalIncomplete > 0) {
      text += `📊 **Total Incomplete (Bee):** ${todos.totalIncomplete}\n\n`;
    }
    
    // Recent facts
    if (facts.available && facts.recentFacts.length > 0) {
      text += `💡 **New Facts Learned:** ${facts.recentFacts.length}\n`;
      facts.recentFacts.slice(0, 3).forEach(f => {
        const factText = f.text || f.content || '(No text)';
        text += `• ${factText.substring(0, 100)}${factText.length > 100 ? '...' : ''}\n`;
      });
      text += `\n`;
    }
    
    // Response instruction
    if (todos.newTodos.length > 0 || (meetings.available && meetings.meetings.length > 0)) {
      text += `✅ Meetings saved with full transcripts\n`;
      text += `✅ Todos extracted and waiting for approval\n`;
      text += `✅ Memory index updated with summaries\n`;
    } else {
      text += `✅ No new items. All caught up!`;
    }
  }
  
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'Markdown'
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logAction(`TELEGRAM: Notification sent`);
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  logAction('');
  logAction('═══════════════════════════════════════');
  logAction('HARLAN QUILL — BEE CHECK WITH MEMORY & TODOS');
  logAction('═══════════════════════════════════════');
  
  // Get meetings, todos, and facts
  const meetings = await getBeeMeetings();
  const todos = await checkBeeTodos();
  const facts = await checkBeeFacts();
  
  // Extract and manage todos from meetings
  const meetingTodos = TodoManager.extractAllTodos(meetings.meetings);
  const reviewResult = TodoManager.createPendingReview(meetingTodos);
  
  if (reviewResult.created && reviewResult.count > 0) {
    await TodoManager.sendApprovalRequest(reviewResult.newTodos);
  }
  
  // Save meetings to memory
  const memoryResult = await saveMeetingsToMemory(meetings.meetings);
  
  // Generate todo summary
  const todoSummary = TodoManager.generateSummary();
  
  // Send notification
  await sendTelegramNotification(meetings, todos, facts, reviewResult, todoSummary);
  
  logAction('');
  logAction(`SUMMARY:`);
  logAction(`  Meetings: ${meetings.meetings?.length || 0} total, ${memoryResult.saved} new saved`);
  logAction(`  Meeting Files: ${memoryResult.files?.length || 0} created`);
  logAction(`  Memory Index: ${memoryResult.memoryUpdated ? 'Updated' : 'No changes'}`);
  logAction(`  Todos: ${meetingTodos.length} extracted, ${reviewResult.count} new for review`);
  logAction(`  Todo Status: ${todoSummary.counts.pending} pending, ${todoSummary.counts.approved} approved, ${todoSummary.counts.completed} completed`);
  logAction(`  Todos (Bee): ${todos.newTodos?.length || 0} new, ${todos.totalIncomplete || 0} incomplete`);
  logAction(`  Facts: ${facts.recentFacts?.length || 0} recent`);
  logAction(`  Locations:`);
  logAction(`    • agents/harlan/meetings/`);
  logAction(`    • agents/harlan/memory/meetings-index.md`);
  logAction(`    • agents/harlan/todos/`);
  logAction('');
  logAction('CHECK_COMPLETE');
  logAction('═══════════════════════════════════════');
}

// CLI usage for full sync
if (require.main === module) {
  const args = process.argv.slice(2);
  const fullSync = args.includes('--full-sync') || args.includes('-f');
  
  if (fullSync) {
    // Run full sync
    (async () => {
      logAction('═══════════════════════════════════════');
      logAction('HARLAN QUILL — FULL BEE SYNC');
      logAction('═══════════════════════════════════════');
      
      const result = await getAllBeeMeetings(true);
      
      if (result.available) {
        logAction(`Full sync complete:`);
        logAction(`  Total available: ${result.totalAvailable}`);
        logAction(`  New meetings: ${result.totalNew}`);
        logAction(`  Total known in memory: ${result.totalKnown}`);
        
        // Process new meetings if any
        if (result.newMeetings.length > 0) {
          const todoManager = require('./todo-manager.js');
          const meetingTodos = todoManager.extractAllTodos(result.newMeetings);
          const reviewResult = todoManager.createPendingReview(meetingTodos);
          
          if (reviewResult.created) {
            await todoManager.sendApprovalRequest(reviewResult.newTodos);
          }
          
          await saveMeetingsToMemory(result.newMeetings);
          
          logAction(`Processed ${result.newMeetings.length} new meetings`);
          logAction(`Extracted ${meetingTodos.length} todos`);
          logAction(`Created ${reviewResult.count} new review items`);
        }
      } else {
        logAction(`Error: ${result.error}`);
      }
      
      logAction('═══════════════════════════════════════');
    })();
  } else {
    // Run normal check
    main().catch(err => {
      logAction(`FATAL_ERROR: ${err.message}`);
      process.exit(1);
    });
  }
}
