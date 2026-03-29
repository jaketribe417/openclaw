#!/usr/bin/env node
/**
 * Joy Calendar Summary Script
 * Fetches calendar events and sends email summaries
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const ical = require('node-ical');

const SCRIPT_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '../../..');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');

const INBOX_ID = 'jaketribe_bot@agentmail.to';
const AGENTMAIL_API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';
const CALENDAR_ICS_URL = 'https://outlook.office365.com/owa/calendar/52a816b45a1a4094bb730a58bdce1d52@trustlineage.com/5467452737d64f0885c7768afc39da9714792854711991855401/calendar.ics';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function logAction(entry) {
  const logEntry = `[${getTimestamp()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

function fetchCalendar() {
  return new Promise((resolve, reject) => {
    const req = https.get(CALENDAR_ICS_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = ical.parseICS(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse calendar: ' + e.message));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Calendar fetch timeout'));
    });
  });
}

function getEventsForDate(events, targetDate) {
  const targetStart = new Date(targetDate);
  targetStart.setHours(0, 0, 0, 0);
  const targetEnd = new Date(targetDate);
  targetEnd.setHours(23, 59, 59, 999);
  
  return Object.values(events)
    .filter(event => {
      if (event.type !== 'VEVENT') return false;
      const eventStart = new Date(event.start);
      return eventStart >= targetStart && eventStart <= targetEnd;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

function getEventsForWeek(events, weekStart) {
  const weekEvents = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayName = days[dayDate.getDay()];
    const dateStr = dayDate.toDateString();
    
    const dayEvents = getEventsForDate(events, dayDate);
    if (dayEvents.length > 0) {
      weekEvents[dayName] = { date: dateStr, events: dayEvents };
    }
  }
  
  return weekEvents;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function agentmailRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.agentmail.to',
      port: 443,
      path: '/v0' + path,
      method: method,
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

async function sendDailySummary(events, targetDate) {
  const dateStr = targetDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let emailBody;
  
  if (events.length === 0) {
    emailBody = `Good Morning!

Your calendar for ${dateStr}:

No meetings scheduled today. Enjoy your free day!

Have a great day!
- Joy

---
This message was sent by Joy (OpenClaw Email Agent)
Inbox: ${INBOX_ID}
`;
  } else {
    const eventsList = events.map(event => {
      const time = formatTime(event.start);
      const duration = event.end ? 
        Math.round((new Date(event.end) - new Date(event.start)) / 60000) + ' min' : 
        'TBD';
      return `  ${time} - ${event.summary} (${duration})`;
    }).join('\n');
    
    emailBody = `Good Morning!

Your calendar for ${dateStr}:

MEETINGS TODAY (${events.length})
${'='.repeat(50)}

${eventsList}

${'='.repeat(50)}

Have a great day!
- Joy

---
This message was sent by Joy (OpenClaw Email Agent)
Inbox: ${INBOX_ID}
`;
  }

  const emailData = {
    to: 'jhansen@trustlineage.com',
    subject: `Daily Calendar Summary - ${dateStr}`,
    text: emailBody
  };
  
  const encodedInboxId = encodeURIComponent(INBOX_ID);
  return await agentmailRequest(`/inboxes/${encodedInboxId}/messages/send`, 'POST', emailData);
}

async function sendWeeklySummary(weekEvents, weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  let emailBody = `Good Morning!

Your weekly calendar summary for ${dateRange}:

`;
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  for (const day of workDays) {
    if (weekEvents[day]) {
      const { date, events } = weekEvents[day];
      emailBody += `${day.toUpperCase()} (${date})\n`;
      emailBody += `${'-'.repeat(40)}\n`;
      
      if (events.length === 0) {
        emailBody += '  No meetings\n';
      } else {
        events.forEach(event => {
          const time = formatTime(event.start);
          emailBody += `  ${time} - ${event.summary}\n`;
        });
      }
      
      emailBody += '\n';
    }
  }
  
  emailBody += `---
Have a great week!
- Joy

This message was sent by Joy (OpenClaw Email Agent)
Inbox: ${INBOX_ID}
`;

  const emailData = {
    to: 'jhansen@trustlineage.com',
    subject: `Weekly Calendar Summary - ${dateRange}`,
    text: emailBody
  };
  
  const encodedInboxId = encodeURIComponent(INBOX_ID);
  return await agentmailRequest(`/inboxes/${encodedInboxId}/messages/send`, 'POST', emailData);
}

// Main execution
async function main() {
  const mode = process.argv[2] || 'daily';
  
  console.log(`Running calendar summary (${mode})...`);
  logAction(`CALENDAR: Starting ${mode} summary`);
  
  try {
    // Check if node-ical is installed
    try {
      require.resolve('node-ical');
    } catch (e) {
      console.log('Installing node-ical package...');
      const { execSync } = require('child_process');
      execSync('npm install node-ical', { cwd: WORKSPACE_DIR, stdio: 'inherit' });
    }
    
    const events = await fetchCalendar();
    console.log(`Fetched ${Object.keys(events).length} calendar events`);
    
    if (mode === 'weekly') {
      // Get Monday of current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const weekEvents = getEventsForWeek(events, monday);
      console.log('Sending weekly summary...');
      const response = await sendWeeklySummary(weekEvents, monday);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✓ Weekly summary sent successfully');
        logAction('CALENDAR: Sent weekly summary');
      } else {
        throw new Error(`Email API returned status ${response.status}`);
      }
    } else {
      // Daily mode
      const today = new Date();
      const dayEvents = getEventsForDate(events, today);
      
      console.log(`Found ${dayEvents.length} events for today`);
      
      const response = await sendDailySummary(dayEvents, today);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✓ Daily summary sent successfully');
        logAction(`CALENDAR: Sent daily summary with ${dayEvents.length} events`);
      } else {
        throw new Error(`Email API returned status ${response.status}`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    logAction(`CALENDAR_ERROR: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
