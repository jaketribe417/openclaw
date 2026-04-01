#!/usr/bin/env node
/**
 * Quick email check for Joy
 */

const https = require('https');

const API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const API_HOST = 'api.agentmail.to';
const INBOX_ID = 'jaketribe_bot@agentmail.to';

const TRUSTED_SENDERS = [
  'Jason@hansentribe.com',
  'thehansentribe@gmail.com',
  'jhansen@trustlineage.com'
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: '/v0' + path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const data = await makeRequest(`/inboxes/${encodeURIComponent(INBOX_ID)}/messages`);
    
    if (!data.data || data.data.length === 0) {
      console.log('No emails in inbox.');
      return;
    }
    
    const messages = data.data;
    const trustedEmails = messages.filter(msg => 
      TRUSTED_SENDERS.includes(msg.from?.address)
    );
    
    if (trustedEmails.length === 0) {
      console.log('No new emails from trusted senders.');
      console.log(`Total emails in inbox: ${messages.length}`);
      return;
    }
    
    console.log(`Found ${trustedEmails.length} email(s) from trusted senders:\n`);
    
    for (const msg of trustedEmails) {
      console.log('---');
      console.log(`From: ${msg.from?.address} (${msg.from?.name || 'Unknown'})`);
      console.log(`Subject: ${msg.subject || '(No subject)'}`);
      console.log(`Date: ${msg.created_at || 'Unknown'}`);
      console.log(`Message ID: ${msg.id}`);
      if (msg.text) {
        const preview = msg.text.substring(0, 200).replace(/\n/g, ' ');
        console.log(`Preview: ${preview}${msg.text.length > 200 ? '...' : ''}`);
      }
      console.log('---\n');
    }
    
  } catch (err) {
    console.error('Error checking email:', err.message);
    process.exit(1);
  }
}

main();
