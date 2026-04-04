# Memory System Upgrade - 2026-04-03

## Summary

Implemented comprehensive memory protection upgrades based on the [OpenClaw Memory Masterclass](https://velvetshark.com/openclaw-memory-masterclass) by Velvet Shark.

## Changes Made

### 1. openclaw.json Configuration

Updated `~/.openclaw/openclaw.json` with enhanced memory settings:

**Pre-Compaction Memory Flush (CRITICAL)**
- `reserveTokensFloor`: 40000 (headroom before compaction)
- `memoryFlush.enabled`: true (automatic save before compaction)
- `softThresholdTokens`: 4000 (trigger threshold)
- Custom system prompt for flush events

**Enhanced Memory Search**
- Hybrid search enabled (vector + keyword)
- Vector weight: 0.7, Text weight: 0.3
- Cache enabled for faster retrieval

**Context Pruning**
- Mode: cache-ttl
- TTL: 5 minutes
- Reduces tool bloat and delays compaction

### 2. AGENTS.md - All Agents

Added **Memory Protocol** section to:
- Jake (main agent)
- Harlan (Bee meeting agent)
- HEP (coding agent)
- Joy (email agent)

Each protocol includes:
- Search memory first before answering questions
- Read specific files when needed
- Write important learnings immediately
- Summarize to daily memory before compaction

## Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 1: System (SQLite)                                   │
│    ~/.openclaw/memory/main.sqlite                           │
│    ~/.openclaw/memory/joy.sqlite                            │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: Agent Workspaces                                    │
│    ~/.openclaw/workspace/agents/{harlan,hep,joy}/           │
│    Each has: SOUL.md, IDENTITY.md, USER.md, AGENTS.md       │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 3: Functional Storage                                  │
│    Harlan:                                                  │
│      ~/.openclaw/.harlan-bee-state.json                     │
│      ~/.openclaw/agents/harlan/todos/*.json                 │
│      ~/.openclaw/agents/harlan/meetings/*.md                │
│    Jake:                                                    │
│      ~/.openclaw/workspace/memory/YYYY-MM-DD.md             │
│      ~/.openclaw/workspace/MEMORY.md                        │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 4: System State                                       │
│    ~/.openclaw/cron/jobs.json (scheduled tasks)           │
│    ~/.openclaw/tasks/runs.sqlite (execution history)        │
└─────────────────────────────────────────────────────────────┘
```

## Three-Layer Defense

1. **Pre-Compaction Memory Flush** - Automatic save before context compression
2. **Manual Memory Discipline** - "Save to memory" habit before task switches
3. **File Architecture** - Bootstrap files survive compaction

## Verification

To verify the configuration is working:

```bash
# Check context loading
/context list

# Test memory search
memory_search "test query"

# View compaction settings
# Should show reserveTokensFloor: 40000 and memoryFlush enabled
```

## Security Note

The actual `openclaw.json` contains sensitive tokens and is in `.gitignore`. This template (`openclaw.template.json`) contains the memory configuration without secrets and can be committed.

## References

- [OpenClaw Memory Masterclass](https://velvetshark.com/openclaw-memory-masterclass)
- [OpenClaw Memory Docs](https://docs.openclaw.ai/concepts/memory)
- [Compaction Docs](https://docs.openclaw.ai/concepts/compaction)
