#!/usr/bin/env node
/**
 * Joy Email Check Script
 * Checks inbox for UNREAD emails only
 * Sends Telegram notification if unread emails exist, silent if none
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const SCRIPT_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '../../..');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');

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

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
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
    req.end();
  });
}

async function fetchUnreadMessages() {
  try {
    const encodedInboxId = encodeURIComponent(INBOX_ID);
    const response = await agentmailRequest(`/inboxes/${encodedInboxId}/messages`);
    
    if (response.status !== 200) {
      console.error(`API Error: HTTP ${response.status}`);
      return [];
    }
    
    const messages = response.data.data || [];
    // Filter for unread messages (AgentMail uses 'read' field)
    const unread = messages.filter(msg => !msg.read);
    
    return unread.map(msg => ({
      id: msg.id,
      subject: msg.subject || '(No subject)',
      from: msg.from?.name || msg.from?.email || 'Unknown',
      email: msg.from?.email || 'unknown',
      timestamp: msg.created_at
    }));
  } catch (err) {
    console.error('Error fetching unread messages:', err.message);
    return [];
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
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${body}`));
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
  const unreadMessages = await fetchUnreadMessages();

  if (unreadMessages.length === 0) {
    // Silent exit - no unread emails
    logAction('CHECK: No unread emails');
    process.exit(0);
  }

  // Log the unread emails
  for (const msg of unreadMessages) {
    logAction(`UNREAD: ${msg.subject} from ${msg.email}`);
  }

  console.log(`Found ${unreadMessages.length} unread email(s):`);
  unreadMessages.forEach(msg => {
    console.log(`  - ${msg.subject} from ${msg.email}`);
  });

  // Send Telegram notification
  console.log('\nSending Telegram notification...');
  try {
    await sendTelegramNotification(unreadMessages);
    console.log('Notification sent successfully');
    logAction(`NOTIFY: Sent Telegram alert for ${unreadMessages.length} unread email(s)`);
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
