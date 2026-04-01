#!/usr/bin/env node
/**
 * Joy Email Check Script
 * Checks inbox for UNREAD emails only
 * Sends Discord notification ONCE per email, then marks as read
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const SCRIPT_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '../../..');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');
const STATE_FILE = path.join(WORKSPACE_DIR, '.joy-email-state.json');

const INBOX_ID = 'jaketribe_bot@agentmail.to';
// Telegram configuration for Joy's bot
const TELEGRAM_BOT_TOKEN = '8780763438:AAEBXeR3qOgmIYk6c6k2hGdAnzZF8boZ2BU';
const TELEGRAM_CHAT_ID = '8382558273';
const AGENTMAIL_API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return { notifiedIds: [] };
    }
  }
  return { notifiedIds: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function agentmailRequest(path, method = 'GET', data = null) {
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

async function markMessageAsRead(messageId) {
  try {
    const encodedInboxId = encodeURIComponent(INBOX_ID);
    const response = await agentmailRequest(
      `/inboxes/${encodedInboxId}/messages/${encodeURIComponent(messageId)}`,
      'PATCH',
      { labels: ['received', 'read'] }
    );
    
    if (response.status >= 200 && response.status < 300) {
      logAction(`MARKED_READ: ${messageId}`);
      return true;
    } else {
      logAction(`MARK_READ_FAILED: ${messageId} (HTTP ${response.status})`);
      return false;
    }
  } catch (err) {
    logAction(`MARK_READ_ERROR: ${messageId} - ${err.message}`);
    return false;
  }
}

async function fetchUnreadMessages() {
  try {
    const encodedInboxId = encodeURIComponent(INBOX_ID);
    const response = await agentmailRequest(`/inboxes/${encodedInboxId}/messages`);
    
    if (response.status !== 200) {
      console.error(`API Error: HTTP ${response.status}`);
      return [];
    }
    
    const messages = response.data.messages || response.data.data || [];
    const unread = messages.filter(msg => msg.labels && msg.labels.includes('unread'));
    
    return unread.map(msg => {
      const fromMatch = msg.from ? msg.from.match(/<(.+)@/) : null;
      const senderEmail = fromMatch ? fromMatch[1] + '@' + msg.from.match(/@([^>]+)/)?.[1] : msg.from;
      const senderName = msg.from ? msg.from.replace(/<.+>/, '').trim() : 'Unknown';
      
      return {
        id: msg.message_id || msg.id,
        subject: msg.subject || '(No subject)',
        from: senderName || 'Unknown',
        email: senderEmail || 'unknown',
        timestamp: msg.timestamp || msg.created_at
      };
    });
  } catch (err) {
    console.error('Error fetching unread messages:', err.message);
    return [];
  }
}

async function sendTelegramNotification(messages) {
  // Build message content
  let content = `📧 **New Email${messages.length > 1 ? 's' : ''} from Joy**\n\n`;
  
  messages.forEach((msg, i) => {
    const time = new Date(msg.timestamp).toLocaleString();
    content += `${i + 1}. **${msg.subject}**\n`;
    content += `   From: ${msg.email}\n`;
    content += `   Time: ${time}\n\n`;
  });
  
  content += `✅ Marked as read in inbox. Reply here if you need me to take action.`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: content,
    parse_mode: 'Markdown'
  };
  
  const jsonBody = JSON.stringify(payload);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${body}`));
        }
      });
    });
    
    req.on('error', (err) => {
      logAction(`TELEGRAM_ERROR: ${err.message}`);
      reject(err);
    });
    req.write(jsonBody);
    req.end();
  });
}

// Main execution
async function main() {
  const state = loadState();
  const unreadMessages = await fetchUnreadMessages();
  
  const newMessages = unreadMessages.filter(msg => !state.notifiedIds.includes(msg.id));

  if (newMessages.length === 0) {
    logAction('CHECK: No new unread emails');
    process.exit(0);
  }

  console.log(`Found ${newMessages.length} new unread email(s):`);
  newMessages.forEach(msg => {
    console.log(`  - ${msg.subject} from ${msg.email}`);
  });

  console.log('\nSending Telegram notification...');
  try {
    await sendTelegramNotification(newMessages);
    console.log('Notification sent successfully to Telegram');
    logAction(`NOTIFY: Sent Telegram alert for ${newMessages.length} new email(s)`);
    
    for (const msg of newMessages) {
      await markMessageAsRead(msg.id);
      state.notifiedIds.push(msg.id);
    }
    
    if (state.notifiedIds.length > 1000) {
      state.notifiedIds = state.notifiedIds.slice(-500);
    }
    
    saveState(state);
    logAction(`MARKED: ${newMessages.length} message(s) as notified`);
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to send notification:', err.message);
    logAction(`NOTIFY_FAILED: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
