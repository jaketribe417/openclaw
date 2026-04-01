#!/usr/bin/env node
/**
 * joy-email-check.js
 * Check emails via AgentMail API and log actions
 * Outputs summary to current chat only
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

// Log file path
const LOG_DIR = path.join(__dirname, '..', '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logAction(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
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

async function checkEmails() {
  console.log('Checking emails for new messages...');
  logAction('Started email check');

  try {
    // List messages in inbox
    const response = await makeRequest(`/inboxes/${encodeURIComponent(INBOX_ID)}/messages?limit=20`, 'GET');
    
    if (response.status < 200 || response.status >= 300) {
      console.error(`Error fetching emails: HTTP ${response.status}`);
      logAction(`ERROR: HTTP ${response.status} - ${JSON.stringify(response.data)}`);
      return;
    }

    const messages = response.data.messages || [];
    const unread = messages.filter(m => m.status === 'unread');
    
    console.log(`\n📧 Email Check for ${INBOX_ID}`);
    console.log(`Total messages: ${messages.length}`);
    console.log(`Unread messages: ${unread.length}`);
    
    logAction(`Found ${messages.length} total messages, ${unread.length} unread`);

    if (unread.length === 0) {
      console.log('\nNo new unread messages.');
      return;
    }

    // Process unread messages
    let trustedCount = 0;
    let queuedCount = 0;

    for (const msg of unread) {
      const from = msg.from?.address || msg.from || 'unknown';
      const subject = msg.subject || '(no subject)';
      const isTrusted = TRUSTED_SENDERS.some(sender => 
        from.toLowerCase().includes(sender.toLowerCase())
      );

      console.log(`\nFrom: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Status: ${isTrusted ? '✅ Trusted sender - auto-processed' : '⏳ Queued for review'}`);

      if (isTrusted) {
        trustedCount++;
        logAction(`AUTO-PROCESSED: From ${from} - Subject: "${subject}"`);
        // Note: Mark as read would require additional API call
        // For now, just log it as processed
      } else {
        queuedCount++;
        logAction(`QUEUED: From ${from} - Subject: "${subject}"`);
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Auto-processed (trusted): ${trustedCount}`);
    console.log(`Queued for review: ${queuedCount}`);
    console.log(`Log saved to: ${LOG_FILE}`);

    logAction(`Summary: ${trustedCount} auto-processed, ${queuedCount} queued`);

  } catch (err) {
    console.error('Error checking emails:', err.message);
    logAction(`ERROR: ${err.message}`);
  }
}

checkEmails();
