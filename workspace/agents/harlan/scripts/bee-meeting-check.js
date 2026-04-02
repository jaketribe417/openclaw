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
        processedMeetings: state.processedMeetings || []
      };
    } catch {
      return { lastCheck: null, lastTodoCount: 0, notifiedIds: [], processedMeetings: [] };
    }
  }
  return { lastCheck: null, lastTodoCount: 0, notifiedIds: [], processedMeetings: [] };
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

// Get recent conversations/meetings from Bee
async function getBeeMeetings() {
  logAction('BEE_CHECK: Fetching recent meetings/conversations');
  
  // Try 'changed' first, then fall back to 'now'
  let conversations = execBee('changed', 15000);
  
  if (!conversations || !conversations.conversations) {
    logAction('BEE_CHECK: Using fallback to now');
    conversations = execBee('now', 15000);
  }
  
  if (!conversations || !conversations.conversations) {
    logAction('BEE_CHECK: No conversations data available');
    return { available: false, meetings: [], error: 'Bee CLI error' };
  }
  
  const allConversations = conversations.conversations || [];
  
  // Filter to today's conversations (Bee timestamps are in milliseconds since epoch)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const todayEndMs = todayStartMs + (24 * 60 * 60 * 1000);
  
  const todayConversations = allConversations.filter(c => {
    if (!c) return false;
    const timestamp = c.start_time || c.created_at || c.timestamp;
    if (!timestamp) return false;
    // Handle both millisecond timestamps and ISO date strings
    const convTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    return convTime >= todayStartMs && convTime < todayEndMs;
  });
  
  logAction(`BEE_CHECK: ${allConversations.length} total, ${todayConversations.length} from today (${new Date(todayStartMs).toISOString().split('T')[0]})`);
  
  return { 
    available: true, 
    meetings: todayConversations,
    error: null 
  };
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

main().catch(err => {
  logAction(`FATAL_ERROR: ${err.message}`);
  process.exit(1);
});
