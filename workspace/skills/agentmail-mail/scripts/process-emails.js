#!/usr/bin/env node
/**
 * Email Processor
 * Process incoming emails according to trusted sender rules
 */

const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;
const INBOX_ID = 'jaketribe_bot@agentmail.to';
const TRUSTED_SENDERS = [
  'Jason@hansentribe.com',
  'thehansentribe@gmail.com',
  'jhansen@trustlineage.com'
];

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function isTrustedSender(from) {
  // Extract email from "Name <email>" format
  const match = from.match(/<([^>]+)>/);
  const email = match ? match[1] : from;
  const normalized = normalizeEmail(email);
  
  return TRUSTED_SENDERS.some(trusted => 
    normalizeEmail(trusted) === normalized
  );
}

function extractEmailAddress(from) {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

console.log('=== Email Processor ===\n');
console.log(`Checking inbox: ${INBOX_ID}`);
console.log(`Trusted senders: ${TRUSTED_SENDERS.join(', ')}\n`);

// Fetch messages
try {
  const result = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" list --inbox_id "${INBOX_ID}"`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const data = JSON.parse(result);
  
  if (!data.messages || data.messages.length === 0) {
    console.log('No messages in inbox.');
    process.exit(0);
  }
  
  console.log(`Found ${data.count} message(s)\n`);
  
  const trustedMessages = [];
  const otherMessages = [];
  
  for (const msg of data.messages) {
    if (isTrustedSender(msg.from)) {
      trustedMessages.push(msg);
    } else {
      otherMessages.push(msg);
    }
  }
  
  // Process trusted messages
  if (trustedMessages.length > 0) {
    console.log(`\n[TRUSTED] ${trustedMessages.length} message(s) from trusted senders:`);
    console.log('='.repeat(50));
    
    for (const msg of trustedMessages) {
      console.log(`\nFrom: ${msg.from}`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Date: ${msg.timestamp}`);
      console.log(`Preview: ${msg.preview?.substring(0, 100)}...`);
      console.log(`Message ID: ${msg.message_id}`);
      console.log('-'.repeat(50));
    }
  }
  
  // Queue other messages for human review
  if (otherMessages.length > 0) {
    console.log(`\n\n[HUMAN REVIEW] ${otherMessages.length} message(s) from other senders:`);
    console.log('='.repeat(50));
    
    for (const msg of otherMessages) {
      const senderEmail = extractEmailAddress(msg.from);
      console.log(`\nFrom: ${msg.from}`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Sender Email: ${senderEmail}`);
      console.log(`Action: QUEUE FOR HUMAN REVIEW`);
      console.log('-'.repeat(50));
    }
  }
  
  console.log('\n\n=== Summary ===');
  console.log(`Trusted messages to process: ${trustedMessages.length}`);
  console.log(`Messages for human review: ${otherMessages.length}`);
  console.log(`\nActive inbox: ${INBOX_ID}`);
  
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
