# Email Manager Skill

Complete email management via AgentMail API. Use when managing inbox, processing emails, marking as read/unread, organizing, or responding.

## Location
`skills/email-manager/`

## Scripts

### `scripts/email-client.js` — Email Client
Full email client using AgentMail API labels for read/unread status.

**Usage:**
```bash
# List all messages
node skills/email-manager/scripts/email-client.js list --inbox_id "jaketribe_bot@agentmail.to" [--limit 10]

# List only unread messages
node skills/email-manager/scripts/email-client.js list-unread --inbox_id "jaketribe_bot@agentmail.to"

# Read specific message
node skills/email-manager/scripts/email-client.js read --inbox_id "jaketribe_bot@agentmail.to" --message_id "<msg-id>"

# Mark messages as read
node skills/email-manager/scripts/email-client.js mark-read --inbox_id "jaketribe_bot@agentmail.to" --message_ids "<id1>,<id2>"

# Mark all unread as read
node skills/email-manager/scripts/email-client.js mark-all-read --inbox_id "jaketribe_bot@agentmail.to"

# Send email
node skills/email-manager/scripts/email-client.js send --inbox_id "jaketribe_bot@agentmail.to" --to "user@example.com" --subject "Hello" --text "Body text"

# Reply to message
node skills/email-manager/scripts/email-client.js reply --inbox_id "jaketribe_bot@agentmail.to" --message_id "<msg-id>" --text "Reply text"

# Forward message
node skills/email-manager/scripts/email-client.js forward --inbox_id "jaketribe_bot@agentmail.to" --message_id "<msg-id>" --to "forward@example.com"
```

**How it works:** AgentMail uses `add_labels` and `remove_labels` via PATCH to manage read/unread status. The client handles this automatically.

### `scripts/process-inbox.js` — Automated Inbox Processing
Process inbox with rules: trusted senders auto-respond, others queue for review.

**Usage:**
```bash
node skills/email-manager/scripts/process-inbox.js --inbox_id "jaketribe_bot@agentmail.to" [--auto-respond] [--dry-run]
```

### `scripts/email-summary.js` — Daily/Periodic Summary
Generate summary of new emails since last check.

**Usage:**
```bash
node skills/email-manager/scripts/email-summary.js --inbox_id "jaketribe_bot@agentmail.to" [--since "2026-03-29T00:00:00Z"]
```

## Configuration

Create `skills/email-manager/config.json`:
```json
{
  "active_inbox": "jaketribe_bot@agentmail.to",
  "trusted_senders": [
    "Jason@hansentribe.com",
    "thehansentribe@gmail.com",
    "jhansen@trustlineage.com"
  ],
  "processing_rules": {
    "trusted": {
      "action": "process",
      "auto_respond": false,
      "mark_read": true
    },
    "untrusted": {
      "action": "human_review",
      "folder": "human_to_read",
      "notify": true
    }
  },
  "default_model": "ollama/qwen3.5:0.8b",
  "notification_channel": "telegram:8382558273"
}
```

## When to Use

**Use this skill when:**
- Checking inbox for new messages
- Processing emails from trusted senders
- Marking emails as read/unread
- Deleting spam or old messages
- Sending email responses
- Organizing emails into folders
- Generating email summaries

**NOT for:**
- Immediate real-time chat (use direct messaging)
- Emails requiring complex decision-making without human review

## API Key

AgentMail API key is hardcoded in scripts. Console: https://console.agentmail.to

## Cron Integration

For automated checks, add to openclaw.json:
```json
{
  "cron": [
    {
      "name": "email-manager-check",
      "schedule": "*/10 * * * *",
      "command": "node skills/email-manager/scripts/process-inbox.js --inbox_id \"jaketribe_bot@agentmail.to\"",
      "cwd": "/Users/Jack/.openclaw/workspace",
      "model": "ollama/qwen3.5:0.8b",
      "notify": "telegram:8382558273"
    }
  ]
}
```

## Memory Integration

After processing emails, log actions to `logs/email-actions.log`:
```
[TIMESTAMP] ACTION: [read|delete|move|send] | FROM: [sender] | SUBJECT: [subject] | RESULT: [success|failed]
```

---

**Maintainer:** Jake  
**Last Updated:** 2026-03-29
