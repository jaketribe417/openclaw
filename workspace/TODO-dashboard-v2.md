# Mission Control Dashboard V2 - Redesign Plan

## Overview
Redesign the Tron-themed Mission Control Dashboard with focus on:
- Single entry point (login as main page)
- Post-login dashboard with chat-based widget creation
- Cron job monitoring widget
- Task categories (Personal, Pathfinders, Lineage, OpenClaw)
- Memory status widget with file sizes
- Remove Design section

---

## Phase 1: Restructure Entry Flow

### 1.1 Make Login the Main Page
- [ ] Rename `/login` to be the root `/`
- [ ] Update middleware to redirect to dashboard after login
- [ ] Remove separate home page, make it post-login dashboard

### 1.2 Create Post-Login Dashboard Layout
- [ ] Header with user info and logout
- [ ] Main area for widgets
- [ ] Chat/command input box at bottom
- [ ] Sidebar with navigation (optional)

---

## Phase 2: Chat-Based Widget System

### 2.1 Command Input Component
- [ ] Create chat input at bottom of dashboard
- [ ] Natural language command processing
- [ ] Commands like:
  - "show cron jobs"
  - "add task widget"
  - "show memory status"
  - "create task: Review quarterly report [category: Lineage]"

### 2.2 Widget System
- [ ] Widget container component
- [ ] Widget registry system
- [ ] Dynamic widget loading
- [ ] Close/minimize widget buttons

---

## Phase 3: Cron Jobs Widget

### 3.1 Cron Jobs Display
- [ ] Read from `~/.openclaw/cron/jobs.json`
- [ ] Display enabled jobs only
- [ ] Format: "Job Name - Schedule - Last Run Status"
- [ ] One line per job
- [ ] Auto-refresh option

### 3.2 Cron Job Details
- [ ] Show job name
- [ ] Show schedule (human readable)
- [ ] Show enabled/disabled status
- [ ] Show last run time
- [ ] Show consecutive errors if any

---

## Phase 4: Task System with Categories

### 4.1 Task Categories File
- [ ] Create `~/.openclaw/workspace/data/task-categories.json`
- [ ] Default categories: Personal, Pathfinders, Lineage, OpenClaw
- [ ] Allow adding new categories via UI or file edit

### 4.2 Task Backend Updates
- [ ] Update database schema to include category
- [ ] Update API to support category field
- [ ] Default category: Personal

### 4.3 Task Widget
- [ ] Tabs for each category
- [ ] Kanban within each tab (Backlog, In Progress, Completed)
- [ ] Create task dialog with category dropdown
- [ ] Move tasks between categories

---

## Phase 5: Memory Status Widget

### 5.1 Memory File Scanner
- [ ] Scan `~/.openclaw/workspace/memory/` directory
- [ ] List all `.md` files
- [ ] Calculate file sizes
- [ ] Show last modified dates
- [ ] Total memory size

### 5.2 Memory Widget Display
- [ ] File list with names
- [ ] File sizes (human readable)
- [ ] Last modified timestamps
- [ ] Total memory usage
- [ ] Quick links to open files

---

## Phase 6: Remove Design Section

### 6.1 Cleanup
- [ ] Remove `/design` page
- [ ] Remove from navigation
- [ ] Remove from middleware
- [ ] Clean up storage references if any

---

## Implementation Order

1. **Entry Flow** - Make login the main page
2. **Dashboard Layout** - Create post-login dashboard shell
3. **Chat System** - Add command input
4. **Cron Widget** - Display cron jobs
5. **Task Categories** - Update task system
6. **Memory Widget** - Show memory status
7. **Cleanup** - Remove design

---

## File Changes

### New Files
- `src/app/page.tsx` - Login becomes main entry
- `src/app/dashboard/page.tsx` - Post-login dashboard
- `src/components/ChatInput.tsx` - Command input
- `src/components/widgets/CronWidget.tsx` - Cron jobs display
- `src/components/widgets/MemoryWidget.tsx` - Memory status
- `src/components/widgets/TaskWidget.tsx` - Tasks with categories
- `src/lib/cron.ts` - Cron job reader
- `src/lib/memory.ts` - Memory file scanner

### Modified Files
- `src/middleware.ts` - Update routing
- `src/app/login/page.tsx` - Redirect to dashboard
- `src/lib/db.ts` - Add category field
- `src/app/tasks/page.tsx` - Update for categories
- Remove `src/app/design/page.tsx`
- Remove `src/app/page.tsx` (old home)

---

## Technical Notes

- Keep Tron theme consistent
- Use existing SQLite database
- Widgets should be collapsible/closeable
- Commands should be natural language
- Auto-save state for widget positions
- Mobile responsive

---

## Testing Checklist

- [ ] Login redirects to dashboard
- [ ] Chat commands create widgets
- [ ] Cron jobs display correctly
- [ ] Task categories work
- [ ] New categories can be added
- [ ] Memory widget shows files
- [ ] Design section removed
- [ ] All existing features still work
- [ ] Responsive on mobile
