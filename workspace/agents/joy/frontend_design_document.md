# Frontend Design Document - Lineage Connect Equipment Downtime Tracker v1.1.0

## Overview & Design Principles

**Project Goal**: Deliver a responsive, real-time web application (desktop + mobile-optimized) that enables fast issue reporting, visual equipment monitoring, repair workflows, and actionable analytics while enforcing role-based access and multi-tenant hierarchy.

**Core Principles** (double-checked against manufacturing UX patterns):

- **Clarity over clutter**: Visual hierarchy with top-left priority for critical metrics. Limit simultaneous data to what drives action.
- **Speed & Simplicity**: Operator reporting ≤30 seconds. Large touch targets (≥44px). Minimal forms.
- **Real-time first**: Live status updates via SSE. Optimistic UI with graceful fallback.
- **Color coding consistency**: Green (running), Yellow (degraded), Red (down). Use throughout maps, lists, and cards.
- **Role-based views**: Tailored dashboards (operator quick-report focus; technician repair queue; supervisor overview; admin configuration).
- **Accessibility**: WCAG 2.2 AA (high contrast, keyboard navigation, screen-reader labels, ARIA live regions for real-time updates).
- **Responsiveness**: Mobile-first for operators/technicians; desktop-optimized for supervisors/admins.
- **Performance**: <3s page loads. Skeleton loaders. Lazy-loaded maps and charts.

**Tech Stack**:
- Framework: Next.js 15 (App Router) with React 19
- Styling: Tailwind CSS + Shadcn/UI components (or equivalent customizable set)
- State: Zustand (lightweight, simple for global status + real-time)
- Charts: Recharts or Tremor (lightweight, accessible)
- Maps: React-Konva or SVG overlay on HTML with absolute-positioned draggable icons
- Real-time: Server-Sent Events (SSE) for status/dashboard pushes
- Forms: React Hook Form + Zod validation
- Routing: Next.js with protected routes via middleware (role + company checks)

