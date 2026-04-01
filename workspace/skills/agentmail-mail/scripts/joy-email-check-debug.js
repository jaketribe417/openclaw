#!/usr/bin/env node
/**
 * Joy Email Check Script - DEBUG VERSION
 * Enhanced logging to diagnose unread email detection issues
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const SCRIPT_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '../../..');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');
const DEBUG_LOG = path.join(LOG_DIR, 'joy-debug.log');

const INBOX_ID = 'jaketribe_bot@agentmail.to';
const TELEGRAM_BOT_TOKEN = '8701730324:AAEDj_-Vk6gMpf3NzhLLT6Y19vfu_ZjsQtQ';
const TELEGRAM_CHAT_ID = '8382558273';
const AGENTMAIL_API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function getLocalTimestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
}

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

function logDebug(entry) {
  const logEntry = `[${getTimestamp()} CDT: ${getLocalTimestamp()}] ${entry}\n`;
  fs.appendFileSync(DEBUG_LOG, logEntry);
  console.log(logEntry.trim());
}

function agentmailRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.agentmail.to',
      port: 443,
      path: '/v0' + path,
      method: method,
      headers: {
        'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    logDebug(`API REQUEST: ${method} ${path}`);
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        logDebug(`API RESPONSE: HTTP ${res.statusCode}, Body length: ${body.length}`);
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          logDebug(`API PARSE ERROR: ${e.message}`);
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      logDebug(`API REQUEST ERROR: ${err.message}`);
      reject(err);
    });
    req.end();
  });
}

async function fetchAllMessages() {
  logDebug('=== STARTING EMAIL CHECK ===');
  logDebug(`Inbox: ${INBOX_ID}`);
  
  try {
    const encodedInboxId = encodeURIComponent(INBOX_ID);
    const response = await agentmailRequest(`/inboxes/${encodedInboxId}/messages`);
    
    logDebug(`Response status: ${response.status}`);
    
    if (response.status !== 200) {
      logDebug(`ERROR: API returned HTTP ${response.status}`);
      logDebug(`Response data: ${JSON.stringify(response.data).substring(0, 500)}`);
      return { total: 0, unread: 0, messages: [] };
    }
    
    const messages = response.data.data || [];
    logDebug(`Total messages returned: ${messages.length}`);
    
    if (messages.length === 0) {
      logDebug('No messages in inbox');
      return { total: 0, unread: 0, messages: [] };
    }
    
    // Log first message structure to understand the schema
    if (messages.length > 0) {
      logDebug(`First message keys: ${Object.keys(messages[0]).join(', ')}`);
      logDebug(`First message sample: ${JSON.stringify(messages[0], null, 2).substring(0, 800)}`);
    }
    
    // Check for read field
    const sampleMsg = messages[0];
    logDebug(`Sample message 'read' field: ${sampleMsg.read}`);
    logDebug(`Sample message 'read' type: ${typeof sampleMsg.read}`);
    
    // Filter for unread messages
    const unread = messages.filter(msg => {
      const isUnread = !msg.read;
      logDebug(`Msg ${msg.id}: read=${msg.read}, isUnread=${isUnread}`);
      return isUnread;
    });
    
    logDebug(`Unread count: ${unread.length}`);
    
    return {
      total: messages.length,
      unread: unread.length,
      messages: unread.map(msg => ({
        id: msg.id,
        subject: msg.subject || '(No subject)',
        from: msg.from?.name || msg.from?.email || 'Unknown',
        email: msg.from?.email || 'unknown',
        timestamp: msg.created_at,
        read: msg.read
      }))
    };
  } catch (err) {
    logDebug(`ERROR in fetchAllMessages: ${err.message}`);
    logDebug(`Stack: ${err.stack}`);
    return { total: 0, unread: 0, messages: [], error: err.message };
  }
}

async function sendTelegramNotification(messages) {
  const text = `📧 **New Unread Email${messages.length > 1 ? 's' : ''}**\n\n` +
    messages.map((msg, i) => 
      `${i + 1}. **${msg.subject}**\n   From: ${msg.email}\n   Time: ${new Date(msg.timestamp).toLocaleString()}`
    ).join('\n\n') +
    `\n\n_Inbox: ${INBOX_ID}_`;
  
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'Markdown'
  });
  
  logDebug(`Sending Telegram notification for ${messages.length} message(s)`);
  
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
          logDebug('Telegram notification sent successfully');
          resolve(JSON.parse(body));
        } else {
          logDebug(`Telegram API error: ${res.statusCode} - ${body}`);
          reject(new Error(`Telegram API error: ${res.statusCode} - ${body}`));
        }
      });
    });
    
    req.on('error', (err) => {
      logDebug(`Telegram request error: ${err.message}`);
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  logDebug('');
  logDebug('═══════════════════════════════════════');
  logDebug('JOY EMAIL CHECK - DEBUG RUN');
  logDebug('═══════════════════════════════════════');
  
  const result = await fetchAllMessages();
  
  logDebug(`\n=== RESULTS ===`);
  logDebug(`Total messages: ${result.total}`);
  logDebug(`Unread messages: ${result.unread}`);
  
  if (result.error) {
    logDebug(`ERROR: ${result.error}`);
    logAction(`CHECK_ERROR: ${result.error}`);
    process.exit(1);
  }
  
  if (result.unread === 0) {
    logDebug('No unread emails found');
    logAction('CHECK: No unread emails');
    logDebug('=== CHECK COMPLETE ===\n');
    process.exit(0);
  }
  
  // Found unread emails
  logDebug(`Found ${result.unread} unread email(s):`);
  for (const msg of result.messages) {
    logDebug(`  - [${msg.id}] "${msg.subject}" from ${msg.email} (read=${msg.read})`);
    logAction(`UNREAD: ${msg.subject} from ${msg.email}`);
  }
  
  // Send Telegram notification
  logDebug('\nSending Telegram notification...');
  try {
    await sendTelegramNotification(result.messages);
    logAction(`NOTIFY: Sent Telegram alert for ${result.unread} unread email(s)`);
    logDebug('=== CHECK COMPLETE WITH NOTIFICATION ===\n');
    process.exit(0);
  } catch (err) {
    logDebug(`Failed to send notification: ${err.message}`);
    logAction(`NOTIFY_FAILED: ${err.message}`);
    logDebug('=== CHECK COMPLETE WITH ERROR ===\n');
    process.exit(1);
  }
}

main().catch(err => {
  logDebug(`Unhandled error: ${err.message}`);
  logDebug(`Stack: ${err.stack}`);
  process.exit(1);
});
