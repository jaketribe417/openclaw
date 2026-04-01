---
name: event-logger
version: 1.0.0
description: Log every significant agent action to ~/.openclaw/workspace/event_stream.jsonl with a type label. Use for debugging and task analysis.
tags: [logging, debug, monitoring, events]
author: openclaw
---

# Event Stream Logger

After each significant action, append a log entry to `~/.openclaw/workspace/event_stream.jsonl`:

```json
{"timestamp": "<ISO>", "type": "<TYPE>", "preview": "<first 100 chars of action>"}
```

**Event types:**
- `USER` — incoming user message
- `PLAN` — creating or updating todo.md
- `ACTION` — tool execution (shell, browser, search)
- `OBSERVE` — reading tool results
- `REFLECT` — verification or self-review step
- `DELIVER` — final response to user

Keep the log trimmed to the last 500 entries. Use `tail -n 50 ~/.openclaw/workspace/event_stream.jsonl | jq .` to inspect recent activity.
