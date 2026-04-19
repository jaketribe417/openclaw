# Equipment Downtime Tracker — Consolidated Specification

**Project:** `equipment-downtime-tracker`  
**Client / context:** Lineage Connect production floor  
**Document status:** Consolidated from planning sources (see [Source documents](#source-documents))  
**Implementation status (2026-04-10):** Phase 1 infrastructure complete; backend routes and frontend application in progress — see [Implementation status](#14-implementation-phases-and-current-status).

---

## 1. Executive summary

The Equipment Downtime Tracking System is a real-time production-floor application for rapid incident response, maintenance history, and operational analytics across approximately **45 pieces of equipment** (about 10–15 printers and ~30 finishing units), each with identifiable **modules** and deeper **components**.

**Project philosophy (stakeholder decisions):**

- Iterative development with a **fully baked** solution (quality over speed)
- **No hard deadline**
- Multi-location, **multi-tenant** hierarchy for future expansion

---

## 2. Scope and scale

| Area | Specification |
|------|----------------|
| Printers | 10–15 units, module tracking |
| Finishing equipment | ~30 units, module tracking |
| Modules / components | Each equipment item supports identifiable sub-units; technicians can add modules/components on the fly |

**Original problem framing:** Track downtime and repairs with visibility similar to an IT ticketing system — historical data for recurring issues and upgrade decisions.

---

## 3. Architecture

### 3.1 Logical hierarchy (multi-tenant)

```
Company
└── Building
    └── Floor
        └── Zone
            └── Equipment (parent)
                └── Module (child)
                    └── Component (grandchild)
```

- **Equipment:** Created only by **administrators** via a central management panel.
- **Modules / components:** **Technicians** (and admins) can add on the fly to existing equipment.
- Identification: custom names with ID numbers at each level; optional photos on equipment.

### 3.2 Deployment

| Aspect | Specification |
|--------|----------------|
| Packaging | Containerized (Docker) |
| Hosting | On-premise **or** cloud; migration path should remain feasible |
| Database | PostgreSQL |
| Object storage | MinIO or S3-compatible (floor maps, equipment photos, operator attachments) |
| API | REST; OpenAPI/Swagger documented in implementation |

### 3.3 Application stack (planned vs implemented)

| Layer | Planned | Implemented (see implementation summary) |
|-------|---------|-----------------------------------------------|
| Frontend | React / Next.js, interactive floor map | Next.js 15 (App Router); Tailwind + Shadcn/UI intended |
| Backend | Node.js API | **Fastify** (not a generic “Node only” label) with JWT, Zod validation, Swagger |
| ORM / schema | — | **Drizzle** (`@edt/db`), migrations via drizzle-kit |
| Monorepo | — | **pnpm** workspaces + **Turbo** |
| Real-time | In-app updates | **SSE** (Server-Sent Events) targeted for dashboard broadcasts |
| Multi-tenancy | Company-scoped data | **Row Level Security (RLS)** + company context middleware |
| File uploads | MinIO/S3 | Integration listed as pending in implementation tracker |

---

## 4. Roles and permissions

| Role | Permissions |
|------|-------------|
| **Administrator** | Full CRUD on all entities, user management, create company/building/floor/zone, system configuration, all reports |
| **Supervisor** | View all; receive escalations; mark equipment operational; view/export reports |
| **Technician** | Acknowledge repairs; log work; update status; add modules/components; mark equipment operational; view history and dashboard |
| **Operator** | Report issues (critical and non-critical); view status and history; attach photos; log self-resolved errors for pattern tracking |

---

## 5. Status model

### 5.1 Equipment and modules

| Status | Meaning | UI cue (conceptual) |
|--------|---------|---------------------|
| **Running** | Fully operational | Green |
| **Degraded** | Operating with issues | Yellow |
| **Down** | Stopped; needs attention | Red |

**Rollup:** User-determined — e.g. a module **down** may roll up to equipment **degraded**, not necessarily **down**; not fully automatic — technician/supervisor judgment.

### 5.2 Downtime events

| State | Notes |
|-------|--------|
| `reported` | Initial operator report |
| `acknowledged` | First technician claimed |
| `in_repair` | Active work |
| `resolved` | Closed |

**Severity:** Critical vs non-critical on report.

---

## 6. Downtime event lifecycle

1. **Report** — Operator selects equipment, severity, optional description and photo → equipment status updated.  
2. **Notify** — Technician pool + supervisor: **email** + **in-app** (MVP).  
3. **Acknowledge** — **First technician to acknowledge** receives assignment.  
4. **Repair** — Work log: parts (from catalog), time, notes, optional photos.  
5. **Resolve** — Technician or supervisor marks equipment back to operation.  
6. **Audit** — Full trail of interactions.

**Escalation:** If the event is **unacknowledged** for **15 minutes**, escalate to **manager** (email in MVP; SMS considered later).

**Self-resolved non-critical issues:** Operators may log issues they fixed themselves (e.g. reboot cleared a communication error) for **trend analysis** without implying vendor repair.

---

## 7. Floor map visualization

| Feature | Specification |
|---------|----------------|
| Views | Toggle **Map view** vs **List view** |
| Floor plans | Admin uploads image **per floor** |
| Positioning | Drag-and-drop equipment placement; **x/y** coordinates persisted |
| Representation | Generic icons with **red / yellow / green** by status |
| Interaction | Click equipment → detail including photo |
| Navigation | Zoom, pan; optional mini-map for large plans |
| Scope | Supports Company → Building → Floor → Zone |

**Example layout (from requirements):**

- Main building: Floor 1, Floor 2  
- Additional building: Floor 1  
- Zones: Printer zone, Inserter zone, Jet zone, finishing, etc.

**Earlier brainstorming (optional UX):** Grid snap, layer controls by equipment type — align with build priority.

**Technical building blocks (from planning):** Floor map upload component, drag-and-drop canvas (e.g. react-dnd or HTML5 DnD), image library/manager, coordinate persistence API, floor map editor.

---

## 8. Mobile / operator UX

**Final decision:** **Responsive web application**, **not** a PWA — reliable on-site Wi‑Fi; simpler delivery than installable PWA.

> **Note:** An earlier requirements draft mentioned PWA, offline sync, and QR-first flows. Those are **superseded** by the finalized responsive-web approach below, except where product later adds optional enhancements (e.g. QR/barcode) without changing the baseline.

| Requirement | Specification |
|-------------|----------------|
| Primary users | Floor operators — fast paths, minimal taps |
| Equipment selection | Zone list and/or quick search |
| Reporting | One-tap style flow with severity; optional note |
| Photos | Attach error screens / machine messages |
| History | View status and history |
| Targets | **Under 30 seconds** to submit a report |
| UI | Large touch targets, minimal form complexity |

**Optional patterns from discovery (not all mandatory in MVP):** QR/barcode scan to select equipment; favorites; quick templates (“Paper jam”, “Quality issue”, “Strange noise”); voice-to-text as optional.

---

## 9. Notifications (phased)

| Phase | Channels |
|-------|----------|
| **1 (MVP)** | Email (role-based); **in-app** real-time updates for active users |
| **2** | Microsoft Teams (e.g. webhooks / channel posts) |
| **3 (future)** | SMS for critical escalations (cost-sensitive; last priority) |

---

## 10. Parts and cost tracking

- **Catalog:** Part name, part number, optional cost and description (company-scoped in data model).  
- **Usage:** Technicians pick from dropdown when logging repairs (`PartsUsed` linkage to work logs).  
- **Reporting:** Cost per repair, per equipment, per time period; parts usage frequency.  
- **Future:** Extensible to full inventory management.

---

## 11. Reporting and analytics

### 11.1 Live dashboard

- Real-time equipment/module status  
- Color-coded indicators  
- Filters: location, zone, equipment type, status  

### 11.2 Executive reports (configurable periods)

- **MTTR** (Mean Time To Repair)  
- **MTBF** (Mean Time Between Failures)  
- Downtime by equipment (top offenders)  
- Downtime by module/component  
- Technician performance (workload, resolution times)  
- Peak failure times / shift patterns  
- Repair cost summary  

**Targets (from technical spec):** Executive report generation **under ~5 seconds** where applicable; dashboard real-time accuracy.

---

## 12. Authentication

| Phase | Method |
|-------|--------|
| **1** | Email + password; admin-controlled users |
| **2** | Microsoft Entra ID (Azure AD) SSO |

---

## 13. Data model

### 13.1 Core entities (relationships)

`Company` → `Building` → `Floor` → `Zone` → `Equipment` → `Module` → `Component`

Additional: `User`, `DowntimeEvent`, `WorkLog`, `Part`, `PartsUsed`, `FloorMap`.

### 13.2 Entity field summary (authoritative detail in YAML source)

| Entity | Key fields / notes |
|--------|---------------------|
| **Company** | id, name, timestamps |
| **Building** | company_id, name, address |
| **Floor** | building_id, name, floor_number |
| **Zone** | floor_id, name, zone_type enum |
| **Equipment** | zone_id, name, equipment_id string, type enum, status enum (`running` / `degraded` / `down`), photo_url, floor_map_x / floor_map_y |
| **Module** | equipment_id, name, module_id, status |
| **Component** | module_id, name, component_id |
| **User** | email, name, role enum, company_id, active |
| **DowntimeEvent** | equipment_id, optional module_id, reporter, acknowledger, resolver, severity, event status enum, description, photo_url, timestamps |
| **WorkLog** | downtime_event_id, technician_id, description, time_spent_minutes |
| **Part** | name, part_number, cost, company_id |
| **PartsUsed** | work_log_id, part_id, quantity, cost_at_time |
| **FloorMap** | floor_id, image_url, uploaded_by |

Enums and exact types are defined in PostgreSQL / Drizzle and in [`EQUIPMENT_DOWNTIME_SPEC.yaml`](EQUIPMENT_DOWNTIME_SPEC.yaml) (canonical machine-readable spec; [`project-template.yaml`](project-template.yaml) points to it).

---

## 14. Implementation phases and current status

### 14.1 Planned phases (from project template)

| Phase | Duration (estimate) | Feature bundle |
|-------|---------------------|----------------|
| **1 — MVP** | 4–6 weeks | Core downtime tracking, basic dashboard, mobile reporting, email notifications, simple user management |
| **2 — Visualization** | 2–3 weeks | Floor map drag-and-drop, equipment photos, zone management, Teams integration |
| **3 — Analytics** | 2 weeks | Executive reports, cost tracking, MTTR/MTBF |
| **4 — Integration** | 2 weeks | Microsoft SSO, advanced notifications |

### 14.2 As-built snapshot (from implementation summary, 2026-04-10)

**Done:**

- PostgreSQL schema (**14 tables**), indexes, **RLS**, audit and status-history triggers, reporting views (e.g. MTTR, technician performance, current status), seed data  
- Docker Compose: PostgreSQL + MinIO  
- Monorepo: pnpm, Turbo, TypeScript  
- `@edt/db`: Drizzle schema mirroring DB, migrations, seed script  
- `@edt/shared`: types, enums, permissions utilities  
- Backend foundation: Fastify, CORS, JWT, multipart, Swagger; auth routes (login, register, `/me`, password reset); health check; company context for RLS  

**Pending / in progress:**

- CRUD routes: companies, buildings/floors/zones, equipment, modules/components  
- Full downtime workflow, work logs, parts catalog, floor map APIs  
- Reporting APIs (MTTR, MTBF, technician metrics); **SSE** broadcasting  
- Next.js UI: auth, dashboard, equipment, floor map, workflows, reporting  
- MinIO integration, email, Entra SSO (phase 4), CSV/Excel bulk import  
- Frontend stack (planned in repo): Zustand, TanStack Query — to be wired as UI proceeds  

For commands, default test users, and next steps, see [Appendix A](#appendix-a-quick-start-and-demo-users).

---

## 15. Non-functional requirements

| Topic | Specification |
|-------|----------------|
| Wi‑Fi | Assumed reliable on the floor (drives responsive web vs offline PWA) |
| Devices | Phones, tablets, desktops |
| Camera | Enabled for operator photo capture |
| Offline | **Not** required (per template) |
| Performance | Page load **under ~3 seconds**; real-time updates via SSE (or equivalent); **50+** concurrent users targeted |

---

## 16. Success criteria

- Operators can submit a report in **under 30 seconds**  
- Technicians **acknowledge** within operational expectations; **15-minute** escalation if unacknowledged  
- **Full audit trail** for downtime-related events  
- **Real-time dashboard** reflects current status accurately  
- **Multi-location** hierarchy works end-to-end  
- Executive reports generate within **~5 seconds** (where applicable)  

---

## 17. Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Floor map drag-and-drop | Visual equipment placement |
| 2026-04-01 | Mobile-first operator interface | Fast on-floor reporting |
| 2026-04-10 | Hierarchical multi-tenant model (Company→Building→Floor→Zone) | Multiple locations, expansion |
| 2026-04-10 | Three-tier status (Running/Degraded/Down) | Partial failures; flexible rollup |
| 2026-04-10 | Equipment→Module→Component hierarchy | Admin-owned equipment; tech-owned sub-units |
| 2026-04-10 | First-to-acknowledge + 15-min escalation | Fair load and guaranteed response path |
| 2026-04-10 | Simple parts catalog with costs | Repair cost insight without full inventory |
| 2026-04-10 | Responsive web, not PWA | Reliable Wi‑Fi; simpler build |
| 2026-04-10 | Email + Teams first; SMS later | Cost and Microsoft ecosystem fit |
| 2026-04-10 | Containerized; on-prem or cloud | IT flexibility |
| 2026-04-10 | Iterative, fully-baked delivery | Quality over arbitrary deadline |

---

## Source documents

| File | Purpose |
|------|---------|
| [`PROJECT_PLAN.md`](PROJECT_PLAN.md) | Narrative requirements, add-on history, finalized requirements, decisions |
| [`EQUIPMENT_DOWNTIME_SPEC.yaml`](EQUIPMENT_DOWNTIME_SPEC.yaml) | **Canonical** machine-readable spec (complete YAML); [`project-template.yaml`](project-template.yaml) aliases to it |
| [`../../equipment-downtime-tracker/IMPLEMENTATION_SUMMARY.md`](../../equipment-downtime-tracker/IMPLEMENTATION_SUMMARY.md) | Repository layout, stack, completed vs pending, quick start |

---

## Appendix A — Quick start and demo users

Paths are relative to the **`equipment-downtime-tracker`** repo root:  
`/Users/Jack/.openclaw/workspace/agents/hep/equipment-downtime-tracker/`

```bash
cd infrastructure && docker-compose up -d
cd .. && pnpm install
pnpm db:generate && pnpm db:migrate
cd packages/db && pnpm seed
cd ../../apps/backend && pnpm dev
```

API docs (when backend is running): `http://localhost:3001/documentation`

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lineageconnect.com | admin123 |
| Supervisor | supervisor@lineageconnect.com | supervisor123 |
| Technician | technician@lineageconnect.com | tech123 |
| Operator | operator@lineageconnect.com | operator123 |

**Security:** Treat these as **development-only** credentials; rotate or remove before production.

---

## Appendix B — Original core requirements (retained for traceability)

- **Inventory:** Printers and finishing equipment with module-level tracking.  
- **Status:** Non-critical (impaired) vs critical down; dashboard visibility.  
- **Work logging:** Technician updates, time on repair, parts used, history for analytics.

---

*This file is a consolidation for readers and auditors. Authoritative field-level YAML is in `EQUIPMENT_DOWNTIME_SPEC.yaml`; living build status remains in `IMPLEMENTATION_SUMMARY.md`.*
