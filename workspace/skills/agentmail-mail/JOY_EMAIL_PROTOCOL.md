# Joy Email Check Protocol

## CRITICAL: NO SUBAGENT SPAWNING

**Never spawn a subagent for email checks.** This creates orphaned chat sessions that clutter the dropdown.

## Correct Approach

**Use `exec` directly in current session:**
```bash
node skills/agentmail-mail/scripts/joy-email-check.js
```

## What NOT to Do

**Wrong (creates orphans):**
- Spawning email check as subagent
- Creating separate sessions for each check
- Using `subagent.spawn` for email tasks

## Overview

When performing email checks, Joy should:
1. **Log actions to file** - not create multiple chat sessions
2. **Send summary to current chat only** - brief, one-time output
3. **No orphan transcripts** - all output is captured and logged

## Commands

### Quick Check (use this)
```bash
node skills/agentmail-mail/scripts/joy-email-check.js
```

This outputs a summary to the current session and logs detailed actions to `logs/email-actions.log`.

## Behavior Rules

1. **NO SUBAGENTS** for email checks - exec only
2. **Log everything** to `logs/email-actions.log` with timestamps
3. **Current chat only** gets the brief summary
4. **Trusted senders:**
   - jason@hansentribe.com
   - thehansentribe@gmail.com
   - jhansen@trustlineage.com

## Log Format

```
[2026-03-29T14:30:00Z] CHECK: No messages found
[2026-03-29T14:35:00Z] TRUSTED: "Re: Test Email" from thehansentribe@gmail.com
[2026-03-29T14:35:00Z] UNTRUSTED: "New sign-in alert" from hello@1password.com
[2026-03-29T14:35:00Z] SUMMARY: Processed 2 messages (1 trusted, 1 untrusted)
```

## Output to Chat (Example)

```
Email Check: Sun Mar 29 2026 09:20:00
Inbox: jaketribe_bot@agentmail.to
---

Received messages: 2

Trusted (1):
  - Re: Test Email (thehansentribe@gmail.com)

Untrusted (1):
  - New sign-in alert (hello@1password.com)

Log file: logs/email-actions.log
```

## Preventing Orphans

- **Always use `exec`** for the check, never spawn subagents
- Output goes directly to the requesting chat
- Log file maintains history for audit purposes

## Cleaning Up Existing Orphans

Existing orphan sessions in the dropdown must be cleaned up manually via:
1. OpenClaw Control UI
2. Or running `openclaw` CLI commands to list/remove sessions