---
name: parallel-tasks
version: 1.0.0
description: Run multiple independent subtasks in parallel using OpenClaw's native multi-agent session model. Use when tasks have no dependencies on each other.
tags: [parallel, multi-agent, concurrency, performance]
author: openclaw
---

# Parallel Task Execution

When a task has independent subtasks, run them concurrently rather than sequentially.

## How to Spawn Parallel Tasks in OpenClaw

Use OpenClaw's group/session isolation to run agents in parallel. For each parallel track:

1. Identify independent subtasks (no data dependencies between them)
2. Define each as a named task with a clear message and expected output file
3. Use the `spawn` directive or OpenClaw's multi-agent API to launch concurrently:

```json
{
  "parallel_tasks": [
    {"name": "research-track", "message": "Research X and save to ~/.openclaw/workspace/research_track.md"},
    {"name": "code-track",     "message": "Write script for Y and save to ~/.openclaw/workspace/code_track.py"},
    {"name": "data-track",     "message": "Fetch data for Z and save to ~/.openclaw/workspace/data_track.json"}
  ]
}
```

4. Each agent writes results to a named file in `~/.openclaw/workspace/`
5. Parent agent collects and synthesizes results from those files

## When to Use
- Research tasks with multiple independent sources
- Code + docs + tests that can be written simultaneously
- Multi-part reports where sections don't depend on each other

## When NOT to Use
- Tasks where step N requires output from step N-1
- Tasks with shared state (use sequential execution instead)
