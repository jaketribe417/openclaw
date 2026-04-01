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

const WORKSPACE_DIR = path.resolve(__dirname, '../../../..');
const HARLAN_DIR = path.join(WORKSPACE_DIR, 'agents', 'harlan');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'harlan-actions.log');
const MEMORY_DIR = path.join(HARLAN_DIR, 'memory');
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

// Save meeting notes to memory
function saveMeetingsToMemory(meetings) {
  if (!meetings || meetings.length === 0) {
    logAction('MEMORY: No meetings to save');
    return { saved: 0, file: null };
  }
  
  const todayFile = path.join(MEMORY_DIR, `${getTodayDate()}.md`);
  const localDate = getLocalDate();
  
  let memoryContent = '';
  
  // Check if file exists and read existing content
  if (fs.existsSync(todayFile)) {
    memoryContent = fs.readFileSync(todayFile, 'utf8');
  } else {
    memoryContent = `# ${localDate} — Harlan Daily Log\n\n`;
    memoryContent += `**Generated:** ${getLocalTimestamp()}\n`;
    memoryContent += `**Source:** Bee Meeting Notes\n\n`;
    memoryContent += `---\n\n`;
  }
  
  // Add meetings section
  memoryContent += `## Bee Meetings — ${localDate}\n\n`;
  
  const state = loadState();
  let newMeetingsCount = 0;
  
  meetings.forEach((meeting, i) => {
    const meetingId = meeting.id || meeting.conversation_id || `meeting-${i}`;
    
    // Skip if already processed
    if (state.processedMeetings.includes(meetingId)) {
      logAction(`MEMORY: Skipping already processed meeting ${meetingId}`);
      return;
    }
    
    const title = meeting.title || meeting.name || meeting.short_summary || 'Untitled Meeting';
    // Format date from timestamp (milliseconds since epoch)
    const timestamp = meeting.start_time || meeting.created_at || meeting.timestamp;
    const date = timestamp ? new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago' }) : getLocalTimestamp();
    const duration = meeting.duration || meeting.length || 'Unknown';
    const notes = meeting.summary || meeting.notes || meeting.text || meeting.content || '';
    
    memoryContent += `### Meeting ${i + 1}: ${title}\n`;
    memoryContent += `- **Date:** ${date}\n`;
    memoryContent += `- **Duration:** ${duration}\n`;
    memoryContent += `- **ID:** ${meetingId}\n\n`;
    
    if (notes) {
      memoryContent += `**Notes:**\n`;
      memoryContent += `${notes}\n\n`;
    }
    
    if (meeting.todos && meeting.todos.length > 0) {
      memoryContent += `**Action Items:**\n`;
      meeting.todos.forEach(todo => {
        memoryContent += `- [ ] ${todo.text || todo.content || todo}\n`;
      });
      memoryContent += `\n`;
    }
    
    if (meeting.facts && meeting.facts.length > 0) {
      memoryContent += `**Key Facts:**\n`;
      meeting.facts.forEach(fact => {
        memoryContent += `- ${fact.text || fact.content || fact}\n`;
      });
      memoryContent += `\n`;
    }
    
    memoryContent += `---\n\n`;
    
    // Mark as processed
    state.processedMeetings.push(meetingId);
    newMeetingsCount++;
  });
  
  // Save to memory file
  fs.writeFileSync(todayFile, memoryContent);
  saveState(state);
  
  logAction(`MEMORY: Saved ${newMeetingsCount} new meetings to ${todayFile}`);
  
  return { saved: newMeetingsCount, file: todayFile };
}

async function sendTelegramNotification(meetings, todos, facts) {
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
    text += `💾 Saved to memory: ${meetings.meetings.length} meetings\n\n`;
  }
  
  if (!todos.available) {
    text += `⚠️ **Bee System Issue**\n`;
    text += `${todos.error}\n\n`;
    text += `Please check Bee CLI status.`;
  } else {
    // New todos section
    if (todos.newTodos.length > 0) {
      text += `🎯 **New Action Items:** ${todos.newTodos.length}\n\n`;
      todos.newTodos.forEach((todo, i) => {
        const todoText = todo.text || todo.content || '(No text)';
        text += `${i + 1}. ${todoText.substring(0, 150)}${todoText.length > 150 ? '...' : ''}\n`;
      });
      text += `\n`;
    }
    
    // Total incomplete todos
    if (todos.totalIncomplete > 0) {
      text += `📊 **Total Incomplete:** ${todos.totalIncomplete}\n\n`;
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
      text += `All meetings saved to Harlan's memory system.\n`;
      text += `View at: agents/harlan/memory/${getTodayDate()}.md`;
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
  logAction('HARLAN QUILL — BEE CHECK WITH MEMORY');
  logAction('═══════════════════════════════════════');
  
  // Get meetings, todos, and facts
  const meetings = await getBeeMeetings();
  const todos = await checkBeeTodos();
  const facts = await checkBeeFacts();
  
  // Save meetings to memory
  const memoryResult = saveMeetingsToMemory(meetings.meetings);
  
  // Send notification
  await sendTelegramNotification(meetings, todos, facts);
  
  logAction('');
  logAction(`SUMMARY:`);
  logAction(`  Meetings: ${meetings.meetings?.length || 0} total, ${memoryResult.saved} new saved`);
  logAction(`  Todos: ${todos.newTodos?.length || 0} new, ${todos.totalIncomplete || 0} incomplete`);
  logAction(`  Facts: ${facts.recentFacts?.length || 0} recent`);
  logAction(`  Memory: ${memoryResult.file || 'None'}`);
  logAction('');
  logAction('CHECK_COMPLETE');
  logAction('═══════════════════════════════════════');
}

main().catch(err => {
  logAction(`FATAL_ERROR: ${err.message}`);
  process.exit(1);
});
