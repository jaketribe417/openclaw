#!/usr/bin/env node
/**
 * AgentMail Email Client
 * Send, receive, and manage emails via AgentMail API
 */

const https = require('https');

const API_KEY = process.env.AGENTMAIL_API_KEY || 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const API_HOST = 'api.agentmail.to';
const API_BASE = '/v0';

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

// CLI Commands
const commands = {
  async createinbox(args) {
    const data = {};
    if (args.username) data.username = args.username;
    if (args.domain) data.domain = args.domain;
    if (args.display_name) data.display_name = args.display_name;
    
    const response = await makeRequest('/inboxes', 'POST', data);
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async send(args) {
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
      // Explicitly add 'sent' label to ensure proper categorization
      if (response.data && response.data.message_id) {
        const encodedMessageId = encodeURIComponent(response.data.message_id);
        await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'PATCH', {
          add_labels: ['sent']
        });
      }
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async list(args) {
    if (!args.inbox_id) {
      console.error('Required: --inbox_id');
      process.exit(1);
    }
    
    let path = `/inboxes/${args.inbox_id}/messages`;
    const query = [];
    if (args.limit) query.push(`limit=${args.limit}`);
    if (args.page_token) query.push(`page_token=${args.page_token}`);
    if (query.length) path += '?' + query.join('&');
    
    const response = await makeRequest(path, 'GET');
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async get(args) {
    if (!args.inbox_id || !args.message_id) {
      console.error('Required: --inbox_id, --message_id');
      process.exit(1);
    }
    
    const encodedMessageId = encodeURIComponent(args.message_id);
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'GET');
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async reply(args) {
    if (!args.inbox_id || !args.message_id || !args.text) {
      console.error('Required: --inbox_id, --message_id, --text');
      process.exit(1);
    }
    
    const data = { text: args.text };
    if (args.html) data.html = args.html;
    
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${args.message_id}/reply`, 'POST', data);
    if (response.status >= 200 && response.status < 300) {
      // Explicitly add 'sent' label to ensure proper categorization
      if (response.data && response.data.message_id) {
        const encodedMessageId = encodeURIComponent(response.data.message_id);
        await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'PATCH', {
          add_labels: ['sent']
        });
      }
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async forward(args) {
    if (!args.inbox_id || !args.message_id || !args.to) {
      console.error('Required: --inbox_id, --message_id, --to');
      process.exit(1);
    }
    
    const data = { to: args.to };
    if (args.text) data.text = args.text;
    
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${args.message_id}/forward`, 'POST', data);
    if (response.status >= 200 && response.status < 300) {
      // Explicitly add 'sent' label to ensure proper categorization
      if (response.data && response.data.message_id) {
        const encodedMessageId = encodeURIComponent(response.data.message_id);
        await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'PATCH', {
          add_labels: ['sent']
        });
      }
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async update(args) {
    if (!args.inbox_id || !args.message_id) {
      console.error('Required: --inbox_id, --message_id, and at least one of: --add-labels or --remove-labels');
      process.exit(1);
    }
    
    // The parser keeps dashes in key names
    const addLabelsArg = args['add-labels'];
    const removeLabelsArg = args['remove-labels'];
    
    if (!addLabelsArg && !removeLabelsArg) {
      console.error('Required: --add-labels or --remove-labels');
      console.error('Got args:', Object.keys(args).join(', '));
      process.exit(1);
    }
    
    const data = {};
    if (addLabelsArg) {
      data.add_labels = String(addLabelsArg).split(',').map(l => l.trim());
    }
    if (removeLabelsArg) {
      data.remove_labels = String(removeLabelsArg).split(',').map(l => l.trim());
    }
    
    const encodedMessageId = encodeURIComponent(args.message_id);
    const response = await makeRequest(`/inboxes/${args.inbox_id}/messages/${encodedMessageId}`, 'PATCH', data);
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async deleteinbox(args) {
    if (!args.inbox_id) {
      console.error('Required: --inbox_id');
      process.exit(1);
    }
    
    const response = await makeRequest(`/inboxes/${args.inbox_id}`, 'DELETE');
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify({ success: true, inbox_id: args.inbox_id }, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async listinboxes() {
    const response = await makeRequest('/inboxes', 'GET');
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  }
};

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const parsed = { command };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      parsed[key] = value;
    }
  }
  
  return parsed;
}

// Main
async function main() {
  const args = parseArgs();
  
  if (!args.command || args.command === 'help') {
    console.log(`AgentMail Email Client

Commands:
  create-inbox [--username name] [--domain domain] [--display_name name]
    Create a new email inbox

  send --inbox_id ID --to email --subject "subject" --text "body"
    Send an email

  list --inbox_id ID [--limit N]
    List messages in inbox

  get --inbox_id ID --message_id ID
    Get a specific message

  reply --inbox_id ID --message_id ID --text "reply body"
    Reply to an email

  forward --inbox_id ID --message_id ID --to email [--text note]
    Forward an email

  delete-inbox --inbox_id ID
    Delete an inbox

  list-inboxes
    List all inboxes

  update --inbox_id ID --message_id ID --add-labels "label1,label2" [--remove-labels "label3,label4"]
    Update message labels (add/remove labels from a message)
`);
    process.exit(0);
  }
  
  const handler = commands[args.command.replace(/-/g, '')] || commands[args.command];
  if (!handler) {
    console.error(`Unknown command: ${args.command}`);
    process.exit(1);
  }
  
  await handler(args);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
