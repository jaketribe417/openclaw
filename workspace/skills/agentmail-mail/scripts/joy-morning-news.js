#!/usr/bin/env node
/**
 * Joy Morning News Script
 * Fetches top 10 news stories and sends email at 5:30 AM
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const SCRIPT_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '../../..');
const LOG_DIR = path.join(WORKSPACE_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'email-actions.log');

const INBOX_ID = 'jaketribe_bot@agentmail.to';
const AGENTMAIL_API_KEY = 'am_us_5f0ebaa863e9ded76347d308acf9ca8a7f9d202b06ec2842789a38c9d4f0b874';

// News API configuration (using NewsAPI.org - free tier available)
const NEWS_API_KEY = 'e930b421a957414d864812ad4c9f57ce';

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

function fetchNewsFromAPI() {
  return new Promise((resolve, reject) => {
    // Calculate date for past 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];
    
    const options = {
      hostname: 'newsapi.org',
      port: 443,
      path: `/v2/top-headlines?country=us&from=${fromDate}&sortBy=popularity&pageSize=10&apiKey=${NEWS_API_KEY}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JoyEmailAgent/1.0 (OpenClaw; jason@hansentribe.com)'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.status === 'ok' && json.articles) {
            const stories = json.articles.map(article => ({
              title: article.title,
              source: article.source?.name || 'Unknown',
              published: article.publishedAt,
              url: article.url,
              description: article.description
            }));
            resolve(stories);
          } else {
            reject(new Error(json.message || 'NewsAPI error'));
          }
        } catch (e) {
          reject(new Error('Failed to parse NewsAPI response'));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('NewsAPI request timeout'));
    });
    req.end();
  });
}

async function sendMorningNewsEmail(stories) {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const emailBody = `Good Morning!

Here's your daily news briefing for ${today}:

TOP ${stories.length} NEWS STORIES
${'='.repeat(50)}

${stories.map((story, i) => 
  `${i + 1}. ${story.title}
   Source: ${story.source}
   ${story.description ? '\n   ' + story.description.substring(0, 150) + (story.description.length > 150 ? '...' : '') : ''}
   ${story.url ? '\n   Read more: ' + story.url : ''}
   `.trim()
).join('\n\n')}

${'='.repeat(50)}

Have a great day!
- Joy

---
This message was sent by Joy (OpenClaw Email Agent)
Inbox: ${INBOX_ID}
`;

  const emailData = {
    to: 'jason@hansentribe.com',
    subject: `Morning News Briefing - ${today}`,
    text: emailBody
  };
  
  const encodedInboxId = encodeURIComponent(INBOX_ID);
  // Correct endpoint: /inboxes/{inbox_id}/messages/send
  return await agentmailRequest(`/inboxes/${encodedInboxId}/messages/send`, 'POST', emailData);
}

// Main execution
async function main() {
  console.log('Fetching morning news from NewsAPI...');
  logAction('MORNING_NEWS: Starting news fetch from NewsAPI');
  
  try {
    const stories = await fetchNewsFromAPI();
    
    if (stories.length === 0) {
      console.log('No news stories found');
      logAction('MORNING_NEWS: No stories found');
      process.exit(0);
    }
    
    console.log(`Found ${stories.length} news stories`);
    stories.forEach((story, i) => {
      console.log(`  ${i + 1}. ${story.title}`);
    });
    
    // Send email
    console.log('\nSending morning news email...');
    const response = await sendMorningNewsEmail(stories.slice(0, 10));
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✓ Morning news email sent successfully');
      logAction(`MORNING_NEWS: Sent email with ${stories.length} stories`);
      process.exit(0);
    } else {
      console.error('Email API response:', response.data);
      throw new Error(`Email API returned status ${response.status}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    logAction(`MORNING_NEWS_ERROR: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
