#!/usr/bin/env node
/**
 * Joy Email Check - Deep Debug
 * Examine full API response structure
 */

const https = require('https');

const INBOX_ID = 'jaketribe_bot@agentmail.to';
const AGENTMAIL_API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';

function agentmailRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.agentmail.to',
      port: 443,
      path: '/v0' + path,
      method: 'GET',
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
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Checking inbox...\n');
  
  const encodedInboxId = encodeURIComponent(INBOX_ID);
  
  // First check inbox info
  console.log('=== INBOX INFO ===');
  const inboxInfo = await agentmailRequest(`/inboxes/${encodedInboxId}`);
  console.log(`Status: ${inboxInfo.status}`);
  console.log(`Data:`, JSON.stringify(inboxInfo.data, null, 2));
  
  // Check messages
  console.log('\n=== MESSAGES ===');
  const messages = await agentmailRequest(`/inboxes/${encodedInboxId}/messages`);
  console.log(`Status: ${messages.status}`);
  console.log(`Full response:`, JSON.stringify(messages.data, null, 2));
  
  // Check if there are pagination fields
  if (messages.data) {
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Keys:', Object.keys(messages.data));
    if (messages.data.pagination) {
      console.log('Pagination:', messages.data.pagination);
    }
    if (messages.data.meta) {
      console.log('Meta:', messages.data.meta);
    }
    if (Array.isArray(messages.data.data)) {
      console.log(`Data array length: ${messages.data.data.length}`);
    }
  }
}

main().catch(console.error);
