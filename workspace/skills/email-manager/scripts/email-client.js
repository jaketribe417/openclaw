#!/usr/bin/env node
/**
 * Email Manager - Email Client for AgentMail API
 * Supported operations: list, read, send, reply, forward
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.AGENTMAIL_API_KEY || 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const API_HOST = 'api.agentmail.to';
const API_BASE = '/v0';

// Path to track seen messages
const WORKSPACE_DIR = path.resolve(__dirname, '../../..');
const SEEN_FILE = path.join(WORKSPACE_DIR, 'logs', 'email-seen.json');

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      parsed[key] = value;
    }
  }
  return parsed;
}

function makeRequest(apiPath, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_BASE + apiPath,
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

function loadSeenMessages() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
    }
  } catch (e) {
    // File corrupted or unreadable
  }
  return {};
}

function saveSeenMessages(seen) {
  const dir = path.dirname(SEEN_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}

async function listMessages(args) {
  if (!args.inbox_id) {
    console.error('Required: --inbox_id');
    process.exit(1);
  }
  
  let apiPath = `/inboxes/${args.inbox_id}/messages`;
  const query = [];
  
  if (args.limit) query.push(`limit=${args.limit}`);
  if (args.labels) query.push(`labels=${encodeURIComponent(args.labels)}`);
  
  if (query.length > 0) {
    apiPath += '?' + query.join('&');
  }
  
  const response = await makeRequest(apiPath);
  if (response.status >= 200 && response.status < 300) {
    const data = response.data;
    
    // Add "new" flag based on seen tracking (if not using label filter)
    if (!args.labels) {
      const seen = loadSeenMessages();
      const inboxSeen = seen[args.inbox_id] || [];
      
      if (data.messages) {
        data.messages = data.messages.map(msg => ({
          ...msg,
          new: !inboxSeen.includes(msg.message_id)
        }));
      }
    }
    
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error(`Error: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
}

async function readMessage(args) {
  if (!args.inbox_id || !args.message_id) {
    console.error('Required: --inbox_id, --message_id');
    process.exit(1);
  }
  
  const encodedMessageId = encodeURIComponent(args.message_id);
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'GET');
  
  if (response.status >= 200 && response.status < 300) {
    // Mark as seen locally
    const seen = loadSeenMessages();
    if (!seen[args.inbox_id]) seen[args.inbox_id] = [];
    if (!seen[args.inbox_id].includes(args.message_id)) {
      seen[args.inbox_id].push(args.message_id);
      saveSeenMessages(seen);
    }
    
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error(`Error: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
}

async function sendEmail(args) {
  if (!args.inbox_id || !args.to || !args.subject || !args.text) {
    console.error('Required: --inbox_id, --to, --subject, --text');
    process.exit(1);
  }
  
  const data = {
    to: args.to,
    subject: args.subject,
    text: args.text
  };
  
  if (args.html) data.html = args.html;
  if (args.cc) data.cc = args.cc;
  if (args.bcc) data.bcc = args.bcc;
  if (args.reply_to) data.reply_to = args.reply_to;
  
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/send`, 'POST', data);
  if (response.status >= 200 && response.status < 300) {
    console.log('Email sent successfully');
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error(`Error: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
}

async function replyToMessage(args) {
  if (!args.inbox_id || !args.message_id || !args.text) {
    console.error('Required: --inbox_id, --message_id, --text');
    process.exit(1);
  }
  
  const data = { text: args.text };
  if (args.html) data.html = args.html;
  
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${args.message_id}/reply`, 'POST', data);
  if (response.status >= 200 && response.status < 300) {
    console.log('Reply sent successfully');
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error(`Error: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
}

async function forwardMessage(args) {
  if (!args.inbox_id || !args.message_id || !args.to) {
    console.error('Required: --inbox_id, --message_id, --to');
    process.exit(1);
  }
  
  const data = { to: args.to };
  if (args.text) data.text = args.text;
  
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${args.message_id}/forward`, 'POST', data);
  if (response.status >= 200 && response.status < 300) {
    console.log('Message forwarded successfully');
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error(`Error: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
}

async function markRead(args) {
  if (!args.inbox_id || !args.message_ids) {
    console.error('Required: --inbox_id, --message_ids');
    process.exit(1);
  }
  
  const messageIds = args.message_ids.split(',').map(id => id.trim());
  
  const data = {
    add_labels: ['read'],
    remove_labels: ['unread']
  };
  
  const promises = messageIds.map(async (msgId) => {
    const encodedMsgId = encodeURIComponent(msgId);
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMsgId}`, 'PATCH', data);
    return { messageId: msgId, success: response.status >= 200 && response.status < 300, status: response.status };
  });
  
  const results = await Promise.all(promises);
  console.log(JSON.stringify(results, null, 2));
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.error(`\nFailed to mark ${failed.length} message(s) as read`);
    process.exit(1);
  }
}

async function markUnread(args) {
  if (!args.inbox_id || !args.message_ids) {
    console.error('Required: --inbox_id, --message_ids');
    process.exit(1);
  }
  
  const messageIds = args.message_ids.split(',').map(id => id.trim());
  
  const data = {
    add_labels: ['unread'],
    remove_labels: ['read']
  };
  
  const promises = messageIds.map(async (msgId) => {
    const encodedMsgId = encodeURIComponent(msgId);
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMsgId}`, 'PATCH', data);
    return { messageId: msgId, success: response.status >= 200 && response.status < 300, status: response.status };
  });
  
  const results = await Promise.all(promises);
  console.log(JSON.stringify(results, null, 2));
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.error(`\nFailed to mark ${failed.length} message(s) as unread`);
    process.exit(1);
  }
}

async function markAllRead(args) {
  if (!args.inbox_id) {
    console.error('Required: --inbox_id');
    process.exit(1);
  }
  
  // Get all unread messages
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages?labels=unread`);
  
  if (response.status !== 200) {
    console.error(`Error fetching messages: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    console.log('No unread messages found');
    process.exit(0);
  }
  
  console.log(`Found ${messages.length} unread messages. Marking as read...`);
  
  const data = {
    add_labels: ['read'],
    remove_labels: ['unread']
  };
  
  const promises = messages.map(async (msg) => {
    const encodedMsgId = encodeURIComponent(msg.message_id);
    const resp = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMsgId}`, 'PATCH', data);
    return { messageId: msg.message_id, success: resp.status >= 200 && resp.status < 300 };
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\nMarked ${successCount}/${messages.length} messages as read`);
  
  if (failCount > 0) {
    console.error(`${failCount} messages failed`);
    process.exit(1);
  }
}

async function listUnread(args) {
  if (!args.inbox_id) {
    console.error('Required: --inbox_id');
    process.exit(1);
  }
  
  const response = await makeRequest(`/inboxes/${args.inbox_id}/messages?labels=unread`);
  
  if (response.status !== 200) {
    console.error(`Error fetching messages: HTTP ${response.status}`);
    console.error(response.data);
    process.exit(1);
  }
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    console.log('No unread messages');
    process.exit(0);
  }
  
  console.log(`Found ${messages.length} unread message(s):\n`);
  messages.forEach(msg => {
    console.log(`- ${msg.subject} from ${msg.from} (${msg.timestamp})`);
  });
}

// Main CLI handler
const commands = {
  list: listMessages,
  'list-unread': listUnread,
  read: readMessage,
  send: sendEmail,
  reply: replyToMessage,
  forward: forwardMessage,
  'mark-read': markRead,
  'mark-unread': markUnread,
  'mark-all-read': markAllRead
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = parseArgs(args.slice(1));
  
  if (!command || !commands[command]) {
    console.log('Email Manager - AgentMail Client');
    console.log('\nUsage:');
    console.log('  node email-client.js <command> [options]');
    console.log('\nCommands:');
    console.log('  list           List all messages (--inbox_id, [--limit], [--labels unread])');
    console.log('  list-unread    List only unread messages (--inbox_id)');
    console.log('  read           Read specific message (--inbox_id, --message_id)');
    console.log('  send           Send email (--inbox_id, --to, --subject, --text)');
    console.log('  reply          Reply to message (--inbox_id, --message_id, --text)');
    console.log('  forward        Forward message (--inbox_id, --message_id, --to)');
    console.log('  mark-read      Mark messages as read (--inbox_id, --message_ids)');
    console.log('  mark-unread    Mark messages as unread (--inbox_id, --message_ids)');
    console.log('  mark-all-read  Mark all unread as read (--inbox_id)');
    console.log('\nNote: Uses AgentMail labels (read/unread) for status tracking.');
    process.exit(command ? 1 : 0);
  }
  
  try {
    await commands[command](params);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
