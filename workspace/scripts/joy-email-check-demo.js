#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const joyEmailConfig = path.join(__dirname, 'joy-email-check.json');
const configPath = joyEmailConfig;

if (!fs.existsSync(configPath)) {
  console.log('Config file not found, starting demo mode');
} else {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const { joy, joyName, joyToken, inboxId } = joy;
  
  console.log('Joy email config: inbox ID = ' + inboxId);
  console.log('Joy name = ' + joyName);
  console.log('Joy token = ' + joyToken);
  
  const results = {
    unreadCount: 0,
    logs: []
  };
  
  console.log('Opening joy inbox...');
  const emailsData = fs.readFileSync(inboxId, 'utf8');
  console.log('Opened file:', inboxId);
  console.log('Messages:', emailsData.length);
  
  // Simple CSV parsing
  const emailHeaders = emailsData.split('\n');
  if (emailHeaders.length > 0) {
    results.logged = true;
    console.log('Logged as new entry');
    results.logs.push(emailsData);
    results.unreadCount++;
  } else {
    console.log('No emails');
  }
  
  console.log('\n=== NEW UNREAD EMAILS ===');
  console.log('Count:', results.unreadCount);
  
  if (results.unreadCount > 0) {
    console.log('\n--- New unread emails ---');
    console.log(emailsData);
  }
  
  fs.writeFileSync(path.join(__dirname, 'logs/joy-email-check.log'), JSON.stringify(results, null, 2));
  console.log('\nSaved to: ' + path.join(__dirname, 'logs/joy-email-check.log'));
  
  console.log('Result:', results.logged ? 'logged' : 'not logged');
}
