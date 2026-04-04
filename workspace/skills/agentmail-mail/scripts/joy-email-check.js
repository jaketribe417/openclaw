#!/usr/bin/env node
/**
 * Joy Email Checker
 * Checks inbox, logs to file, outputs summary to console (for cron delivery)
 * Updated: Filters out archived, sent, read, and auto-marks todo as read
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.AGENTMAIL_API_KEY || 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const API_HOST = 'api.agentmail.to';
const API_BASE = '/v0';
const INBOX_ID = 'jaketribe_bot@agentmail.to';

// Trusted senders (auto-process)
const TRUSTED_SENDERS = [
  'jason@hansentribe.com',
  'thehansentribe@gmail.com',
  'jhansen@trustlineage.com'
];

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '..', '..', '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOGS_DIR, 'email-actions.log');

function logAction(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_BASE + path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function isTrustedSender(from) {
  const fromLower = from.toLowerCase();
  return TRUSTED_SENDERS.some(sender => fromLower.includes(sender.toLowerCase()));
}

function extractEmailAddress(from) {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

async function checkEmails() {
  logAction('Starting email check...');
  
  try {
    // List messages in inbox
    const response = await makeRequest(`/inboxes/${encodeURIComponent(INBOX_ID)}/messages?limit=50`, 'GET');
    
    if (response.status !== 200) {
      logAction(`Error fetching messages: HTTP ${response.status}`);
      console.log(`Email check failed: HTTP ${response.status}`);
      return;
    }
    
    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      logAction('No messages in inbox');
      console.log('📭 No new emails in jaketribe_bot@agentmail.to');
      return;
    }
    
    logAction(`Found ${messages.length} total messages`);
    
    // Process messages: filter out archived/sent/read, auto-mark todo as read
    const activeMessages = [];
    const archivedCount = messages.filter(m => m.labels?.includes('archived')).length;
    const sentCount = messages.filter(m => m.labels?.includes('sent')).length;
    const readCount = messages.filter(m => m.labels?.includes('read')).length;
    
    for (const msg of messages) {
      const labels = msg.labels || [];
      
      // Skip archived, sent, or already read
      if (labels.includes('archived') || labels.includes('sent') || labels.includes('read')) {
        continue;
      }
      
      // Auto-mark todo items as read
      if (labels.includes('todo')) {
        try {
          const encodedMessageId = encodeURIComponent(msg.message_id);
          await makeRequest(
            `/inboxes/${encodeURIComponent(INBOX_ID)}/messages/${encodedMessageId}`,
            'PATCH',
            { add_labels: ['read'] }
          );
          logAction(`Auto-marked as read (todo): ${msg.subject}`);
        } catch (err) {
          logAction(`Failed to mark todo as read: ${msg.subject}`);
        }
        continue;
      }
      
      activeMessages.push(msg);
    }
    
    // Categorize remaining messages
    const trustedMessages = [];
    const otherMessages = [];
    
    for (const msg of activeMessages) {
      const from = msg.from?.email || extractEmailAddress(msg.from) || 'unknown';
      if (isTrustedSender(from)) {
        trustedMessages.push(msg);
      } else {
        otherMessages.push(msg);
      }
    }
    
    // Log summary
    logAction(`Unread to report: ${activeMessages.length} (${trustedMessages.length} trusted, ${otherMessages.length} other)`);
    logAction(`Hidden: ${archivedCount} archived, ${sentCount} sent, ${readCount} read`);
    
    // Build output for cron delivery
    const output = buildOutput(trustedMessages, otherMessages, messages.length, archivedCount, sentCount, readCount);
    console.log(output);
    
    logAction('Email check complete');
    
  } catch (err) {
    logAction(`Error: ${err.message}`);
    console.log(`❌ Email check failed: ${err.message}`);
  }
}

function buildOutput(trusted, other, total, archivedCount, sentCount, readCount) {
  const lines = [];
  lines.push(`📧 Email Check: jaketribe_bot@agentmail.to`);
  lines.push(`Total messages: ${total} | Archived: ${archivedCount} | Sent: ${sentCount} | Read: ${readCount}`);
  
  const unreadCount = trusted.length + other.length;
  
  if (unreadCount === 0) {
    lines.push('');
    lines.push('✨ Inbox is clear! No unread emails to report.');
    return lines.join('\n');
  }
  
  lines.push(`Unread requiring attention: ${unreadCount}`);
  
  if (trusted.length > 0) {
    lines.push('');
    lines.push(`🟢 Trusted sender emails (${trusted.length}):`);
    for (const msg of trusted) {
      const from = msg.from?.email || extractEmailAddress(msg.from) || 'unknown';
      lines.push(`   • "${msg.subject}" from ${from}`);
    }
  }
  
  if (other.length > 0) {
    lines.push('');
    lines.push(`🟡 Other emails needing review (${other.length}):`);
    for (const msg of other.slice(0, 5)) {
      const from = msg.from?.email || extractEmailAddress(msg.from) || 'unknown';
      lines.push(`   • "${msg.subject}" from ${from}`);
    }
    if (other.length > 5) {
      lines.push(`   ... and ${other.length - 5} more`);
    }
  }
  
  return lines.join('\n');
}

checkEmails();
