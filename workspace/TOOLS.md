# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Custom Skills

### AgentMail Email

Send/receive emails via AgentMail API.

**Location:** `skills/agentmail-mail/`

**Scripts:**
- `scripts/mail-client.js` — Full email client (create, send, list, delete)
- `scripts/process-emails.js` — Process inbox with sender filtering
- `scripts/joy-email-check.js` — Joy's email checker (logs to file, no orphans)
- `scripts/demo.js` — Demo/test script

**Configuration:** `EMAIL_CONFIG.json`

**Usage:**
```bash
# Send email
node skills/agentmail-mail/scripts/mail-client.js send --inbox_id "jaketribe_bot@agentmail.to" --to "user@example.com" --subject "Hello" --text "Body"

# Process inbox (filters by trusted senders)
node skills/agentmail-mail/scripts/process-emails.js

# Joy email check (logs to file, outputs summary to current chat only)
node skills/agentmail-mail/scripts/joy-email-check.js
```

**Active inbox:** `jaketribe_bot@agentmail.to`

**Trusted senders (auto-process):**
- Jason@hansentribe.com
- thehansentribe@gmail.com
- jhansen@trustlineage.com

**Other emails:** Queued for human review

**Joy Email Checks:** Use `joy-email-check.js` — logs actions to `logs/email-actions.log`, outputs summary to current chat only. No orphan sessions created.

**When to use:** External service comms, persistent records, email-based workflows. NOT for immediate chat.

**Setup:** API key hardcoded. Console at https://console.agentmail.to

### Mem0 Memory

Hybrid memory: local memory-core + Mem0 OSS for cross-session persistence.

**Location:** `skills/mem0-memory/`

**Scripts:**
- `scripts/mem0-client.js` — Mem0 HTTP client (capture, search, list, delete)
- `scripts/demo.js` — Demo script

**Usage:**
```bash
node skills/mem0-memory/scripts/mem0-client.js capture --content "memory text"
node skills/mem0-memory/scripts/mem0-client.js search --query "term"
```

**Requires:** Mem0 OSS configured with Ollama embedder (not OpenAI)

**Status:** ⚠️ Needs Mem0 embedder configuration

---

Add whatever helps you do your job. This is your cheat sheet.
