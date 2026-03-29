#!/usr/bin/env node
/**
 * Test script to explore AgentMail API endpoints
 */

const https = require('https');

const API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const API_HOST = 'api.agentmail.to';
const API_BASE = '/v0';

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
        console.log(`\n=== ${method} ${apiPath} ===`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          console.log(JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(body);
        }
        resolve({ status: res.statusCode, data: body });
      });
    });

    req.on('error', (err) => reject(err));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoints() {
  const inboxId = 'jaketribe_bot@agentmail.to';
  
  // List messages to get a message ID
  console.log('Testing AgentMail API endpoints...\n');
  
  const listResp = await makeRequest(`/inboxes/${inboxId}/messages`);
  const messages = listResp.data.messages || [];
  
  if (messages.length > 0) {
    const msgId = messages[0].message_id;
    console.log(`\nUsing message ID: ${msgId}\n`);
    
    // Try PATCH with labels_remove
    await makeRequest(`/inboxes/${inboxId}/messages/${encodeURIComponent(msgId)}`, 'PATCH', { labels_remove: ['unread'] });
    
    // Try PUT
    await makeRequest(`/inboxes/${inboxId}/messages/${encodeURIComponent(msgId)}`, 'PUT', { labels: ['received'] });
    
    // Try labels endpoint
    await makeRequest(`/inboxes/${inboxId}/messages/${encodeURIComponent(msgId)}/labels`, 'POST', { remove: ['unread'] });
  }
}

testEndpoints().catch(console.error);
