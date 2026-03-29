#!/usr/bin/env node
/**
 * AgentMail Email Demo
 * Demonstrates email client capabilities
 */

const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;
const INBOX_ID = 'wanderingdirection410@agentmail.to';

console.log('=== AgentMail Email Demo ===\n');

// 1. List existing inboxes
console.log('1. Listing inboxes...');
try {
  const inboxes = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" list-inboxes`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed = JSON.parse(inboxes);
  console.log(`   ✓ Found ${parsed.inboxes?.length || 0} inboxes\n`);
} catch (err) {
  console.log('   Info:', err.message);
}

// 2. List messages in inbox
console.log(`2. Listing messages in ${INBOX_ID}...`);
try {
  const messages = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" list --inbox_id "${INBOX_ID}"`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed = JSON.parse(messages);
  console.log(`   ✓ Found ${parsed.count} messages`);
  
  if (parsed.messages && parsed.messages.length > 0) {
    const msg = parsed.messages[0];
    console.log(`\n   Latest message:`);
    console.log(`   From: ${msg.from}`);
    console.log(`   Subject: ${msg.subject}`);
    console.log(`   Preview: ${msg.preview?.substring(0, 80)}...`);
    console.log(`   Labels: ${msg.labels?.join(', ')}`);
  }
  console.log();
} catch (err) {
  console.log('   Error:', err.message);
}

// 3. Send a test email
console.log(`3. Sending test email...`);
try {
  const result = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" send \\
      --inbox_id "${INBOX_ID}" \\
      --to "${INBOX_ID}" \\
      --subject "Demo Email" \\
      --text "This is a demo email sent from the AgentMail client."`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed = JSON.parse(result);
  console.log(`   ✓ Email sent`);
  console.log(`   Message ID: ${parsed.message_id}`);
  console.log(`   Thread ID: ${parsed.thread_id}\n`);
  
  // Wait for delivery
  console.log('   Waiting for delivery...');
  execSync('sleep 3');
  
  // Check messages again
  const messages2 = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" list --inbox_id "${INBOX_ID}"`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed2 = JSON.parse(messages2);
  console.log(`   ✓ Inbox now has ${parsed2.count} messages\n`);
} catch (err) {
  console.log('   Error:', err.message, '\n');
}

console.log('=== Demo Complete ===');
console.log('\nAvailable commands:');
console.log('  create-inbox [--username name] [--display_name name]');
console.log('  send --inbox_id ID --to email --subject "subj" --text "body"');
console.log('  list --inbox_id ID [--limit N]');
console.log('  list-inboxes');
console.log('  delete-inbox --inbox_id ID');
console.log('\nEmail address:', INBOX_ID);
