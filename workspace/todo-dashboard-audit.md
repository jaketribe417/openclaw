# Dashboard Audit & Rebuild Plan

## Current Status
- **Running Dashboard**: Built by HEP (subagent) with Tasks tab
- **Cursor Version**: Likely exists in Cursor project history
- **Issue**: Current dashboard may be older/less complete than Cursor version

## Investigation Tasks

### Phase 1: Discovery (15 min)
- [ ] Check if Cursor has a newer/better version of the dashboard
- [ ] Compare features between Cursor-built and HEP-built versions
- [ ] Identify which version is more complete
- [ ] Document the differences

### Phase 2: Decision (5 min)
- [ ] Decide: Keep current, restore Cursor version, or rebuild
- [ ] If rebuilding, gather requirements from user feedback

### Phase 3: Execution (if needed)
- [ ] Stop current dashboard service
- [ ] Either restore Cursor version or build new one
- [ ] Ensure all features work (Tasks, Kanban, API, Messaging)
- [ ] Test locally
- [ ] Deploy and verify

## HEP 1-Hour Check-in Plan

**Task for HEP**: Complete the dashboard investigation and rebuild

**Instructions**:
1. Check ~/.cursor/projects/Users-Jack-openclaw-workspace-jake-mission-control/ for any Cursor-built version
2. Compare with current ~/.openclaw/workspace/jake-mission-control/
3. Determine which is better/more complete
4. If Cursor version is better, migrate it to the workspace repo
5. Ensure Tasks tab has:
   - Kanban board (Backlog, In Progress, Completed)
   - Task creation/editing
   - Drag-and-drop between columns
   - API endpoints for CRUD
   - Messaging integration
6. Test thoroughly
7. Commit and push to GitHub

**Check-in Schedule**:
- [ ] 15 min: Initial discovery complete, decision made
- [ ] 30 min: Migration/rebuild in progress
- [ ] 45 min: Testing phase
- [ ] 60 min: Final review and deployment

## Success Criteria
- Dashboard loads at http://localhost:3000/tasks
- All task operations work (create, edit, move, delete)
- API responds correctly
- Messaging commands work
- Dark/light theme consistent
- Clean, professional UI
