#!/usr/bin/env node
/**
 * Backlog Todo Integration System
 * Integrates meeting todos with existing backlog process
 * 
 * Workflow:
 * Meeting → Extract → Pending Review → Jason Approves → Backlog Entry → Track Progress
 */

const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.resolve(__dirname, '../../../..');
const BACKLOG_DIR = path.join(WORKSPACE_DIR, 'backlog');
const TODOS_DIR = path.join(WORKSPACE_DIR, 'agents', 'harlan', 'todos');

// Ensure directories exist
if (!fs.existsSync(BACKLOG_DIR)) fs.mkdirSync(BACKLOG_DIR, { recursive: true });
if (!fs.existsSync(TODOS_DIR)) fs.mkdirSync(TODOS_DIR, { recursive: true });

const BACKLOG_FILE = path.join(BACKLOG_DIR, 'tasks.json');
const BACKLOG_MD = path.join(BACKLOG_DIR, 'tasks.md');
const TODO_INTEGRATION_FILE = path.join(TODOS_DIR, 'backlog-integration.json');

function getTimestamp() {
  return new Date().toISOString();
}

function getLocalDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}

// Load backlog
function loadBacklog() {
  if (fs.existsSync(BACKLOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf8'));
    } catch {
      return { version: 1, tasks: [], lastUpdated: null };
    }
  }
  return { version: 1, tasks: [], lastUpdated: null };
}

// Save backlog
function saveBacklog(backlog) {
  backlog.lastUpdated = getTimestamp();
  fs.writeFileSync(BACKLOG_FILE, JSON.stringify(backlog, null, 2));
}

