---
name: smart-context
version: 1.0.0
description: At the start of each reasoning cycle, check for existing working memory files and reference offloaded tool outputs by path rather than re-reading into context.
tags: [context, memory, efficiency, workspace]
author: openclaw
---

# Smart Context Manager

**At the start of every reasoning cycle:**

1. Check if any of these working memory files exist in `~/.openclaw/workspace/`:
   - `todo.md` — active task plan
   - `research_notes.md` — accumulated research
   - `notes.md` — key findings

2. If any exist and are non-empty, re-read them to restore context before acting.

3. Check `~/.openclaw/workspace/tool_outputs/` for offloaded tool results. Reference these files by path instead of re-reading content into context.

4. Never duplicate data between context and files — if it's in a file, reference the path.
