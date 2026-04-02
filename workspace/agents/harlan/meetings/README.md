# Bee Meeting Full Sync System

## Overview

Harlan now maintains a complete record of all Bee meetings with state tracking to prevent re-pulling already processed meetings.

## How It Works

```
First Run:     Full pull → Save all meetings → Mark as "known"
Subsequent:    Check Bee → Compare to known IDs → Only process new
```

## Storage Locations

| File | Location | Purpose |
|------|----------|---------|
| State | `~/.openclaw/.harlan-bee-state.json` | Tracks processed meeting IDs |
| Index | `~/.openclaw/agents/harlan/meetings/index.json` | Full list of all meetings |
| Notes | `~/.openclaw/agents/harlan/meetings/*.md` | Individual meeting transcripts |
| Memory | `~/.openclaw/agents/harlan/memory/meetings-index.md` | Searchable summaries |
| Todos | `~/.openclaw/agents/harlan/todos/*.json` | Todo management |

## State Tracking

The state file tracks:
- `knownMeetingIds`: All meeting IDs we've ever seen
- `processedMeetings`: Meetings we've saved notes for
- `totalMeetingsKnown`: Running count
- `fullSyncCompleted`: Whether a full sync was done

## Commands

### Normal Check (Today's meetings only)
```bash
node agents/harlan/scripts/bee-meeting-check.js
```

### Full Sync (All meetings)
```bash
node agents/harlan/scripts/bee-meeting-check.js --full-sync
# or
node agents/harlan/scripts/bee-meeting-check.js -f
```

### Force Re-process (Clear state)
```bash
rm ~/.openclaw/.harlan-bee-state.json
node agents/harlan/scripts/bee-meeting-check.js --full-sync
```

## What Gets Processed

**New meetings** (not in `knownMeetingIds`):
- Extracted for transcript
- Saved to individual MD file
- Added to searchable index
- Todos extracted for approval

**Already known meetings**:
- Skipped (no re-download)
- Preserves existing notes

## Sync Output

```
═══════════════════════════════════════
HARLAN QUILL — FULL BEE SYNC
═══════════════════════════════════════
BEE_SYNC: Full sync - fetching all meetings
BEE_CHECK: Retrieved 47 conversations from Bee
BEE_SYNC: 3 new meetings found in full sync
BEE_INDEX: Saved 47 meetings to index
BEE_STATE: Saved 47 known meeting IDs

Full sync complete:
  Total available: 47
  New meetings: 3
  Total known in memory: 47

Processed 3 new meetings
Extracted 12 todos
Created 8 new review items
═══════════════════════════════════════
```

## Cron Integration

The scheduled job (`harlan-bee-check`) runs with normal mode (today's meetings only). Run full sync manually when you want to backfill history.

## Data Retention

- State and index files persist indefinitely
- Individual meeting notes are never overwritten
- Todos are tracked through their full lifecycle

## Manual Reset

If you need to re-process everything:

```bash
# Remove state
rm ~/.openclaw/.harlan-bee-state.json

# Remove index
rm ~/.openclaw/agents/harlan/meetings/index.json

# Remove all meeting notes (optional)
rm ~/.openclaw/agents/harlan/meetings/*.md

# Re-run full sync
node agents/harlan/scripts/bee-meeting-check.js --full-sync
```
