#!/usr/bin/env node
/**
 * Joy Email Checker
 * Checks inbox, logs to file, outputs summary to current chat only
 * No orphan sessions created
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

async function checkEmails() {
  logAction('Starting email check...');
  
  try {
    // List messages in inbox
    const response = await makeRequest(`/inboxes/${encodeURIComponent(INBOX_ID)}/messages?limit=20`, 'GET');
    
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
    
    logAction(`Found ${messages.length} messages`);
    
    const unreadMessages = messages.filter(m => !m.read_at);
    const trustedMessages = [];
    const otherMessages = [];
    
    for (const msg of unreadMessages) {
      const from = msg.from?.email || msg.from || 'unknown';
      if (isTrustedSender(from)) {
        trustedMessages.push(msg);
      } else {
        otherMessages.push(msg);
      }
    }
    
    // Log summary
    logAction(`Unread: ${unreadMessages.length} total (${trustedMessages.length} trusted, ${otherMessages.length} other)`);
    
    // Output summary to console (current chat only)
    console.log(`📧 Email Check: jaketribe_bot@agentmail.to`);
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Unread: ${unreadMessages.length}`);
    
    if (trustedMessages.length > 0) {
      console.log(`\n✅ Trusted sender emails (${trustedMessages.length}):`);
      for (const msg of trustedMessages) {
        const from = msg.from?.email || msg.from || 'unknown';
        console.log(`   - "${msg.subject}" from ${from}`);
        logAction(`TRUSTED: "${msg.subject}" from ${from}`);
      }
    }
    
    if (otherMessages.length > 0) {
      console.log(`\n⏳ Other emails queued for review (${otherMessages.length}):`);
      for (const msg of otherMessages) {
        const from = msg.from?.email || msg.from || 'unknown';
        console.log(`   - "${msg.subject}" from ${from}`);
        logAction(`QUEUED: "${msg.subject}" from ${from}`);
      }
    }
    
    if (unreadMessages.length === 0) {
      console.log('   All caught up!');
    }
    
    logAction('Email check complete');
    
  } catch (err) {
    logAction(`Error: ${err.message}`);
    console.log(`Email check failed: ${err.message}`);
  }
}

checkEmails();
