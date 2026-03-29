# AgentMail Email

Send, receive, and manage emails via AgentMail API. Gives your agent its own email identity for communicating with services, people, and other agents.

## When to Use

**USE email when:**
- User explicitly asks to send an email
- Receiving notifications from external services
- Communicating with humans who prefer email
- Signing up for services that require email verification
- Receiving reports, invoices, or automated updates
- Need a persistent communication record

**DON'T use email when:**
- Immediate response needed (use chat/Discord instead)
- File transfer (use dedicated file sharing)
- Sensitive data transmission (verify encryption first)
- Spam or unsolicited messages

## Setup Requirements

1. API key from https://console.agentmail.to
2. Key format: `am_...` or `am_us_...`
3. Set in scripts or via `AGENTMAIL_API_KEY` environment variable

## Tools

### mail_create_inbox

Create a new email inbox for the agent.

**Parameters:**
- `username` (string, optional): Custom username (inbox address will be username@domain)
- `domain` (string, optional): Domain for the inbox
- `display_name` (string, optional): Display name shown to recipients

**Returns:** Inbox object with id, email address, and credentials

### mail_send

Send an email from an inbox.

**Parameters:**
- `inbox_id` (string, required): ID of the sending inbox
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject line
- `text` (string, required): Plain text body
- `html` (string, optional): HTML formatted body
- `cc` (string, optional): CC recipients (comma-separated)
- `bcc` (string, optional): BCC recipients (comma-separated)
- `reply_to` (string, optional): Reply-To address

**Returns:** Message object with id and status

### mail_list_messages

List messages in an inbox.

**Parameters:**
- `inbox_id` (string, required): Inbox to list messages from
- `limit` (number, optional): Max messages to return (default: 10)
- `page_token` (string, optional): Pagination token for next page

**Returns:** Array of message objects

### mail_get_message

Get full details of a specific message.

**Parameters:**
- `inbox_id` (string, required): Inbox containing the message
- `message_id` (string, required): Message ID to retrieve

**Returns:** Full message object with body, attachments, headers

### mail_reply

Reply to a received email.

**Parameters:**
- `inbox_id` (string, required): Inbox ID
- `message_id` (string, required): Message ID to reply to
- `text` (string, required): Reply text body
- `html` (string, optional): HTML reply body

**Returns:** Sent reply message object

### mail_forward

Forward an email to another recipient.

**Parameters:**
- `inbox_id` (string, required): Inbox ID
- `message_id` (string, required): Message ID to forward
- `to` (string, required): Recipient to forward to
- `text` (string, optional): Additional note to include

**Returns:** Forwarded message object

### mail_delete_inbox

Delete an inbox and all its messages.

**Parameters:**
- `inbox_id` (string, required): Inbox ID to delete

**Returns:** Deletion confirmation

## Best Practices

**Email composition:**
- Use clear, concise subject lines
- Include relevant context in body
- Format with paragraphs for readability
- Sign with agent identity

**Security:**
- Verify recipient addresses before sending
- Don't send sensitive data unencrypted
- Check for phishing indicators in received emails
- Report suspicious emails

**Rate limits:**
- Respect 429 responses with Retry-After header
- Implement exponential backoff for retries
- Use idempotency keys for safe retries

## API Reference

Base URL: `https://api.agentmail.to/v0/`

Full docs: https://docs.agentmail.to/api-reference
