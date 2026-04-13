---
title: "Postage system implementation discussion"
date: 2026-02-24T19:25:37.050Z
local_date: 2/24/2026, 1:25:37 PM
meeting_id: 6734600
duration: Unknown
utterances: 674
state: COMPLETED
---

# Postage system implementation discussion

**Date:** Tuesday, February 24, 2026 at 01:25 PM
**Duration:** Unknown
**Utterances:** 674
**State:** COMPLETED

## Summary

## Summary

Software vendor James demonstrated his postal accounting and management system to Jason and colleagues (Sabrina, Brian) as a potential replacement for their current manual processes. The system integrates with their existing "Midnight" ERP/MRP to automate postage tracking, invoicing, and reconciliation. Jason's team currently relies heavily on manual work—particularly Heather's daily spreadsheet reconciliation and 4-hour daily meter reconciliations. The demo covered how the system would pull data from their NetSort sorters, Pitney meters, and mail.dat files, then push structured data back into Midnight for billing. James explained the three-month implementation timeline and need for equipment inventory and contract pricing details to proceed.

## Atmosphere

Professional and collaborative business meeting with engaged technical discussion. Jason drove the conversation with specific operational questions, while colleagues periodically contributed context about current pain points. Tone was solution-focused with mutual acknowledgment of implementation complexity.

## Key Takeaways

- **Current pain point:** Heather spends significant time manually reconciling postal data in spreadsheets; one employee spends ~4 hours daily on meter reconciliations, particularly struggling with USPS (not meter) reconciliation
- **Proposed solution:** James's system automates data flow from NetSort sorters, Pitney meters, and mail.dat files into structured exports for Midnight
- **Critical integration:** System uses customer ID + order number + version number in mail.dat header fields to auto-match and route data correctly
- **Data flow:** Creates daily CSV exports for Midnight import—one for services/invoice lines, one for postage details with UDF fields containing job IDs for traceability
- **Profile management:** James pushes order-specific profiles (9000/9-million series) to sorters; customer needs to provide initial NetSort profile setup
- **Customer portal option:** Would allow customers to enter their own counts and create transmittals, though Jason's team expressed skepticism about customer adoption given current struggles getting customers to complete basic forms
- **Implementation:** ~3 month timeline; Month 1: setup and data gathering, Month 2: testing and comparison, Month 3: go-live
- **Pricing model:** Based on sorter count/types and meter count/types; James requested equipment inventory and upcoming meter change plans (they're migrating from Pitney Business Manager to 360 analytics in coming months)
- **Support model:** Primarily remote with screen-sharing; on-site available if needed for additional cost

## Action Items

- Provide James with inventory: sorter types/quantities, meter types/quantities, and planned meter changes (Pitney 360 migration)
- Identify internal resource who knows contracted pricing structures to work with James on configuration
- Identify internal resource familiar with sorter/NetSort setup and profiles
- Coordinate with Jeff regarding existing uplift fee database that feeds into current pricing
- James to send pricing guidelines and formal proposal

