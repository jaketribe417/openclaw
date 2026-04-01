# Equipment Downtime Tracking System
## Project Plan & Requirements Document

**Last Updated:** 2026-04-01  
**Status:** Requirements Collection Phase

---

## Original Scope

A real-time equipment downtime tracking system for Lineage Connect's production floor, enabling rapid incident response, maintenance history tracking, and operational analytics across ~45 pieces of equipment (10-15 printers + 30 finishing equipment).

---

## Core Requirements (Original)

### Equipment Inventory
- **Printers:** 10-15 units with module tracking
- **Finishing Equipment:** 30 units with module tracking
- **Modules:** Each piece of equipment has identifiable sub-modules/components

### Status Tracking
- **Non-Critical:** Equipment has issues but still operational
- **Critical Down:** Equipment stopped, requires immediate attention
- **Visual Dashboard:** Real-time view of what's down

### Work Logging
- Technician updates on work performed
- Time tracking (how long repairs took)
- Parts used documentation
- Historical reporting

---

## ADDITIONAL REQUIREMENTS

### 2026-04-01 - Floor Map & Equipment Image Management

**Requirement:** Drag-and-drop floor map and equipment image capabilities

**Details:**
- Users must be able to **upload a floor map** of the production facility
- Users must be able to **drag and drop equipment images** onto the floor map
- This creates a visual representation of equipment placement
- Enables the interactive floor map visualization (Option A from original plan)

**Technical Implications:**
- Image upload functionality (floor plans, equipment photos)
- Drag-and-drop UI components for positioning
- Coordinate storage (x, y positions on the map)
- Image storage and optimization
- Equipment icon/image management
- Floor map versioning (if layout changes)

**User Stories:**
1. As an admin, I want to upload a floor plan image so technicians can see equipment locations visually
2. As an admin, I want to drag equipment icons onto the floor map to mark their exact positions
3. As a technician, I want to click on equipment on the floor map to see its status and details
4. As an admin, I want to upload custom equipment images so the map shows realistic representations

**UI/UX Considerations:**
- Zoom/pan capabilities for large floor plans
- Grid snap option for neat alignment
- Equipment labels that show status color
- Layer controls (show/hide equipment types)
- Mini-map navigation for large facilities

---

## Architecture Overview

See original comprehensive planning document for full architecture details.

**Quick Reference:**
- **Frontend:** React/Next.js with interactive canvas for floor map
- **Backend:** Node.js API with file upload endpoints
- **Database:** PostgreSQL with coordinates table for positioning
- **File Storage:** MinIO/S3 for floor maps and equipment images

---

## Implementation Notes

### Phase 3 (Visualization) Enhancement
The drag-and-drop floor map feature should be integrated into Phase 3 alongside the real-time dashboard.

**New Components Needed:**
- Floor map upload component
- Drag-and-drop canvas (react-dnd or native HTML5 DnD)
- Equipment image library/manager
- Coordinate persistence API
- Floor map editor interface

---

### 2026-04-01 - Mobile Operator Interface

**Requirement:** Mobile-responsive operator tool for quick issue reporting

**Details:**
- **Primary interface for floor operators** - must work seamlessly on smartphones
- **Fast equipment selection** - minimal taps to identify equipment
- **Quick note entry** - simple text field for describing issues
- **No complex forms** - operators are busy, interface must be frictionless

**User Stories:**
1. As an operator, I want to scan a barcode/QR on equipment to quickly identify it
2. As an operator, I want to tap my equipment from a simple list to report an issue
3. As an operator, I want to select from common issue categories with one tap
4. As an operator, I want to add a quick note without typing if I'm busy (voice or presets)
5. As an operator, I want the entire process to take under 30 seconds

**UI/UX Considerations:**
- Large touch targets (thumb-friendly)
- Equipment list sorted by proximity/zone or recent activity
- Quick-action buttons: "Issue with this machine" → "Select severity" → "Add note (optional)" → Done
- Optional photo attachment (camera access)
- Works offline, syncs when connected
- Badge/notification when technician responds

**Technical Implications:**
- PWA (Progressive Web App) for mobile install
- QR/barcode scanning (device camera)
- Optimized for small screens (simplified views)
- Touch-first interactions
- Voice-to-text integration (optional)
- Offline storage with background sync

**Interface Options:**
1. **QR Scan First:** Operator scans equipment → auto-selects → quick report form
2. **Zone List:** Operator selects zone → sees equipment in that area → tap to report
3. **Favorites:** Operator's frequently-reported equipment at top of list
4. **Quick Templates:** Pre-defined issue types ("Paper jam", "Quality issue", "Strange noise")

---

## Pending Requirements

_This section will be populated as additional requirements are collected._

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Floor map drag-and-drop required | User needs visual equipment placement |
| 2026-04-01 | Mobile-first operator interface required | Operators need quick on-floor reporting capability |

