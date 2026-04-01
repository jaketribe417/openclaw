---
name: auto-offload
version: 1.0.0
description: When any tool output exceeds 5,000 characters, save it to a file in ~/.openclaw/workspace/tool_outputs/ and reference by path. Prevents context overflow on long tasks.
tags: [context, memory, offload, efficiency]
author: openclaw
---

# Auto-Offload Long Output

**Rule:** If any tool output is longer than approximately 5,000 characters, do NOT hold the full text in context. Instead:

1. Save the output to `~/.openclaw/workspace/tool_outputs/<tool>_<timestamp>.txt`
2. Replace the inline content with: `[Output saved to: <filepath> — reference by path]`
3. When you need the data later, re-read from the file path

**Exception:** Final responses to the user are never offloaded.

**Workspace setup:**
```bash
mkdir -p ~/.openclaw/workspace/tool_outputs
```
