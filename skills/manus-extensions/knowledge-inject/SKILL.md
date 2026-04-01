---
name: knowledge-inject
version: 1.0.0
description: Auto-detect the current task domain and inject relevant best practices from the knowledge-base skill. Load at the start of every non-trivial task.
tags: [knowledge, domain, best-practices, auto-inject]
author: openclaw
---

# Knowledge Auto-Inject

At the start of any task, identify which domain applies from the list below and load the matching section from the `knowledge-base` skill before planning:

- **development** — any coding, scripting, debugging, API, deployment task
- **research** — any research, analysis, comparison, investigation task
- **writing** — any report, document, email, article, summary task
- **sysadmin** — any server, Docker, SSH, security, networking task
- **data_analysis** — any CSV, database, chart, pandas, SQL task

Load the relevant `knowledge-base` skill section by reading:
`~/.openclaw/skills/knowledge-base/SKILL.md`

Extract only the `## Domain: <name>` section that matches the current task. Inject those best practices into your planning before writing `todo.md`.

If multiple domains apply, load the top 2 by relevance.
