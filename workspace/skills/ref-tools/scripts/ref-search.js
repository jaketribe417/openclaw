#!/usr/bin/env node
/**
 * Ref Search Documentation Tool
 * Search technical documentation via Ref API using MCP over HTTP
 */

const https = require('https');

const API_KEY = process.env.REF_API_KEY || 'ref-ee7f15a37c3469621906';
const API_HOST = 'api.ref.tools';

function makeRequest(path, method = 'GET', data = null, sessionId = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'x-ref-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };
    
    if (sessionId) {
      headers['mcp-session-id'] = sessionId;
    }

    const options = {
      hostname: API_HOST,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          // Handle newline-delimited JSON (NDJSON) for MCP streams
          const lines = body.split('\n').filter(line => line.trim());
          const results = lines.map(line => JSON.parse(line));
          resolve({ 
            status: res.statusCode, 
            data: results.length === 1 ? results[0] : results,
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function initializeSession() {
  const initRequest = {
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'openclaw-ref-client',
        version: '1.0.0'
      }
    }
  };

  const response = await makeRequest('/mcp', 'POST', initRequest);
  
  if (response.status >= 200 && response.status < 300) {
    // Get session ID from response headers or data
    const sessionId = response.headers['mcp-session-id'] || 
                     (Array.isArray(response.data) ? response.data[0]?.result?.sessionId : null);
    
    if (!sessionId) {
      throw new Error('No session ID received from server');
    }

    // Send initialized notification
    await makeRequest('/mcp', 'POST', {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }, sessionId);

    return sessionId;
  } else {
    throw new Error(`Initialization failed: HTTP ${response.status}`);
  }
}

async function searchDocumentation(query) {
  let sessionId = null;
  
  try {
    // Initialize MCP session
    sessionId = await initializeSession();
    
    // Call the search tool
    const response = await makeRequest('/mcp', 'POST', {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'ref_search_documentation',
        arguments: { query: query }
      }
    }, sessionId);

    if (response.status >= 200 && response.status < 300) {
      const results = Array.isArray(response.data) ? response.data : [response.data];
      const successResult = results.find(r => r.result && !r.error);
      
      if (successResult) {
        console.log(JSON.stringify(successResult.result, null, 2));
      } else {
        console.error('Error in response:', JSON.stringify(response.data, null, 2));
        process.exit(1);
      }
    } else {
      console.error(`Error: HTTP ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const queryIndex = args.findIndex(arg => arg === '--query' || arg === '-q');
const query = queryIndex !== -1 && args[queryIndex + 1] ? args[queryIndex + 1] : args.join(' ');

if (!query) {
  console.error('Usage: ref-search.js --query "<search terms>"');
  console.error('   or: ref-search.js "<search terms>"');
  process.exit(1);
}

searchDocumentation(query);
