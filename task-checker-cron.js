#!/usr/bin/env node
/**
 * Task Checker Cron Job
 * 
 * Scans all TODO files in the workspace, identifies pending tasks,
 * and delegates work to appropriate agents every 30 minutes.
 * 
 * Usage: node task-checker-cron.js
 * 
 * This script is designed to run as a cron job:
 * */30 * * * * cd /Users/Jack/.openclaw && node task-checker-cron.js >> logs/task-checker.log 2>&1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  todoPaths: [
    '/Users/Jack/.openclaw/workspace/todo.md',
    '/Users/Jack/.openclaw/workspace/agents/hep/TODO.md',
    '/Users/Jack/.openclaw/workspace/jake-mission-control/todo.md',
    '/Users/Jack/.openclaw/workspace/agents/jake/TODO.md',
  ],
  logFile: '/Users/Jack/.openclaw/logs/task-checker.log',
  stateFile: '/Users/Jack/.openclaw/state/task-checker-state.json',
  checkInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
  maxTasksPerRun: 1, // Process only one task per run to avoid overwhelming
};

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(path.dirname(CONFIG.logFile));
ensureDir(path.dirname(CONFIG.stateFile));

// Logger
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
};

// Load state
const loadState = () => {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (error) {
    log(`Error loading state: ${error.message}`);
  }
  return {
    lastRun: null,
    completedTasks: [],
    currentTask: null,
    runCount: 0
  };
};

// Save state
const saveState = (state) => {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    log(`Error saving state: ${error.message}`);
  }
};

// Parse TODO file and extract pending tasks
const parseTodoFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { tasks: [], project: null };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const tasks = [];
    let currentProject = null;
    let currentPhase = null;
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      
      // Extract project name from header
      const projectMatch = line.match(/^#\s+(.+)/);
      if (projectMatch) {
        currentProject = projectMatch[1];
      }
      
      // Extract phase from subheader
      const phaseMatch = line.match(/^##\s+(.+)/);
      if (phaseMatch) {
        currentPhase = phaseMatch[1];
      }
      
      // Find pending tasks (unchecked items)
      const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)/);
      if (taskMatch) {
        const taskText = taskMatch[1].trim();
        
        // Skip stub tasks (marked with "stub" or in parenthetical)
        if (taskText.toLowerCase().includes('stub') || 
            taskText.toLowerCase().includes('(requires') ||
            taskText.toLowerCase().includes('placeholder')) {
          continue;
        }
        
        tasks.push({
          text: taskText,
          project: currentProject || path.basename(filePath, '.md'),
          phase: currentPhase,
          file: filePath,
          line: i + 1,
          priority: calculatePriority(taskText, currentPhase),
          id: `${path.basename(filePath, '.md')}-${i}`
        });
      }
    }
    
    return { tasks, project: currentProject };
  } catch (error) {
    log(`Error parsing ${filePath}: ${error.message}`);
    return { tasks: [], project: null };
  }
};

// Calculate task priority based on content
const calculatePriority = (taskText, phase) => {
  let priority = 5; // Default medium priority
  
  // Higher priority for earlier phases
  if (phase) {
    if (phase.includes('Phase 1') || phase.includes('Foundation')) priority -= 2;
    if (phase.includes('Phase 2') || phase.includes('Core')) priority -= 1;
    if (phase.includes('Phase 3') || phase.includes('Frontend')) priority -= 0;
    if (phase.includes('Phase 4') || phase.includes('Visualization')) priority += 1;
  }
  
  // Keywords that indicate urgency
  const urgentKeywords = ['critical', 'security', 'bug', 'fix', 'error', 'broken', 'urgent'];
  const importantKeywords = ['auth', 'login', 'api', 'database', 'core'];
  
  const lowerText = taskText.toLowerCase();
  if (urgentKeywords.some(k => lowerText.includes(k))) priority -= 2;
  if (importantKeywords.some(k => lowerText.includes(k))) priority -= 1;
  
  // Lower priority for documentation, tests at end
  const lowKeywords = ['documentation', 'readme', 'test', 'polish', 'optimize'];
  if (lowKeywords.some(k => lowerText.includes(k))) priority += 1;
  
  return Math.max(1, Math.min(10, priority)); // Clamp between 1-10
};

// Get all pending tasks from all todo files
const getAllPendingTasks = () => {
  const allTasks = [];
  
  for (const todoPath of CONFIG.todoPaths) {
    const { tasks, project } = parseTodoFile(todoPath);
    allTasks.push(...tasks);
  }
  
  // Sort by priority (lower number = higher priority)
  return allTasks.sort((a, b) => a.priority - b.priority);
};

