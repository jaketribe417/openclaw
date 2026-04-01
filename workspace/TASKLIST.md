# TaskList.md — Master Task Management System

**Maintained by:** Harlan Quill (Chief of Staff)
**Last Updated:** 2026-03-30
**Update Protocol:** Harlan updates daily at 7 AM, 12 PM, 5 PM CDT

---

## Task Status Legend

| Symbol | Status | Description |
|--------|--------|-------------|
| ⬜ | **Open** | Not yet started |
| 🔄 | **In Progress** | Currently working on it |
| ⏸️ | **Blocked** | Waiting on external factor |
| ✅ | **Complete** | Done, with completion date |
| 🗑️ | **Cancelled** | No longer relevant |

---

## Current Active Tasks

### High Priority

| ID | Task | Status | Owner | Due | Notes |
|----|------|--------|-------|-----|-------|
| H-001 | Set up Harlan task management system | ✅ Complete | Harlan | 2026-03-30 | TaskList.md created, cron job active |
| H-002 | Configure Bee meeting check script | ✅ Complete | Harlan | 2026-03-30 | Bee skill verified, script uses actual CLI |
| H-003 | Test Bee integration end-to-end | ⬜ Open | Harlan | 2026-03-31 | Run manual test of bee-meeting-check.js |

### Medium Priority

| ID | Task | Status | Owner | Due | Notes |
|----|------|--------|-------|-----|-------|
| | | | | | |

### Low Priority

| ID | Task | Status | Owner | Due | Notes |
|----|------|--------|-------|-----|-------|
| | | | | | |

---

## Completed Tasks Archive

| ID | Task | Completed | Owner | Notes |
|----|------|-----------|-------|-------|
| H-001 | Set up Harlan task management system | 2026-03-30 | Harlan | TaskList.md created, cron job active |

---

## Task Management Scheme

### Harlan's Responsibilities:

1. **Daily Check-ins (7 AM, 12 PM, 5 PM CDT)**
   - Check Bee system for new meetings
   - Extract todos/action items from transcripts
   - Send Telegram summary with numbered list
   - Ask which items to add to task list

2. **Task Lifecycle:**
   - **Create:** New tasks added with ⬜ status
   - **Prioritize:** Mark as High/Medium/Low
   - **Assign:** Set owner (Jason, Jake, HEP, Joy, Harlan)
   - **Track:** Update status during daily check-ins
   - **Complete:** Move to archive with completion date

3. **Task ID Format:** `[Initial]-[Number]`
   - H-xxx = Harlan tasks
   - J-xxx = Jason tasks
   - K-xxx = Jake tasks
   - P-xxx = Project tasks
   - M-xxx = Mission Control tasks

4. **Daily Summary Telegram Format:**
   ```
   📋 Task Review — [Date]
   
   New items from Bee meetings:
   1. [Task description]
   2. [Task description]
   3. [Task description]
   
   Current priorities:
   ⬜ H-002: Configure Bee meeting check script
   
   Reply with numbers to add to task list.
   ```

---

## Integration Points

- **Bee.ai:** New meeting transcripts → todo extraction → Telegram notification
- **Telegram:** Primary notification channel for task updates
- **Calendar:** Due dates sync with calendar events
- **Git:** TaskList.md committed with each update

---

_Next check: 7:00 AM CDT tomorrow_
