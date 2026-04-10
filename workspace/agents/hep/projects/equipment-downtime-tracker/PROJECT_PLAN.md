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

## FINALIZED REQUIREMENTS

_Requirements collected via grill-me session on 2026-04-10_

### Equipment Hierarchy & Identification

**Structure:** 4-level hierarchy with parent-child relationships
```
Company
└── Building
    └── Floor
        └── Zone
            └── Equipment (parent)
                └── Module (child)
                    └── Component (grandchild)
```

**Identification Rules:**
- **Equipment:** Admin-only creation via central management panel
- **Modules/Components:** Technicians can add on-the-fly to existing equipment
- Custom names with ID numbers at each level
- Equipment and modules have status: **Running / Degraded / Down**
- User-determined rollup logic (module down → equipment degraded, not necessarily down)

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Administrator** | Full CRUD on everything, user management, company/building/floor/zone creation |
| **Supervisor** | View all, receive escalations, mark equipment back to operation, view reports |
| **Technician** | Acknowledge repairs, log work, update status, add modules/components, mark equipment operational |
| **Operator** | Report issues (critical & non-critical), view status/history, attach photos |

### Downtime Event Lifecycle

**Workflow:**
1. Operator reports issue (with optional photo) → Equipment status updated
2. Notification sent to technician pool + supervisor (email + in-app)
3. First technician to acknowledge gets assignment
4. Technician logs work (parts used, time, notes)
5. Technician or supervisor marks equipment back to operation
6. Full audit trail of all interactions

**Escalation:** 15-minute timer to manager if unacknowledged

**Non-Critical Errors:** Operators can log errors they resolved themselves (e.g., reboot fixed communication error) for pattern tracking

### Floor Map Visualization

**Features:**
- Toggle between **Map View** and **List View**
- Admin uploads floor plan image per floor
- Drag-and-drop equipment positioning with coordinate storage
- Generic equipment icons with color-coded status (red/yellow/green)
- Click equipment on map → detail view with photo
- Zoom/pan capabilities for large floor plans
- Multi-location support: Company → Building → Floor → Zone

**Locations:**
- Main building: Floor 1, Floor 2
- Additional building: Floor 1
- Zones: Printer zone, Inserter zone, Jet zone, etc.

### Mobile Operator Interface

**Design:** Responsive web app (not PWA — reliable WiFi on-site)

**Features:**
- Equipment selection via zone list or quick search
- One-tap issue reporting with severity selection
- Photo attachment (error screens, machine messages)
- View status and history
- Large touch targets, minimal form complexity
- Target: <30 seconds to submit report

### Notifications

**Phase 1 (MVP):**
- Email notifications for all role-based alerts
- In-app real-time updates for active users

**Phase 2:**
- Microsoft Teams integration for channel notifications

**Phase 3 (Future):**
- SMS for escalation scenarios

### Parts & Cost Tracking

**Simple Parts Catalog:**
- Part name, part number, cost (optional)
- Technicians select from dropdown when logging repairs
- Cost rollup per repair, per equipment, per time period
- Extensible design for future full inventory management

### Reporting & Analytics

**Live Dashboard:**
- Real-time equipment/module status view
- Color-coded status indicators
- Filter by location, zone, equipment type

**Executive Reports (configurable time period):**
- MTTR (Mean Time To Repair)
- MTBF (Mean Time Between Failures)
- Downtime by equipment (top offenders)
- Downtime by module/component
- Technician performance metrics
- Peak failure times / shift patterns
- Repair cost summary

### Authentication & Deployment

**Authentication:**
- Phase 1: Simple email/password user management
- Phase 2: Microsoft Active Directory / Entra ID SSO integration

**Deployment:**
- Containerized web service (Docker)
- Deployable on-premise OR cloud
- Database: PostgreSQL
- File storage: MinIO/S3 compatible
- Frontend: React/Next.js
- Backend: Node.js API

### Data Model Summary

**Core Entities:**
- `Company` → `Building` → `Floor` → `Zone` → `Equipment` → `Module` → `Component`
- `User` (role-based)
- `DowntimeEvent` (status transitions, audit trail)
- `WorkLog` (technician notes, parts used, time tracking)
- `Part` (catalog, cost tracking)
- `FloorMap` (image, coordinates)

**Status Values:**
- Equipment/Module: `running`, `degraded`, `down`
- DowntimeEvent: `reported`, `acknowledged`, `in_repair`, `resolved`

---

## Pending Requirements

_No pending requirements — all major branches resolved._

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Floor map drag-and-drop required | User needs visual equipment placement |
| 2026-04-01 | Mobile-first operator interface required | Operators need quick on-floor reporting capability |
| 2026-04-10 | Hierarchical multi-tenant architecture (Company→Building→Floor→Zone) | Multiple locations, future expansion capability |
| 2026-04-10 | 3-tier status system (Running/Degraded/Down) | Captures partial failures, user-defined rollup |
| 2026-04-10 | Parent-child equipment hierarchy (Equipment→Module→Component) | Flexible structure, admin-controlled equipment, tech-controlled sub-components |
| 2026-04-10 | First-to-acknowledge assignment with 15-min escalation | Fair distribution, ensures response |
| 2026-04-10 | Simple parts catalog with cost tracking | Captures repair costs without inventory complexity |
| 2026-04-10 | Responsive web app (not PWA) | Reliable WiFi, simpler implementation |
| 2026-04-10 | Email + Teams notifications (SMS later) | Cost-effective, integrates with existing Microsoft ecosystem |
| 2026-04-10 | Containerized deployment, on-premise or cloud | Flexibility for IT infrastructure changes |
| 2026-04-10 | Iterative development, fully-baked solution | Quality over speed, no hard deadline |