**Design System Highlights**:
- Primary palette: Neutral grays + status colors (green #22c55e, yellow #eab308, red #ef4444)
- Typography: Clear sans-serif, scalable
- Icons: Lucide React (consistent, lightweight)
- Components: Reusable (StatusBadge, EquipmentCard, QuickReportWizard, HierarchySelector)

---

## Overall Layout & Navigation

### Top Navigation Bar (persistent):
- Logo + Project Name
- Hierarchy Breadcrumb (Company > Building > Floor > Zone > Equipment) with quick selector dropdown
- Search bar (global equipment/zone search)
- User avatar + role badge + logout
- Notifications bell (in-app real-time escalations + repair assignments)

### Sidebar (collapsible on mobile/desktop):
- Dashboard (role-specific landing)
- Floor Map / List View toggle
- Equipment Hierarchy
- Reports & Analytics
- (Admin only) Configuration (Users, Parts, Hierarchy setup)
- My Tasks (for technicians: assigned repairs)

### Main Content Area:
Dynamic based on route/role. Uses responsive grid/flex.

**Mobile Optimizations**: Bottom tab bar (Dashboard, Report, Map, History) for operators. Hamburger menu elsewhere. Thumb-friendly actions.

---

## Key Screens & Components

### A. Role-Specific Dashboards (Live, Real-Time)

**Operator Dashboard**:
- Prominent "Quick Report Issue" button (large, red-accented, top-center)
- Recent equipment status list (filtered to frequent/recent)
- My Reported Issues (simple cards with status)

**Technician Dashboard**:
- Assigned Open Repairs queue (sortable cards: equipment, description, time since reported, severity)
- Acknowledge button (first-to-ack gets assignment)
- Quick status update + log work entry

**Supervisor Dashboard**:
- Overview KPI cards (top row): Total Down, Degraded, MTTR (live), MTBF, Open Critical Events
- Downtime by Zone/Equipment (bar chart or Pareto)
- Real-time floor status summary
- Escalation alerts

**Admin Dashboard**:
- System health + full hierarchy overview
- User management table
- Bulk import status

**Common Dashboard Elements**:
- Real-time status refresh (SSE updates trigger Zustand store re-render + toast)
- Filters: By location hierarchy, zone type, status, time period
- Color-coded indicators everywhere

### B. Interactive Floor Map View (Toggle with List View)

**Layout**: Full-width container with uploaded floor plan image as background.

**Equipment Representation**: Draggable icons (or SVG elements) positioned via floor_map_x / floor_map_y (stored in DB).
- Icon color = current status (green/yellow/red)
- Hover/click tooltip: Equipment name, status, last event summary, photo thumbnail

**Interactions**:
- Drag & drop repositioning (admin/technician only, with snap-to-grid option)
- Click → opens Equipment Detail modal/side panel
- Zoom & pan (CSS transform or simple library)
- Mini-map overview (optional)
- Legend: Status colors + zone filters

**Fallback**: Tab to "List View" – searchable, sortable table of all equipment with status, location, last downtime.

**Real-time**: SSE pushes update icon colors live.

### C. Equipment Detail View (Modal or Dedicated Page)

- Header: Name, ID, hierarchical location, status badge (with change history link)
- Tabs:
  - Overview: Photo, current status, child modules/components tree (with their statuses)
  - History: Timeline of Downtime Events + StatusHistory (who/when/why)
  - Repairs: Open/closed work logs + parts used
  - Photos/Attachments
- Actions (role-gated): Report issue, Acknowledge, Mark Operational (with reason for overrides), Add Module/Component

### D. Quick Issue Reporting Flow (Critical for <30s Target)

**Wizard-style modal** (multi-step, progress bar):

1. **Select Equipment** (hierarchy dropdown or search; recent list; zone-filtered from current floor)
2. **Severity** (critical/non-critical buttons, large)
3. **Description** (optional textarea; voice-to-text hint for mobile)
4. **Attach Photo** (camera access button; preview; optional)
5. **Submit** (large button; optimistic success with "Reported" toast + notification trigger)

**Self-Resolved Non-Critical**: One-tap variant (select equipment + "Fixed by reboot" quick reason)

**UI Optimizations**: Large touch targets, minimal required fields, auto-focus, skeleton during submit.

### E. Repair Workflow Screens

- Repair Assignment List (technician view)
- Repair Log Form: Description of work, time spent (timer or manual), parts used (dropdown from catalog + quantity), notes/photos
- Resolve Button: Mark operational (updates status + logs to StatusHistory)

### F. Reports & Analytics

- Live Dashboard tab with KPI cards + charts (MTTR, MTBF, downtime by equipment/module, peak times, cost summary)
- Executive Reports page: Date range picker, export buttons (CSV/Excel/PDF)
- Visuals: Bar/pie charts, trend lines, heatmaps for failure times. Role-based visibility (hide costs from operators)
- Filters mirror dashboard

### G. Other Screens

- Hierarchy Management (admin: tree view for create/edit Company/Building/Floor/Zone/Equipment)
- Parts Catalog (searchable table + add/edit)
- User Management (admin)
- Notifications Center
- Settings / Profile

---

## State Management & Data Flow

### Zustand Stores:
- `useAuthStore`: User/role/company
- `useEquipmentStore`: Current hierarchy, statuses (synced via SSE)
- `useRealTimeStore`: Live updates handler
- `useReportStore`: Temporary reporting state

**Data Fetching**: Next.js Server Components where possible; TanStack Query (React Query) for client-side caching/mutations.

**Optimistic Updates**: Status changes show immediately; rollback on error with toast.

**Error Handling**: Global error boundary + user-friendly toasts. Offline fallback messages (even if not required).

---

## Non-Functional & Implementation Notes

- **Real-time**: SSE endpoint subscribes to equipment status changes. On receive → update Zustand + re-render affected components.
- **Mobile/PWA-ready**: Responsive breakpoints. Camera/photo handling via browser APIs.
- **Internationalization**: Ready for future (react-i18next)
- **Testing**: Component tests (Jest/RTL), E2E (Playwright) for critical flows (report → acknowledge → resolve)
- **Accessibility**: ARIA labels on status icons, live regions for updates, keyboard draggable support where possible.
- **Theming**: Dark mode optional for low-light production floors.
- **Bulk Actions**: Admin import progress indicator; multi-select on lists.

---

*This design directly supports all success criteria: fast reporting, 15-min acknowledgments (via notifications + queue), audit via history views, real-time accuracy, and multi-location navigation.*
