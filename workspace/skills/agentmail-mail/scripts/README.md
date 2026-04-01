# AgentMail Email Client
AgentMail API client for sending and receiving emails via their platform.

## API Key
The API key is stored in your `.openclaw` config. When running the script, you need to set it via environment variable:
```bash
export AGENTMAIL_API_KEY="your_api_key_here"
node skills/agentmail-mail/scripts/mail-client.js
```

## Available Commands

### create-inbox [--username name] [--domain domain] [--display_name name]
Create a new email inbox with the specified details.

### send --inbox_id ID --to email --subject "subject" --text "body"
Send an email. Required: inbox_id, to, subject, text. Optional: html, cc, bcc, reply_to.

### list --inbox_id ID [--limit N]
List messages in an inbox.

### get --inbox_id ID --message_id ID
Get a specific message. Required: inbox_id, message_id.

### reply --inbox_id ID --message_id ID --text "reply body"
Reply to an email. Required: inbox_id, message_id, text. Optional: html.

### forward --inbox_id ID --message_id ID --to email [--text note]
Forward an email. Required: inbox_id, message_id, to. Optional: text.

### delete-inbox --inbox_id ID
Delete an inbox.

### list-inboxes
List all inboxes.

## Important Notes

- The joy-email-check script needs to connect to your email inbox to perform checks.
- Your inbox ID (`--inbox_id`) should be added when you create the inbox.
- All API calls require a valid Bearer token in the Authorization header.
- Use `--inbox_id` to specify the target inbox, and pass the message ID there.

## Usage Example

To send a test email:
```bash
node skills/agentmail-mail/scripts/mail-client.js send \
  --inbox_id "jaketribe_bot@agentmail.to" \
  --to "your@email.com" \
  --subject "Test Email" \
  --text "Hello! This is a test email for the joy-email-check script."
```

To check if there are any messages to forward:
```bash
node skills/agentmail-mail/scripts/joy-email-check.js
```

---

Jake