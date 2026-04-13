#!/usr/bin/env node
/**
 * Harlan Quill — Todo Management System
 * Manages meeting todos with approval workflow
 * 
 * Workflow:
 * 1. Extract todos from meetings
 * 2. Save to pending todos file
 * 3. Send notification for approval
 * 4. Jason approves/rejects/modifies
 * 5. Approved todos go to active list
 * 6. Track completion status
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');
const HARLAN_DIR = path.resolve(__dirname, '..');
const TODOS_DIR = path.join(HARLAN_DIR, 'todos');
const LOG_DIR = path.join(WORKSPACE_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'harlan-todos.log');

const TELEGRAM_BOT_TOKEN = '8701730324:AAEDj_-Vk6gMpf3NzhLLT6Y19vfu_ZjsQtQ';
const TELEGRAM_CHAT_ID = '8382558273';

// Todo files
const PENDING_TODOS_FILE = path.join(TODOS_DIR, 'pending.json');
const APPROVED_TODOS_FILE = path.join(TODOS_DIR, 'approved.json');
const COMPLETED_TODOS_FILE = path.join(TODOS_DIR, 'completed.json');
const REJECTED_TODOS_FILE = path.join(TODOS_DIR, 'rejected.json');

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(TODOS_DIR)) fs.mkdirSync(TODOS_DIR, { recursive: true });

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

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(logEntry.trim());
}

// Load todos from file
function loadTodos(file) {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      logAction(`ERROR: Failed to load ${file}: ${err.message}`);
      return [];
    }
  }
  return [];
}

// Save todos to file
function saveTodos(file, todos) {
  fs.writeFileSync(file, JSON.stringify(todos, null, 2));
}

// Generate unique ID for todo
function generateTodoId() {
  return `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract todos from meeting
function extractTodosFromMeeting(meeting) {
  const todos = [];
  const meetingId = meeting.id || meeting.conversation_id || 'unknown';
  const meetingTitle = meeting.title || meeting.name || 'Untitled Meeting';
  const meetingDate = new Date(meeting.start_time || meeting.created_at || Date.now());
  
  if (meeting.todos && Array.isArray(meeting.todos)) {
    meeting.todos.forEach((todo, index) => {
      const todoText = typeof todo === 'string' ? todo : (todo.text || todo.content || '');
      const assignee = todo.assignee || todo.assigned_to || '';
      const dueDate = todo.due_date || todo.due || '';
      const priority = todo.priority || 'medium';
      
      if (todoText) {
        todos.push({
          id: generateTodoId(),
          text: todoText,
          assignee: assignee,
          dueDate: dueDate,
          priority: priority,
          source: 'meeting',
          sourceId: meetingId,
          sourceTitle: meetingTitle,
          sourceDate: meetingDate.toISOString(),
          createdAt: getTimestamp(),
          status: 'pending',
          approvedBy: null,
          approvedAt: null,
          completedAt: null,
          notes: ''
        });
      }
    });
  }
  
  return todos;
}

// Extract todos from multiple meetings
function extractAllTodos(meetings) {
  const allTodos = [];
  meetings.forEach(meeting => {
    const meetingTodos = extractTodosFromMeeting(meeting);
    allTodos.push(...meetingTodos);
  });
  return allTodos;
}

// Check for duplicate todos (same text from same meeting)
function filterDuplicates(todos, existingTodos) {
  const existingTexts = new Set(existingTodos.map(t => `${t.text.toLowerCase().trim()}-${t.sourceId}`));
  return todos.filter(todo => {
    const key = `${todo.text.toLowerCase().trim()}-${todo.sourceId}`;
    return !existingTexts.has(key);
  });
}

// Create pending todos file for Jason to review
function createPendingReview(todos) {
  if (todos.length === 0) return { created: false, count: 0 };
  
  const pending = loadTodos(PENDING_TODOS_FILE);
  const newTodos = filterDuplicates(todos, pending);
  
  if (newTodos.length === 0) {
    logAction('TODOS: No new todos to add (all duplicates)');
    return { created: false, count: 0 };
  }
  
  const updatedPending = [...pending, ...newTodos];
  saveTodos(PENDING_TODOS_FILE, updatedPending);
  
  // Create markdown review file
  const reviewDate = getLocalTimestamp().replace(/:/g, '-');
  const reviewFile = path.join(TODOS_DIR, `pending-review-${reviewDate}.md`);
  
  let mdContent = `# Todo Review Required — ${getLocalTimestamp()}\n\n`;
  mdContent += `**New Todos Extracted:** ${newTodos.length}\n`;
  mdContent += `**Source:** Meeting action items\n\n`;
  mdContent += `---\n\n`;
  mdContent += `## Instructions\n\n`;
  mdContent += `Reply with one of these commands:\n\n`;
  mdContent += `- **\`approve <number>\`** — Approve todo (e.g., \`approve 1\`)\n`;
  mdContent += `- **\`approve all\`** — Approve all todos\n`;
  mdContent += `- **\`reject <number>\` [reason]** — Reject with optional reason\n`;
  mdContent += `- **\`modify <number> <new text>\`** — Modify todo text\n`;
  mdContent += `- **\`priority <number> <low/medium/high>\`** — Change priority\n`;
  mdContent += `- **\`due <number> <YYYY-MM-DD>\`** — Set due date\n`;
  mdContent += `- **\`assign <number> <name>\`** — Assign to someone\n\n`;
  mdContent += `---\n\n`;
  mdContent += `## Pending Todos\n\n`;
  
  newTodos.forEach((todo, index) => {
    mdContent += `### ${index + 1}. ${todo.text}\n\n`;
    mdContent += `- **ID:** \`${todo.id}\`\n`;
    mdContent += `- **Source:** ${todo.sourceTitle}\n`;
    mdContent += `- **Priority:** ${todo.priority}\n`;
    mdContent += `- **Due:** ${todo.dueDate || 'Not set'}\n`;
    mdContent += `- **Assignee:** ${todo.assignee || 'Unassigned'}\n`;
    mdContent += `- **Created:** ${new Date(todo.createdAt).toLocaleString('en-US', { timeZone: 'America/Chicago' })}\n\n`;
  });
  
  mdContent += `---\n\n`;
  mdContent += `**Total Pending:** ${updatedPending.length}\n`;
  mdContent += `**File:** \`${PENDING_TODOS_FILE}\`\n`;
  
  fs.writeFileSync(reviewFile, mdContent);
  
  logAction(`TODOS: Created review file with ${newTodos.length} new todos`);
  logAction(`TODOS: Total pending: ${updatedPending.length}`);
  
  return { created: true, count: newTodos.length, reviewFile, newTodos };
}

// Send approval request via Telegram
async function sendApprovalRequest(todos) {
  if (todos.length === 0) return { sent: false };
  
  let text = `📝 **New Todos Need Approval**\n\n`;
  text += `**${todos.length}** action items extracted from meetings:\n\n`;
  
  todos.forEach((todo, i) => {
    const shortText = todo.text.substring(0, 100) + (todo.text.length > 100 ? '...' : '');
    text += `${i + 1}. ${shortText}\n`;
    text += `   📎 ${todo.sourceTitle.substring(0, 40)}\n\n`;
  });
  
  text += `---\n\n`;
  text += `Reply to approve:\n`;
  text += `• \`approve 1\` — Approve first todo\n`;
  text += `• \`approve all\` — Approve all\n`;
  text += `• \`reject 1 not needed\` — Reject with reason\n`;
  text += `• \`modify 1 updated text\` — Change text\n`;
  text += `• \`priority 1 high\` — Set priority\n`;
  text += `• \`due 1 2026-04-05\` — Set due date\n\n`;
  text += `📁 Review file: workspace/agents/harlan/todos/pending-review-*.md`;
  
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
          logAction('TODOS: Approval request sent');
          resolve({ sent: true, result: JSON.parse(body) });
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

// Approve a todo
function approveTodo(todoId, approvedBy = 'Jason') {
  const pending = loadTodos(PENDING_TODOS_FILE);
  const approved = loadTodos(APPROVED_TODOS_FILE);
  
  const todoIndex = pending.findIndex(t => t.id === todoId);
  if (todoIndex === -1) {
    return { success: false, error: 'Todo not found in pending' };
  }
  
  const todo = pending[todoIndex];
  todo.status = 'approved';
  todo.approvedBy = approvedBy;
  todo.approvedAt = getTimestamp();
  
  approved.push(todo);
  pending.splice(todoIndex, 1);
  
  saveTodos(APPROVED_TODOS_FILE, approved);
  saveTodos(PENDING_TODOS_FILE, pending);
  
  logAction(`TODOS: Approved ${todo.id} — ${todo.text.substring(0, 50)}`);
  
  return { success: true, todo };
}

// Reject a todo
function rejectTodo(todoId, reason = '', rejectedBy = 'Jason') {
  const pending = loadTodos(PENDING_TODOS_FILE);
  const rejected = loadTodos(REJECTED_TODOS_FILE);
  
  const todoIndex = pending.findIndex(t => t.id === todoId);
  if (todoIndex === -1) {
    return { success: false, error: 'Todo not found in pending' };
  }
  
  const todo = pending[todoIndex];
  todo.status = 'rejected';
  todo.rejectedBy = rejectedBy;
  todo.rejectedAt = getTimestamp();
  todo.rejectionReason = reason;
  
  rejected.push(todo);
  pending.splice(todoIndex, 1);
  
  saveTodos(REJECTED_TODOS_FILE, rejected);
  saveTodos(PENDING_TODOS_FILE, pending);
  
  logAction(`TODOS: Rejected ${todo.id} — ${reason || 'No reason'}`);
  
  return { success: true, todo };
}

// Modify a todo
function modifyTodo(todoId, newText) {
  const pending = loadTodos(PENDING_TODOS_FILE);
  const todo = pending.find(t => t.id === todoId);
  
  if (!todo) {
    return { success: false, error: 'Todo not found' };
  }
  
  const oldText = todo.text;
  todo.text = newText;
  todo.modifiedAt = getTimestamp();
  
  saveTodos(PENDING_TODOS_FILE, pending);
  
  logAction(`TODOS: Modified ${todo.id}`);
  logAction(`  Old: ${oldText.substring(0, 50)}`);
  logAction(`  New: ${newText.substring(0, 50)}`);
  
  return { success: true, todo };
}

// Complete a todo
function completeTodo(todoId) {
  const approved = loadTodos(APPROVED_TODOS_FILE);
  const completed = loadTodos(COMPLETED_TODOS_FILE);
  
  const todoIndex = approved.findIndex(t => t.id === todoId);
  if (todoIndex === -1) {
    return { success: false, error: 'Todo not found in approved list' };
  }
  
  const todo = approved[todoIndex];
  todo.status = 'completed';
  todo.completedAt = getTimestamp();
  
  completed.push(todo);
  approved.splice(todoIndex, 1);
  
  saveTodos(COMPLETED_TODOS_FILE, completed);
  saveTodos(APPROVED_TODOS_FILE, approved);
  
  logAction(`TODOS: Completed ${todo.id} — ${todo.text.substring(0, 50)}`);
  
  return { success: true, todo };
}

// Generate todo summary report
function generateSummary() {
  const pending = loadTodos(PENDING_TODOS_FILE);
  const approved = loadTodos(APPROVED_TODOS_FILE);
  const completed = loadTodos(COMPLETED_TODOS_FILE);
  const rejected = loadTodos(REJECTED_TODOS_FILE);
  
  const summary = {
    timestamp: getTimestamp(),
    counts: {
      pending: pending.length,
      approved: approved.length,
      completed: completed.length,
      rejected: rejected.length,
      total: pending.length + approved.length + completed.length + rejected.length
    },
    pending,
    approved,
    completed: completed.slice(-10), // Last 10 completed
    rejected: rejected.slice(-10)   // Last 10 rejected
  };
  
  // Save summary
  const summaryFile = path.join(TODOS_DIR, 'summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  return summary;
}

// Main export functions
module.exports = {
  extractTodosFromMeeting,
  extractAllTodos,
  createPendingReview,
  sendApprovalRequest,
  approveTodo,
  rejectTodo,
  modifyTodo,
  completeTodo,
  generateSummary,
  loadTodos,
  saveTodos,
  PENDING_TODOS_FILE,
  APPROVED_TODOS_FILE,
  COMPLETED_TODOS_FILE,
  REJECTED_TODOS_FILE
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'summary') {
    const summary = generateSummary();
    console.log(JSON.stringify(summary, null, 2));
  } else if (command === 'approve' && args[1]) {
    const result = approveTodo(args[1], args[2] || 'Jason');
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'reject' && args[1]) {
    const result = rejectTodo(args[1], args[2] || '', args[3] || 'Jason');
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'complete' && args[1]) {
    const result = completeTodo(args[1]);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Usage:');
    console.log('  node todo-manager.js summary');
    console.log('  node todo-manager.js approve <todo-id> [approver]');
    console.log('  node todo-manager.js reject <todo-id> [reason] [rejecter]');
    console.log('  node todo-manager.js complete <todo-id>');
  }
}
