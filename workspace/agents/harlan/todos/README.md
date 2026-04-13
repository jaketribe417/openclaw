# Harlan's Todo Management System

## Overview

This system manages action items extracted from Bee meetings with an approval workflow.

## Workflow

```
Meeting → Extract Todos → Pending Review → Jason Approves → Active → Complete
              ↓               ↓                ↓              ↓
         Automatic         Await approval   Approved       Archive
```

## Files

| File | Purpose |
|------|---------|
| `pending.json` | Todos awaiting approval |
| `approved.json` | Todos Jason has approved |
| `completed.json` | Finished todos (archive) |
| `rejected.json` | Todos Jason rejected |
| `summary.json` | Current counts and status |
| `pending-review-*.md` | Human-readable review files |

## Approval Commands

Reply to Telegram notifications with:

- `approve 1` — Approve first todo in the list
- `approve all` — Approve all pending todos
- `reject 1 not needed` — Reject with reason
- `modify 1 updated text here` — Change todo text
- `priority 1 high` — Set priority (low/medium/high)
- `due 1 2026-04-05` — Set due date
- `assign 1 John` — Assign to someone

## Todo Structure

Each todo includes:
- **id**: Unique identifier
- **text**: Todo description
- **assignee**: Who should do it
- **dueDate**: When it's due
- **priority**: low/medium/high
- **source**: Where it came from (meeting)
- **sourceId**: Meeting ID
- **sourceTitle**: Meeting title
- **sourceDate**: When the meeting happened
- **createdAt**: When extracted
- **status**: pending/approved/completed/rejected
- **approvedBy**: Who approved it
- **approvedAt**: When approved

## Integration

The todo system is automatically triggered when Harlan's Bee meeting check runs. It:

1. Extracts action items from meeting transcripts
2. Deduplicates (skips if already pending/approved)
3. Creates a review file
4. Sends Telegram notification for approval
5. Awaits your response

## Manual Commands

```bash
# View summary
node workspace/agents/harlan/scripts/todo-manager.js summary

# Approve a todo
node workspace/agents/harlan/scripts/todo-manager.js approve <todo-id>

# Reject a todo
node workspace/agents/harlan/scripts/todo-manager.js reject <todo-id> "reason"

# Complete a todo
node workspace/agents/harlan/scripts/todo-manager.js complete <todo-id>
```

## Todo Lifecycle

1. **Extracted** → Automatically added to `pending.json`
2. **Review** → Markdown file created for your review
3. **Approved** → Moved to `approved.json`, ready to act on
4. **Completed** → Moved to `completed.json` with timestamp
5. **Rejected** → Moved to `rejected.json` with reason

## Storage Location

All todo files are stored in:
```
workspace/agents/harlan/todos/
```

This directory is git-tracked for persistence.
