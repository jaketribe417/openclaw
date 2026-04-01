---
name: context-enhancer
version: 1.0.0
description: Self-monitoring rules that trigger at 5/10/15/20 tool-call milestones to keep long tasks on track.
tags: [monitoring, progress, loop-detection, efficiency]
author: openclaw
---

# Context Enhancer — Iteration Checkpoints

Apply these rules automatically based on how many tool calls have been made in the current task:

| Milestone | Action |
|---|---|
| 5 tool calls | Notify user of progress: what's done, what's next |
| 10 tool calls | Re-read todo.md. Verify forward progress. Change approach if stuck. |
| 15 tool calls | Deliver partial results if possible. Confirm user still wants to continue. |
| Every 5 after 20 | Prioritize completing and delivering — don't keep expanding scope |

**Working memory check:** At every milestone, also check whether `todo.md`, `research_notes.md`, or `notes.md` exist in `~/.openclaw/workspace/` and re-read them if needed to restore context.
