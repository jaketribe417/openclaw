# AgentMail Email Skill

Send, receive, and manage emails via AgentMail API. Complete email client for AI agents with trusted sender filtering.

## Status: Ready

✓ Inbox creation: Working  
✓ Send email: Working  
✓ List messages: Working  
✓ List inboxes: Working  
✓ Delete inbox: Working  
✓ Email processor: Working with sender filtering  

## Active Configuration

**Inbox:** `jaketribe_bot@agentmail.to`  
**Trusted Senders (auto-process):**
- Jason@hansentribe.com
- thehansentribe@gmail.com  
- jhansen@trustlineage.com

**Other emails:** Queued for human review

## Quick Start

```bash
# Send an email
node scripts/mail-client.js send \
  --inbox_id "jaketribe_bot@agentmail.to" \
  --to "recipient@example.com" \
  --subject "Hello" \
  --text "Email body here"

# Process inbox (applies trusted sender filter)
node scripts/process-emails.js

# List messages
node scripts/mail-client.js list --inbox_id "jaketribe_bot@agentmail.to"

# List all inboxes
node scripts/mail-client.js list-inboxes
```

## Email Processing

The `process-emails.js` script:
1. Fetches all messages from inbox
2. Sorts by trusted vs untrusted senders
3. Trusted emails: Displayed for agent processing
4. Untrusted emails: Queued for human review

## Configuration

**API key:** Hardcoded in `scripts/mail-client.js`

**Or set via environment:**
```bash
export AGENTMAIL_API_KEY="your-key"
```

**Trusted senders:** Edit `EMAIL_CONFIG.json` or `scripts/process-emails.js`

## API Reference

Base URL: `https://api.agentmail.to/v0/`

Full docs: https://docs.agentmail.to/api-reference

## Files

```
skills/agentmail-mail/
├── SKILL.md                 # Full documentation
├── README.md                # This file
├── EMAIL_CONFIG.json        # Trusted sender configuration
└── scripts/
    ├── mail-client.js       # Main email client
    ├── process-emails.js    # Inbox processor with filtering
    └── demo.js              # Demo/test script
```

## Current Inbox Contents

- 1 trusted message from Jason@hansentribe.com
- 5 messages queued for human review (1Password alerts, test emails)

## Usage Guidelines

**When to use email:**
- External service communications
- User requests email specifically
- Persistent communication records
- Service signups requiring email

**When NOT to use email:**
- Immediate responses (use Discord/chat)
- File transfers (use dedicated services)
- Sensitive data without encryption
