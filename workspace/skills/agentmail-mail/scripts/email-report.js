#!/usr/bin/env node
/**
 * Human-Readable Email Report
 * Generates a clean, conversational email summary
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
  const match = from.match(/<([^>]+)>/);
  const email = match ? match[1] : from;
  return TRUSTED_SENDERS.some(trusted => 
    normalizeEmail(trusted) === normalizeEmail(email)
  );
}

function extractEmailAddress(from) {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatPreview(text) {
  if (!text) return '';
  // Clean up whitespace and truncate
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
}

console.log('📧 Email Inbox Report');
console.log('═══════════════════════════════════════════\n');

try {
  const result = execSync(
    `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" list --inbox_id "${INBOX_ID}" --limit 50`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const data = JSON.parse(result);
  
  if (!data.messages || data.messages.length === 0) {
    console.log('Your inbox is empty. 📭');
    process.exit(0);
  }
  
  // Filter messages - only show UNREAD emails (not archived, sent, or read)
  // Auto-mark todo items as read
  data.messages.forEach(msg => {
    if (msg.labels?.includes('todo') && !msg.labels?.includes('read')) {
      const encodedMessageId = encodeURIComponent(msg.message_id);
      try {
        execSync(
          `node "${path.join(SCRIPT_DIR, 'mail-client.js')}" update --inbox_id "${INBOX_ID}" --message_id "${msg.message_id}" --add-labels read`,
          { encoding: 'utf8', timeout: 10000 }
        );
        // Update local labels to reflect change
        msg.labels = [...(msg.labels || []), 'read'];
      } catch (err) {
        // Silent fail
      }
    }
  });
  
  const activeMessages = data.messages.filter(msg => {
    const labels = msg.labels || [];
    return !labels.includes('archived') && !labels.includes('sent') && !labels.includes('read');
  });
  
  const trustedMessages = activeMessages.filter(msg => isTrustedSender(msg.from));
  const reviewMessages = activeMessages.filter(msg => !isTrustedSender(msg.from));
  const archivedCount = data.messages.filter(msg => msg.labels?.includes('archived')).length;
  const sentCount = data.messages.filter(msg => msg.labels?.includes('sent')).length;
  const readCount = data.messages.filter(msg => msg.labels?.includes('read')).length;
  
  // Trusted Messages Section
  if (trustedMessages.length > 0) {
    console.log(`🟢 TRUSTED EMAILS (${trustedMessages.length})`);
    console.log('─'.repeat(45));
    
    trustedMessages.forEach((msg, i) => {
      const senderName = msg.from.replace(/<[^>]+>/, '').trim() || extractEmailAddress(msg.from);
      console.log(`\n${i + 1}. "${msg.subject}"`);
      console.log(`   From: ${senderName}`);
      console.log(`   When: ${formatDate(msg.timestamp)}`);
      const preview = formatPreview(msg.preview);
      if (preview) {
        console.log(`   Preview: "${preview}"`);
      }
    });
    console.log();
  }
  
  // Human Review Section
  if (reviewMessages.length > 0) {
    console.log(`🟡 NEEDS YOUR REVIEW (${reviewMessages.length})`);
    console.log('─'.repeat(45));
    
    reviewMessages.forEach((msg, i) => {
      const senderName = msg.from.replace(/<[^>]+>/, '').trim() || msg.from;
      console.log(`\n${i + 1}. "${msg.subject}"`);
      console.log(`   From: ${senderName}`);
      console.log(`   When: ${formatDate(msg.timestamp)}`);
    });
    console.log();
  }
  
  // Summary
  console.log('📊 Summary');
  console.log('─'.repeat(45));
  console.log(`   • Unread trusted: ${trustedMessages.length}`);
  console.log(`   • Unread review: ${reviewMessages.length}`);
  if (readCount > 0) console.log(`   • Read (hidden): ${readCount}`);
  if (sentCount > 0) console.log(`   • Sent (hidden): ${sentCount}`);
  if (archivedCount > 0) console.log(`   • Archived (hidden): ${archivedCount}`);
  console.log(`\n📬 Active inbox: ${INBOX_ID}`);
  
  // Action items
  if (trustedMessages.length > 0) {
    console.log('\n✅ Action: You have trusted emails to review.');
  }
  if (reviewMessages.length > 0) {
    console.log(`⚠️  Action: ${reviewMessages.length} email(s) need your attention.`);
  }
  if (activeMessages.length === 0) {
    console.log('\n✨ Your inbox is clear!');
  }
  
} catch (err) {
  console.error('Error checking inbox:', err.message);
  process.exit(1);
}