// Add todo to backlog
function addTodoToBacklog(todo, source = 'meeting') {
  const backlog = loadBacklog();
  
  // Check for duplicates
  const exists = backlog.tasks.some(t => 
    t.title === todo.text && 
    t.sourceId === todo.sourceId
  );
  
  if (exists) {
    return { added: false, reason: 'duplicate' };
  }
  
  const backlogEntry = {
    id: `backlog-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: todo.text,
    description: `From: ${todo.sourceTitle}\nMeeting Date: ${new Date(todo.sourceDate).toLocaleString('en-US', { timeZone: 'America/Chicago' })}`,
    status: 'backlog',
    priority: todo.priority || 'medium',
    assignee: todo.assignee || null,
    dueDate: todo.dueDate || null,
    source: source,
    sourceId: todo.sourceId,
    sourceTitle: todo.sourceTitle,
    meetingTodoId: todo.id,
    createdAt: getTimestamp(),
    startedAt: null,
    completedAt: null,
    notes: ''
  };
  
  backlog.tasks.push(backlogEntry);
  saveBacklog(backlog);
  
  // Track integration
  const integration = loadIntegration();
  integration.mappings.push({
    meetingTodoId: todo.id,
    backlogId: backlogEntry.id,
    addedAt: getTimestamp()
  });
  saveIntegration(integration);
  
  return { added: true, backlogId: backlogEntry.id };
}

// Load integration tracking
function loadIntegration() {
  if (fs.existsSync(TODO_INTEGRATION_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TODO_INTEGRATION_FILE, 'utf8'));
    } catch {
      return { version: 1, mappings: [], lastUpdated: null };
    }
  }
  return { version: 1, mappings: [], lastUpdated: null };
}

// Save integration tracking
function saveIntegration(integration) {
  integration.lastUpdated = getTimestamp();
  fs.writeFileSync(TODO_INTEGRATION_FILE, JSON.stringify(integration, null, 2));
}

// Update backlog status
function updateBacklogStatus(backlogId, status, notes = '') {
  const backlog = loadBacklog();
  const task = backlog.tasks.find(t => t.id === backlogId);
  
  if (!task) {
    return { updated: false, error: 'Task not found' };
  }
  
  const oldStatus = task.status;
  task.status = status;
  
  if (status === 'in-progress' && !task.startedAt) {
    task.startedAt = getTimestamp();
  }
  
  if (status === 'completed' && !task.completedAt) {
    task.completedAt = getTimestamp();
  }
  
  if (notes) {
    task.notes = task.notes ? `${task.notes}\n\n${notes}` : notes;
  }
  
  saveBacklog(backlog);
  
  return { updated: true, oldStatus, newStatus: status };
}

// Generate backlog markdown
function generateBacklogMarkdown() {
  const backlog = loadBacklog();
  const today = getLocalDate();
  
  let md = `# Backlog Tasks — ${today}\n\n`;
  md += `**Last Updated:** ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}\n\n`;
  
  // Group by status
  const byStatus = {
    backlog: backlog.tasks.filter(t => t.status === 'backlog'),
    'in-progress': backlog.tasks.filter(t => t.status === 'in-progress'),
    'completed': backlog.tasks.filter(t => t.status === 'completed')
  };
  
  // Backlog section
  md += `## 📋 Backlog (${byStatus.backlog.length})\n\n`;
  if (byStatus.backlog.length === 0) {
    md += `*No items in backlog*\n\n`;
  } else {
    byStatus.backlog.forEach(task => {
      md += `### ${task.title}\n`;
      md += `- **ID:** \`${task.id}\`\n`;
      md += `- **Priority:** ${task.priority}\n`;
      if (task.assignee) md += `- **Assignee:** ${task.assignee}\n`;
      if (task.dueDate) md += `- **Due:** ${task.dueDate}\n`;
      md += `- **Source:** ${task.sourceTitle}\n`;
      md += `- **Added:** ${new Date(task.createdAt).toLocaleDateString()}\n`;
      if (task.notes) md += `- **Notes:** ${task.notes.substring(0, 100)}${task.notes.length > 100 ? '...' : ''}\n`;
      md += `\n`;
    });
  }
  
  // In Progress section
  md += `## 🔄 In Progress (${byStatus['in-progress'].length})\n\n`;
  if (byStatus['in-progress'].length === 0) {
    md += `*No items in progress*\n\n`;
  } else {
    byStatus['in-progress'].forEach(task => {
      md += `### ${task.title}\n`;
      md += `- **ID:** \`${task.id}\`\n`;
      md += `- **Started:** ${task.startedAt ? new Date(task.startedAt).toLocaleDateString() : 'Unknown'}\n`;
      if (task.assignee) md += `- **Assignee:** ${task.assignee}\n`;
      if (task.notes) md += `- **Notes:** ${task.notes}\n`;
      md += `\n`;
    });
  }
  
  // Completed section (last 10)
  const recentCompleted = byStatus.completed.slice(-10).reverse();
  md += `## ✅ Completed (${byStatus.completed.length} total, showing last ${recentCompleted.length})\n\n`;
  if (recentCompleted.length === 0) {
    md += `*No completed items*\n\n`;
  } else {
    recentCompleted.forEach(task => {
      md += `- **${task.title}** — Completed ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown'}\n`;
    });
    md += `\n`;
  }
  
  md += `---\n\n`;
  md += `**Total Tasks:** ${backlog.tasks.length}\n`;
  md += `- Backlog: ${byStatus.backlog.length}\n`;
  md += `- In Progress: ${byStatus['in-progress'].length}\n`;
  md += `- Completed: ${byStatus.completed.length}\n`;
  
  fs.writeFileSync(BACKLOG_MD, md);
  return { generated: true, taskCount: backlog.tasks.length };
}

// Get summary
function getSummary() {
  const backlog = loadBacklog();
  const integration = loadIntegration();
  
  const byStatus = {
    backlog: backlog.tasks.filter(t => t.status === 'backlog').length,
    'in-progress': backlog.tasks.filter(t => t.status === 'in-progress').length,
    completed: backlog.tasks.filter(t => t.status === 'completed').length
  };
  
  return {
    totalTasks: backlog.tasks.length,
    byStatus,
    totalFromMeetings: backlog.tasks.filter(t => t.source === 'meeting').length,
    totalMapped: integration.mappings.length
  };
}

// Main exports
module.exports = {
  addTodoToBacklog,
  updateBacklogStatus,
  generateBacklogMarkdown,
  getSummary,
  loadBacklog,
  saveBacklog,
  BACKLOG_FILE,
  BACKLOG_MD
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  if (cmd === 'summary') {
    console.log(JSON.stringify(getSummary(), null, 2));
  } else if (cmd === 'md' || cmd === 'markdown') {
    const result = generateBacklogMarkdown();
    console.log(`Generated backlog: ${result.taskCount} tasks`);
    console.log(`File: ${BACKLOG_MD}`);
  } else if (cmd === 'status' && args[1] && args[2]) {
    const result = updateBacklogStatus(args[1], args[2], args[3] || '');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Usage:');
    console.log('  node backlog-integration.js summary');
    console.log('  node backlog-integration.js markdown');
    console.log('  node backlog-integration.js status <backlog-id> <new-status> [notes]');
  }
}
