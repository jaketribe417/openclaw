---
name: model-routing
version: "2.0"
description: "Multi-model routing strategy for OpenClaw. Update this skill to reflect whichever models you have configured — it is a template, not a fixed recommendation."
tags: [optimization, routing, models, performance]
author: openclaw
---

# Model Routing Strategy

> **Update this skill** to reflect the models you actually have configured in `openclaw.json`. The table and configs below are examples — replace model names with your own.

## Model Strength Matrix (Example — Update for Your Models)

| Task Type | Primary Model | Fallback | Notes |
|---|---|---|---|
| **Agentic orchestration** | Your primary model | Your secondary | Strongest model available |
| **Software engineering** | Your primary model | Your secondary | Code-heavy tasks |
| **Terminal/shell tasks** | Your primary model | Your secondary | Shell and CLI tasks |
| **Math/reasoning** | Your primary model | — | Complex logic chains |
| **Structured JSON output** | Your fast model | — | Lighter, cheaper model works well here |
| **Cost-sensitive / heartbeat** | Your cheapest model | — | Routine scheduled tasks |

## Recommended Configurations (Example)

### Config 1: Single-model (Simplest)
- **All tasks**: One model configured in `openclaw.json`
- No routing needed — good starting point

### Config 2: Two-tier
- **Complex tasks**: Primary (strongest) model
- **Heartbeat / structured outputs**: Secondary (cheaper/faster) model

### Config 3: Three-tier
- **Primary orchestration**: Strongest model
- **Sub-agents / parallel tracks**: Mid-tier model
- **Heartbeat / routine checks**: Cheapest model

## Routing Decision Tree

```
New Task
|-- Simple question or structured output? --> Fast/cheap model
|-- Coding or multi-step orchestration?   --> Strongest model
|-- Heartbeat or scheduled task?          --> Cheapest model
|-- General/mixed?                        --> Default configured model
```

## Sub-Agent Profile Routing (Update to Match Your Models)

| Profile | Suggested Tier | Rationale |
|---|---|---|
| `researcher` | Mid-tier | Parallel spawning — cost adds up |
| `developer` | Strongest | Complex reasoning for code tasks |
| `hacker` | Mid-tier | Sufficient for security tasks |
| `heartbeat` | Cheapest | Routine scheduled checks |
| Default | Primary configured model | Sensible default |