// Mark a task as completed in the todo file
const markTaskCompleted = (task) => {
  try {
    const content = fs.readFileSync(task.file, 'utf8');
    const lines = content.split('\n');
    
    // Find and replace the specific line
    if (lines[task.line - 1]) {
      lines[task.line - 1] = lines[task.line - 1].replace('[ ]', '[x]');
      fs.writeFileSync(task.file, lines.join('\n'));
      return true;
    }
  } catch (error) {
    log(`Error marking task complete: ${error.message}`);
  }
  return false;
};

// Delegate task to appropriate agent
const delegateTask = (task) => {
  const timestamp = new Date().toISOString();
  
  // Determine which agent should handle this task
  let agent = 'hep'; // Default to HEP (coding agent)
  
  if (task.file.includes('jake')) {
    agent = 'jake';
  }
  
  // Create delegation message
  const delegationMessage = {
    type: 'TASK_DELEGATION',
    timestamp,
    task: {
      ...task,
      agent
    },
    instructions: `Please complete the following task from ${task.project}:\n\nTask: ${task.text}\nPhase: ${task.phase}\nFile: ${task.file}\n\nThis is an automated task delegation. Please work on this task and report completion.`
  };
  
  // Write to a delegation queue file
  const queueFile = `/Users/Jack/.openclaw/state/task-queue-${agent}.jsonl`;
  fs.appendFileSync(queueFile, JSON.stringify(delegationMessage) + '\n');
  
  log(`Delegated task to ${agent}: ${task.text.substring(0, 50)}...`);
  
  // Attempt to notify via OpenClaw if available
  try {
    const notifyCmd = `openclaw notify "${agent}" "New task delegated: ${task.text.substring(0, 100)}"`;
    execSync(notifyCmd, { stdio: 'ignore' });
  } catch (e) {
    // OpenClaw CLI may not be available, that's ok
  }
  
  return delegationMessage;
};

// Generate status report
const generateReport = (state, pendingTasks) => {
  const report = {
    timestamp: new Date().toISOString(),
    runCount: state.runCount,
    lastRun: state.lastRun,
    totalPendingTasks: pendingTasks.length,
    completedTasksCount: state.completedTasks.length,
    currentTask: state.currentTask,
    topPriorityTasks: pendingTasks.slice(0, 5).map(t => ({
      text: t.text.substring(0, 60),
      project: t.project,
      priority: t.priority,
      phase: t.phase
    }))
  };
  
  return report;
};

// Main execution
const main = () => {
  log('========================================');
  log('Task Checker Cron Job Starting');
  log('========================================');
  
  const state = loadState();
  const now = new Date();
  
  // Check if enough time has passed since last run
  if (state.lastRun) {
    const lastRun = new Date(state.lastRun);
    const timeDiff = now.getTime() - lastRun.getTime();
    
    if (timeDiff < CONFIG.checkInterval) {
      const minutesRemaining = Math.ceil((CONFIG.checkInterval - timeDiff) / 60000);
      log(`Too soon since last run. ${minutesRemaining} minutes remaining.`);
      return;
    }
  }
  
  // Update state
  state.lastRun = now.toISOString();
  state.runCount = (state.runCount || 0) + 1;
  
  log(`Run #${state.runCount} starting...`);
  
  // Get all pending tasks
  const pendingTasks = getAllPendingTasks();
  log(`Found ${pendingTasks.length} pending tasks across all projects`);
  
  // Filter out already completed tasks
  const incompleteTasks = pendingTasks.filter(t => 
    !state.completedTasks.includes(t.id)
  );
  
  log(`${incompleteTasks.length} tasks remaining to complete`);
  
  // Process next task if available
  if (incompleteTasks.length > 0) {
    const nextTask = incompleteTasks[0];
    
    log(`Next task: [P${nextTask.priority}] ${nextTask.text.substring(0, 60)}...`);
    log(`From: ${nextTask.project} - ${nextTask.phase}`);
    
    // Check if we already have a current task in progress
    if (state.currentTask && state.currentTask.id !== nextTask.id) {
      log(`Previous task ${state.currentTask.id} was not marked complete`);
      // Mark previous as completed to move on
      state.completedTasks.push(state.currentTask.id);
    }
    
    // Set current task
    state.currentTask = nextTask;
    
    // Delegate the task
    const delegation = delegateTask(nextTask);
    
    log(`Task delegated successfully to ${delegation.task.agent}`);
  } else {
    log('No pending tasks found! All caught up.');
    state.currentTask = null;
  }
  
  // Generate and save report
  const report = generateReport(state, incompleteTasks);
  const reportFile = `/Users/Jack/.openclaw/logs/task-checker-report-${now.toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // Save state
  saveState(state);
  
  log('Task Checker Cron Job Complete');
  log(`Report saved to: ${reportFile}`);
  log('========================================');
};

// Run main
main();
