#!/usr/bin/env node
/**
 * Mem0 Memory Client
 * HTTP client for local Mem0 OSS instance
 */

const http = require('http');

const MEM0_HOST = process.env.MEM0_HOST || 'localhost';
const MEM0_PORT = process.env.MEM0_PORT || 8888;
const MEM0_BASE = '';

function makeRequest(path, method = 'GET', data = null, userId = 'openclaw') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: MEM0_HOST,
      port: MEM0_PORT,
      path: `${MEM0_BASE}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add user_id to query for GET requests
    if (method === 'GET' && !path.includes('?')) {
      options.path += `?user_id=${userId}`;
    }

    const req = http.request(options, (res) => {
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

    req.on('error', reject);
    
    if (data) {
      // Add user_id to body for POST requests
      if (typeof data === 'object') {
        data.user_id = userId;
      }
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const commands = {
  async capture(args) {
    if (!args.content) {
      console.error('Required: --content "memory text"');
      process.exit(1);
    }

    const data = {
      messages: [
        { role: 'user', content: args.content }
      ]
    };

    if (args.category) {
      data.metadata = { category: args.category };
    }

    const response = await makeRequest('/memories', 'POST', data);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async search(args) {
    if (!args.query) {
      console.error('Required: --query "search text"');
      process.exit(1);
    }

    const data = {
      query: args.query,
      user_id: 'openclaw'
    };

    const response = await makeRequest('/search', 'POST', data);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async list(args) {
    const limit = args.limit || 10;
    const response = await makeRequest(`/memories`, 'GET', null, 'openclaw');
    
    if (response.status >= 200 && response.status < 300) {
      // Limit results if needed
      const data = Array.isArray(response.data) ? response.data.slice(0, limit) : response.data;
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async delete(args) {
    if (!args.memory_id) {
      console.error('Required: --memory_id "id"');
      process.exit(1);
    }

    const response = await makeRequest(`/memories/${args.memory_id}`, 'DELETE');
    
    if (response.status >= 200 && response.status < 300) {
      console.log(JSON.stringify({ deleted: true, memory_id: args.memory_id }, null, 2));
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  },

  async health() {
    const response = await makeRequest('/health', 'GET', null, '');
    console.log(JSON.stringify({ status: response.status, data: response.data }, null, 2));
  }
};

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const parsed = { command };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-/g, '_');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      parsed[key] = value;
    }
  }
  
  return parsed;
}

async function main() {
  const args = parseArgs();
  
  if (!args.command || args.command === 'help') {
    console.log(`Mem0 Memory Client

Commands:
  capture --content "memory text" [--category learning|preference|fact|task]
    Store a memory in Mem0

  search --query "search text"
    Search memories

  list [--limit N]
    List all memories

  delete --memory_id "id"
    Delete a memory

  health
    Check Mem0 connection

Environment:
  MEM0_HOST=localhost (default)
  MEM0_PORT=8888 (default)
`);
    process.exit(0);
  }
  
  const handler = commands[args.command] || commands[args.command.replace(/-/g, '_')];
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
